import type { Page, Route } from '@playwright/test'

export const APP_ORIGIN = 'http://127.0.0.1:4183'
export const API_ORIGIN = 'http://127.0.0.1:4179'

const corsHeaders = {
  'access-control-allow-origin': APP_ORIGIN,
  'access-control-allow-credentials': 'true',
  'access-control-allow-headers': 'authorization, content-type, x-client-platform',
  'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

export async function fulfillJson(
  route: Route,
  data: unknown,
  status = 200,
  headers: Record<string, string> = {},
) {
  await route.fulfill({ status, json: data, headers: { ...corsHeaders, ...headers } })
}

/** All API responses are local fixtures. Every other remote request is aborted. */
export async function mockApi(
  page: Page,
  handler: (route: Route, url: URL) => Promise<boolean>,
) {
  const unexpectedRequests: string[] = []
  const externalRequests: string[] = []

  await page.context().route('**/*', async (route) => {
    const url = new URL(route.request().url())
    if (url.origin === APP_ORIGIN) {
      await route.continue()
      return
    }
    if (url.origin === API_ORIGIN) {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: corsHeaders })
        return
      }
      if (await handler(route, url)) return
      unexpectedRequests.push(`${route.request().method()} ${url.pathname}${url.search}`)
      await fulfillJson(route, { error: 'No fixture for this request' }, 404)
      return
    }
    // Fonts, stock images and accidentally configured production URLs never leave the browser.
    externalRequests.push(url.href)
    await route.abort('blockedbyclient')
  })

  return { unexpectedRequests, externalRequests }
}
