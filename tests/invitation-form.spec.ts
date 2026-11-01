import { test, expect, type Page, type Route } from '@playwright/test'
import { fulfillJson, mockApi } from './support/e2e-api'

const destination = '/dashboard/events/1/invitations/new'
const invitationsPath = '/api/events/1/invitations'
const event = {
  id: 1, organizationId: 1, name: 'Réception de démonstration', type: 'OTHER',
  status: 'PUBLISHED', eventDate: '2099-12-15', hasImage: false,
}
const guests = [
  { id: 1, eventId: 1, firstName: 'Ada', lastName: 'Exemple', active: true },
  { id: 2, eventId: 1, firstName: 'Diane', lastName: 'Exemple', active: true },
]
const tables = [10, 20].map((id) => ({
  id, name: `Table ${id}`, capacity: 10, assignedGuests: 0, assignedCount: 0, remainingCapacity: 10,
}))
const paginated = (content: unknown[]) => ({
  content, currentPage: 0, totalPages: 1, totalElements: content.length,
})

async function setupInvitationForm(
  page: Page,
  handleMutation: (route: Route, url: URL) => Promise<void>,
  alreadyAssigned = false,
) {
  const mutations: { method: string; path: string; body: unknown }[] = []
  const network = await mockApi(page, async (route, url) => {
    const method = route.request().method()
    if (url.pathname === '/auth/login' && method === 'POST') {
      await fulfillJson(route, {
        accessToken: 'invitation-form-fixture-token', expiresIn: 900,
        user: {
          id: 1, organizationId: 1, firstName: 'Compte', lastName: 'Démo',
          email: 'organisateur@example.test', active: true, roles: ['ORGANIZER'],
          permissions: ['WEDDING_VIEW', 'INVITATION_VIEW', 'INVITATION_CREATE'],
        },
      })
      return true
    }
    if (method === 'GET') {
      if (url.pathname === '/api/events') {
        await fulfillJson(route, paginated([event]))
      } else if (url.pathname === '/api/events/1') {
        await fulfillJson(route, event)
      } else if (url.pathname === '/api/events/1/dashboard') {
        await fulfillJson(route, { eventId: 1, guests: { total: 2 } })
      } else if (url.pathname === '/api/events/1/guests') {
        await fulfillJson(route, paginated(guests))
      } else if (url.pathname === '/api/events/1/tables') {
        await fulfillJson(route, tables)
      } else if (url.pathname === '/api/events/1/assignments') {
        await fulfillJson(route, alreadyAssigned ? [{
          assignmentId: 30, guestId: 1, guestName: 'Ada Exemple',
          tableId: 99, tableName: 'Ancienne table', companions: 0,
        }] : [])
      } else if (url.pathname === '/api/events/1/image') {
        await route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg"/>' })
      } else if (url.pathname.startsWith('/api/platform/')) {
        await fulfillJson(route, { enabled: true })
      } else {
        return false
      }
      return true
    }
    if (method === 'POST' || method === 'PUT') {
      mutations.push({ method, path: url.pathname, body: route.request().postDataJSON() })
      await handleMutation(route, url)
      return true
    }
    return false
  })
  await page.goto(`/login?redirect=${encodeURIComponent(destination)}`)
  await page.getByLabel(/Email/).fill('organisateur@example.test')
  await page.getByLabel(/Mot de passe/).fill('mot-de-passe-simule')
  await page.locator('form').getByRole('button', { name: 'Se connecter', exact: true }).click()
  await expect(page).toHaveURL(destination)
  await page.getByLabel('Invité *', { exact: true }).selectOption('1')
  await page.getByLabel(/^Table \(optionnel\)/).selectOption('10')
  return { ...network, mutations }
}

test('invitation creation locks the selection and ignores a second submission', async ({ page }) => {
  let releaseCreation!: () => void
  const creationPending = new Promise<void>((resolve) => { releaseCreation = resolve })
  const api = await setupInvitationForm(page, async (route, url) => {
    if (url.pathname === invitationsPath) await creationPending
    await fulfillJson(route, { id: 101 })
  })
  await page.getByRole('button', { name: 'Créer', exact: true }).click()
  try {
    await expect.poll(() => api.mutations.length).toBe(1)
    await expect(page.getByLabel('Invité *', { exact: true })).toBeDisabled()
    await expect(page.getByLabel(/^Table \(optionnel\)/)).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Enregistrement…', exact: true })).toBeDisabled()
    // Enter/programmatic submit must also be guarded, beyond the disabled button.
    await page.locator('form').evaluate((form) => form.dispatchEvent(new Event('submit', { cancelable: true })))
    expect(api.mutations).toHaveLength(1)
  } finally {
    releaseCreation()
  }
  await expect.poll(() => api.mutations.length).toBe(2)
  expect(api.mutations).toEqual([
    { method: 'POST', path: invitationsPath, body: { guestId: 1 } },
    { method: 'POST', path: '/api/events/1/tables/10/assignments', body: { guestId: 1 } },
  ])
  expect(api.unexpectedRequests).toEqual([])
})

for (const alreadyAssigned of [false, true]) {
  test(`a failed ${alreadyAssigned ? 'move' : 'assignment'} can be retried without recreating the invitation`, async ({ page }) => {
    let placementAttempts = 0
    const api = await setupInvitationForm(page, async (route, url) => {
      if (url.pathname === invitationsPath) {
        await fulfillJson(route, { id: 101 })
      } else {
        placementAttempts += 1
        await fulfillJson(route,
          placementAttempts === 1 ? { error: 'Table complète' } : { assignmentId: 30, guestId: 1, tableId: 20 },
          placementAttempts === 1 ? 409 : 200,
        )
      }
    }, alreadyAssigned)
    await page.getByRole('button', { name: 'Créer', exact: true }).click()
    await expect(page.getByText('L’invitation a été créée, mais le placement a échoué.', { exact: false })).toBeVisible()
    // Recover by selecting another table with space available.
    await page.getByLabel(/^Table \(optionnel\)/).selectOption('20')
    await page.getByRole('button', { name: 'Terminer', exact: true }).click()
    await expect.poll(() => api.mutations.length).toBe(3)
    expect(api.mutations.filter((request) => request.path === invitationsPath)).toEqual([
      { method: 'POST', path: invitationsPath, body: { guestId: 1 } },
    ])
    expect(api.mutations.slice(1)).toEqual(alreadyAssigned ? [
      { method: 'PUT', path: '/api/events/1/assignments/30', body: { tableId: 10 } },
      { method: 'PUT', path: '/api/events/1/assignments/30', body: { tableId: 20 } },
    ] : [
      { method: 'POST', path: '/api/events/1/tables/10/assignments', body: { guestId: 1 } },
      { method: 'POST', path: '/api/events/1/tables/20/assignments', body: { guestId: 1 } },
    ])
    expect(api.unexpectedRequests).toEqual([])
  })
}

test('an invitation creation failure is retried before any placement request', async ({ page }) => {
  let creationAttempts = 0
  const api = await setupInvitationForm(page, async (route, url) => {
    if (url.pathname === invitationsPath) {
      creationAttempts += 1
      await fulfillJson(route,
        creationAttempts === 1 ? { error: 'Création indisponible' } : { id: 101 },
        creationAttempts === 1 ? 503 : 200,
      )
    } else {
      await fulfillJson(route, { assignmentId: 30, guestId: 1, tableId: 10 })
    }
  })
  await page.getByRole('button', { name: 'Créer', exact: true }).click()
  await expect(page.locator('form').getByText('Création indisponible', { exact: true })).toBeVisible()
  expect(api.mutations).toHaveLength(1)
  await page.getByRole('button', { name: 'Créer', exact: true }).click()
  await expect.poll(() => api.mutations.length).toBe(3)
  expect(api.mutations.map((request) => request.path)).toEqual([
    invitationsPath, invitationsPath, '/api/events/1/tables/10/assignments',
  ])
  expect(api.unexpectedRequests).toEqual([])
})
