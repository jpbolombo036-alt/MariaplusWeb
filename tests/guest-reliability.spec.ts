import { test, expect, type Page, type Route } from '@playwright/test'
import { fulfillJson, mockApi } from './support/e2e-api'

const guest = { id: 1, eventId: 1, firstName: 'Alice', lastName: 'Exemple', active: true }
const event = { id: 1, name: 'Réception', type: 'OTHER', status: 'ACTIVE', hasImage: false }
const paginated = (content: unknown[]) => ({ content, currentPage: 0, totalPages: 1, totalElements: content.length })
const deferred = () => {
  let resolve!: () => void
  const promise = new Promise<void>((done) => { resolve = done })
  return { promise, resolve }
}

async function setup(page: Page, destination: string, handler: (route: Route, url: URL) => Promise<boolean>) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const api = await mockApi(page, async (route, url) => {
    if (await handler(route, url)) return true
    const path = url.pathname
    if (path === '/auth/login') {
      await fulfillJson(route, { accessToken: 'guest-fixture', expiresIn: 900, user: {
        id: 1, organizationId: 1, firstName: 'Compte', lastName: 'Test', active: true,
        roles: ['ORGANIZER'], permissions: ['GUEST_VIEW', 'GUEST_CREATE', 'GUEST_UPDATE', 'WEDDING_VIEW'],
      } })
    } else if (path === '/api/events') await fulfillJson(route, paginated([event]))
    else if (path === '/api/events/1') await fulfillJson(route, event)
    else if (path === '/api/events/1/dashboard') await fulfillJson(route, { eventId: 1, guests: { total: 1 } })
    else if (path === '/api/events/1/guest-categories') await fulfillJson(route, paginated([]))
    else if (path === '/api/events/1/guests') await fulfillJson(route, paginated([guest]))
    else if (path.startsWith('/api/platform/')) await fulfillJson(route, { enabled: true })
    else return false
    return true
  })
  await page.goto(`/login?redirect=${encodeURIComponent(destination)}`)
  await page.getByLabel(/Email/).fill('organisateur@example.test')
  await page.getByLabel(/Mot de passe/).fill('mot-de-passe-simule')
  await page.locator('form').getByRole('button', { name: 'Se connecter', exact: true }).click()
  await expect(page).toHaveURL(destination)
  return { ...api, errors }
}

test('guest search keeps the latest result when an older response arrives last', async ({ page }) => {
  const first = deferred()
  const started = deferred()
  const api = await setup(page, '/dashboard/events/1/guests', async (route, url) => {
    if (!url.pathname.endsWith('/guests') || !url.searchParams.has('search')) return false
    const search = url.searchParams.get('search')
    if (search === 'ancienne') { started.resolve(); await first.promise }
    await fulfillJson(route, paginated([{ ...guest, firstName: search === 'ancienne' ? 'Ancienne' : 'Récente' }]))
    return true
  })
  const search = page.getByPlaceholder('Rechercher par nom, email, téléphone...')
  await search.fill('ancienne')
  await started.promise
  await search.fill('recente')
  await expect(page.getByRole('cell', { name: /Récente Exemple/ })).toBeVisible()
  const oldResponse = page.waitForResponse((response) => response.url().includes('search=ancienne'))
  first.resolve()
  await oldResponse
  // A read queued after the network response observes the completed Vue update.
  await expect(page.getByRole('cell', { name: /Récente Exemple/ })).toBeVisible()
  await expect(page.getByRole('cell', { name: /Ancienne Exemple/ })).toHaveCount(0)
  expect(api.errors).toEqual([])
  expect(api.unexpectedRequests).toEqual([])
})

test('guest list offers a retry after a network failure', async ({ page }) => {
  let fail = true
  const api = await setup(page, '/dashboard/events/1/guests', async (route, url) => {
    if (!url.pathname.endsWith('/guests') || !fail) return false
    await route.abort('failed')
    return true
  })
  await expect(page.getByRole('alert')).toContainText('Impossible de contacter le serveur')
  await expect(page.getByRole('heading', { name: 'Aucun invité', exact: true })).toHaveCount(0)
  fail = false
  await page.getByRole('button', { name: 'Réessayer' }).click()
  await expect(page.getByRole('cell', { name: /Alice Exemple/ })).toBeVisible()
  expect(api.errors).toEqual([])
})

test('guest creation ignores repeated submits and allows retry after failure', async ({ page }) => {
  const pending = deferred()
  let writes = 0
  const api = await setup(page, '/dashboard/events/1/guests/new', async (route, url) => {
    if (!url.pathname.endsWith('/guests') || route.request().method() !== 'POST') return false
    writes++
    if (writes === 1) await pending.promise
    await fulfillJson(route, { error: 'Enregistrement temporairement indisponible' }, 503)
    return true
  })
  await page.getByPlaceholder('Prénom', { exact: true }).fill('Ada')
  await page.getByPlaceholder('Nom', { exact: true }).fill('Exemple')
  await page.getByRole('button', { name: 'Ajouter', exact: true }).click()
  try {
    await expect.poll(() => writes).toBe(1)
    await expect(page.getByPlaceholder('Prénom', { exact: true })).toBeDisabled()
    await page.locator('form').evaluate((form) => form.dispatchEvent(new Event('submit', { cancelable: true })))
    expect(writes).toBe(1)
  } finally { pending.resolve() }
  await expect(page.getByRole('alert')).toContainText('Enregistrement temporairement indisponible')
  await expect(page.getByPlaceholder('Prénom', { exact: true })).toHaveValue('Ada')
  await page.getByRole('button', { name: 'Ajouter', exact: true }).click()
  await expect.poll(() => writes).toBe(2)
  expect(api.errors).toEqual([])
  expect(api.unexpectedRequests).toEqual([])
})

test('guest edition cannot submit during loading or when the guest is missing', async ({ page }) => {
  const pending = deferred()
  let writes = 0
  const api = await setup(page, '/dashboard/events/1/guests/99/edit', async (route, url) => {
    if (!url.pathname.includes('/guests')) return false
    if (route.request().method() !== 'GET') { writes++; await fulfillJson(route, {}); return true }
    await pending.promise
    await fulfillJson(route, paginated([]))
    return true
  })
  try {
    await expect(page.getByPlaceholder('Prénom', { exact: true })).toBeDisabled()
    await page.locator('form').evaluate((form) => form.dispatchEvent(new Event('submit', { cancelable: true })))
    expect(writes).toBe(0)
  } finally { pending.resolve() }
  await expect(page.getByRole('alert')).toContainText('Cet invité est introuvable.')
  await expect(page.getByRole('button', { name: 'Enregistrer', exact: true })).toBeDisabled()
  expect(api.errors).toEqual([])
})

