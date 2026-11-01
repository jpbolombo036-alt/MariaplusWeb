import { test, expect, type Locator, type Page } from '@playwright/test'
import { API_ORIGIN, fulfillJson, mockApi } from './support/e2e-api'

// These credentials and tokens exist only in the intercepted API below.
const email = 'organisateur@example.test'
const password = 'mot-de-passe-simule'
const accessToken = 'e2e-access-token-memory-only'
const bulkPath = '/api/events/1/invitations/send-bulk'
const batchId = 87

const event = {
  id: 1, organizationId: 1, name: 'Réception de démonstration', type: 'OTHER',
  status: 'PUBLISHED', eventDate: '2099-12-15', hasImage: false, guestCount: 4,
}
const guests = ['Ada', 'Béatrice', 'Chloé', 'Diane'].map((firstName, index) => ({
  id: index + 1, eventId: 1, firstName, lastName: 'Exemple',
  phone: `+3310000000${index}`, active: true,
}))
const invitations = guests.map((guest) => ({
  id: 100 + guest.id, eventId: 1, guestId: guest.id,
  invitationCode: `DEMO-${guest.id}`, status: 'GENERATED', reminderCount: 0,
}))
const logBase = { channel: 'WHATSAPP', status: 'FAILED' }
const logs = [
  { ...logBase, id: 1, guestId: 1, invitationId: 101, errorMessage: 'Numéro inaccessible', errorCode: 131026 },
  { ...logBase, id: 2, guestId: 2, invitationId: 102, errorMessage: 'Échec sans code Meta' },
  { ...logBase, id: 3, guestId: 3, invitationId: 103, errorMessage: 'Échec avec code inconnu', errorCode: 0 },
  { id: 4, guestId: 4, invitationId: 104, channel: 'WHATSAPP', status: 'DELIVERED' },
]
const completedBatch = {
  id: batchId, weddingId: 1, channel: 'WHATSAPP', status: 'COMPLETED',
  totalCount: 4, sentCount: 1, deliveredCount: 1, failedCount: 3, skippedCount: 0,
}
const paginated = (content: unknown[]) => ({
  content, currentPage: 0, totalPages: 1, totalElements: content.length,
})

async function setupWhatsappApi(page: Page) {
  const requests: { method: string; path: string; authorization?: string; body: unknown }[] = []
  const network = await mockApi(page, async (route, url) => {
    const request = route.request()
    const method = request.method()
    requests.push({
      method, path: url.pathname + url.search,
      authorization: request.headers().authorization,
      body: request.postData() ? request.postDataJSON() : null,
    })
    if (url.pathname === '/auth/login' && method === 'POST') {
      await fulfillJson(route, {
        accessToken, expiresIn: 900, tokenType: 'Bearer',
        user: {
          id: 1, organizationId: 1, firstName: 'Compte', lastName: 'Démo', email,
          active: true, roles: ['ORGANIZER'],
          permissions: ['WEDDING_VIEW', 'GUEST_VIEW', 'INVITATION_VIEW', 'INVITATION_SEND', 'INVITATION_CREATE'],
        },
      }, 200, { 'set-cookie': 'mp_refresh=e2e-refresh-cookie; HttpOnly; SameSite=Lax; Path=/' })
      return true
    }
    if (method === 'GET') {
      if (url.pathname === '/api/events') {
        await fulfillJson(route, paginated([event]))
      } else if (url.pathname === '/api/events/1') {
        await fulfillJson(route, event)
      } else if (url.pathname === '/api/events/1/dashboard') {
        await fulfillJson(route, { eventId: 1, guests: { total: 4 }, invitations: { total: 4 } })
      } else if (url.pathname === '/api/events/1/guests') {
        await fulfillJson(route, paginated(guests))
      } else if (url.pathname === '/api/events/1/invitations') {
        await fulfillJson(route, paginated(invitations))
      } else if (url.pathname === '/api/events/1/guest-categories') {
        await fulfillJson(route, paginated([]))
      } else if (url.pathname === '/api/events/1/image') {
        await route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>' })
      } else if (url.pathname === '/api/platform/event-creation-enabled' || url.pathname === '/api/platform/whatsapp-enabled') {
        await fulfillJson(route, { enabled: true })
      } else if (url.pathname === `${bulkPath}/${batchId}`) {
        await fulfillJson(route, completedBatch)
      } else if (url.pathname === `${bulkPath}/${batchId}/logs`) {
        await fulfillJson(route, paginated(logs))
      } else {
        return false
      }
      return true
    }
    if (url.pathname === bulkPath && method === 'POST') {
      await fulfillJson(route, {
        ...completedBatch, status: 'PENDING', sentCount: 0, deliveredCount: 0, failedCount: 0,
      }, 202)
      return true
    }
    return false
  })
  return { ...network, requests }
}

async function login(page: Page, destination: string) {
  await page.goto(`/login?redirect=${encodeURIComponent(destination)}`)
  await page.getByLabel(/Email/).fill(email)
  await page.getByLabel(/Mot de passe/).fill(password)
  await page.locator('form').getByRole('button', { name: 'Se connecter', exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`${destination}$`))

  const cookie = (await page.context().cookies(API_ORIGIN)).find((item) => item.name === 'mp_refresh')
  expect(cookie).toMatchObject({ value: 'e2e-refresh-cookie', httpOnly: true })
  // The application carries the access token in memory after its real login flow.
  const storage = await page.evaluate(() => ({ ...localStorage }))
  expect(Object.values(storage)).not.toContain(accessToken)
}

async function assertFailureMessages(container: Locator, rowSelector: string) {
  const coded = container.locator(rowSelector).filter({ hasText: 'Ada Exemple' })
  await expect(coded).toContainText('Numéro inaccessible')
  await expect(coded).toContainText('[131026]')

  const absent = container.locator(rowSelector).filter({ hasText: 'Béatrice Exemple' })
  await expect(absent).toContainText('Échec sans code Meta')
  await expect(absent).not.toContainText(/\[\d+\]/)

  const zero = container.locator(rowSelector).filter({ hasText: 'Chloé Exemple' })
  await expect(zero).toContainText('Échec avec code inconnu')
  await expect(zero).not.toContainText(/\[\d+\]/)
}

function assertRequests(api: Awaited<ReturnType<typeof setupWhatsappApi>>, expectedIds: number[] | null) {
  expect(api.unexpectedRequests).toEqual([])
  expect(api.requests.find((request) => request.path === '/auth/login')?.body).toEqual({ email, password })
  expect(api.requests.filter((request) => request.path.startsWith('/auth/')).map((request) => request.path)).toEqual(['/auth/login'])
  expect(api.requests.filter((request) => request.path.startsWith('/api/')).every((request) => request.authorization === `Bearer ${accessToken}`)).toBe(true)
  const bulk = api.requests.filter((request) => request.method === 'POST' && request.path === bulkPath)
  expect(bulk).toHaveLength(1)
  expect(bulk[0].body).toEqual({
    channel: 'WHATSAPP', categoryId: null, invitationIds: expectedIds, resend: false, onlyPendingRsvp: false,
  })
  expect(api.requests.some((request) => request.path === `${bulkPath}/${batchId}`)).toBe(true)
  expect(api.requests.some((request) => request.path === `${bulkPath}/${batchId}/logs?size=200`)).toBe(true)
  expect(api.externalRequests.some((url) => /railway\.app|vercel\.app/.test(url))).toBe(false)
}

test.describe('WhatsApp batch errors with a simulated API', () => {
  test('selected invitations show the Meta error code, and omit missing or zero codes', async ({ page }) => {
    const api = await setupWhatsappApi(page)
    await login(page, '/dashboard/events/1/invitations/send')

    const send = page.getByRole('button', { name: /Envoyer sur WhatsApp \(/ })
    await expect(send).toBeDisabled()
    await page.getByRole('checkbox', { name: /Tous les invités \(4\)/ }).check()
    await expect(send).toHaveText('Envoyer sur WhatsApp (4)')
    await send.click()

    await expect(page.getByRole('button', { name: 'Terminer', exact: true })).toBeVisible()
    await assertFailureMessages(page.locator('main'), 'li')
    await expect(page.locator('main li').filter({ hasText: 'Diane Exemple' })).toHaveCount(0)
    assertRequests(api, [101, 102, 103, 104])
  })

  test('the bulk-send modal shows the same code and messages after polling its own batch', async ({ page }) => {
    const api = await setupWhatsappApi(page)
    await login(page, '/dashboard/events/1/invitations')

    await page.getByRole('button', { name: /Envoyer en masse$/ }).click()
    const panel = page.getByRole('heading', { name: 'Envoyer en masse (WhatsApp)', exact: true }).locator('..')
    await panel.getByRole('radio', { name: /Toutes les invitations/ }).check()
    await panel.getByRole('button', { name: /Envoyer$/ }).click()

    await expect(panel.getByRole('button', { name: 'Terminer', exact: true })).toBeVisible()
    await assertFailureMessages(panel, 'div.px-3.py-2')
    await expect(panel.locator('[title="Numéro inaccessible [code 131026]"]')).toBeVisible()
    await expect(panel.locator('div.px-3.py-2').filter({ hasText: 'Diane Exemple' })).toContainText('Livrée')
    assertRequests(api, null)
  })
})
