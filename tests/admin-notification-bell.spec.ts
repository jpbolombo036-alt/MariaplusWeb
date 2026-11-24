import { test, expect, type Page } from '@playwright/test'
import { APP_ORIGIN, fulfillJson, mockApi } from './support/e2e-api'

const noContent = { status: 204, headers: { 'access-control-allow-origin': APP_ORIGIN, 'access-control-allow-credentials': 'true' } }
const ORGANIZATION = { id: 9, name: 'Agence Lumière', email: 'contact@lumiere.test', phone: null, active: true, createdAt: '2026-11-24T10:00:00' }

function bellFixture() {
  return {
    items: [
      { id: 2, type: 'CONTACT_MESSAGE', title: 'Message de Nadia Nouvelle — Agence Lumière',
        message: 'Bonjour, pouvez-vous activer mon compte ?', organizationId: 9, userId: 5,
        senderEmail: 'nadia@example.test', createdAt: '2026-11-24T10:05:00', readAt: null as string | null },
      { id: 1, type: 'ORGANIZATION_REGISTERED', title: 'Nouvelle organisation à activer : Agence Lumière',
        message: 'Nadia Nouvelle (nadia@example.test) vient de créer un compte.', organizationId: 9, userId: 5,
        senderEmail: 'nadia@example.test', createdAt: '2026-11-24T10:00:00', readAt: null as string | null },
    ],
    reads: [] as number[],
    readAll: 0,
    sent: [] as unknown[],
    recipients: 1,
  }
}

async function signIn(page: Page, roles: string[], bell = bellFixture()) {
  const user = {
    id: 1, organizationId: 1, firstName: 'Admin', lastName: 'Plateforme', email: 'admin@example.test',
    active: true, roles, permissions: ['WEDDING_VIEW', 'ORGANIZATION_VIEW'],
  }
  const fixture = await mockApi(page, async (route, url) => {
    const method = route.request().method()
    if (url.pathname === '/auth/login') {
      await fulfillJson(route, { accessToken: 'fixture-token', expiresIn: 900, user })
    } else if (url.pathname === '/auth/refresh') {
      // Stands in for the HttpOnly session cookie on a full page load.
      await fulfillJson(route, { accessToken: 'fixture-token', expiresIn: 900 })
    } else if (url.pathname === '/auth/me') {
      await fulfillJson(route, user)
    } else if (url.pathname === '/api/admin/notifications' && method === 'GET') {
      await fulfillJson(route, { unreadCount: bell.items.filter((n) => !n.readAt).length, items: bell.items })
    } else if (/^\/api\/admin\/notifications\/\d+\/read$/.test(url.pathname) && method === 'PATCH') {
      const id = Number(url.pathname.split('/')[4])
      bell.reads.push(id)
      bell.items.find((n) => n.id === id)!.readAt = '2026-11-24T11:00:00'
      await route.fulfill(noContent)
    } else if (url.pathname === '/api/admin/notifications/read-all' && method === 'POST') {
      bell.readAll++
      bell.items.forEach((n) => { n.readAt ??= '2026-11-24T11:00:00' })
      await route.fulfill(noContent)
    } else if (url.pathname === '/api/admin/messages' && method === 'POST') {
      bell.sent.push(route.request().postDataJSON())
      await fulfillJson(route, { recipients: bell.recipients })
    } else if (url.pathname === '/api/organizations') {
      await fulfillJson(route, [ORGANIZATION])
    } else if (url.pathname === '/api/events') {
      await fulfillJson(route, { content: [], totalPages: 1, currentPage: 0, totalElements: 0 })
    } else if (url.pathname.startsWith('/api/platform/') || url.pathname.startsWith('/api/admin/')) {
      await fulfillJson(route, { enabled: true })
    } else return false
    return true
  })
  await page.goto('/login?redirect=%2Fdashboard')
  await page.getByLabel(/Email/).fill('admin@example.test')
  await page.getByLabel(/Mot de passe/).fill('fixture-password')
  await page.locator('form').getByRole('button', { name: 'Se connecter', exact: true }).click()
  await expect(page.getByRole('heading', { name: /Bonjour, Admin/ })).toBeVisible()
  return { fixture, bell }
}

test('super admin sees new registrations and messages, and replies from the bell', async ({ page }) => {
  const { bell } = await signIn(page, ['SUPER_ADMIN'])

  await expect(page.getByTestId('bell-badge')).toHaveText('2')
  await page.getByRole('button', { name: /Notifications, 2 non lue/ }).click()
  const panel = page.getByRole('dialog', { name: 'Notifications' })
  await expect(panel.getByText('Nouvelle organisation à activer : Agence Lumière')).toBeVisible()
  await expect(panel.getByText('Bonjour, pouvez-vous activer mon compte ?')).toBeVisible()

  // A contact message opens the reply to that organization.
  await panel.getByText('Message de Nadia Nouvelle — Agence Lumière').click()
  await expect(page.getByRole('dialog', { name: 'Écrire à Agence Lumière' })).toBeVisible()
  await expect(page).toHaveURL(/\/dashboard\/admin\/organizations$/)
  await expect.poll(() => bell.reads).toEqual([2])
  await expect(page.getByTestId('bell-badge')).toHaveText('1')
  await page.getByRole('button', { name: 'Annuler' }).click()

  await page.getByRole('button', { name: /Notifications, 1 non lue/ }).click()
  await page.getByRole('button', { name: 'Tout marquer comme lu' }).click()
  await expect(page.getByTestId('bell-badge')).toHaveCount(0)
  expect(bell.readAll).toBe(1)
})

test('super admin writes to one organization', async ({ page }) => {
  const { bell } = await signIn(page, ['SUPER_ADMIN'])
  await page.goto('/dashboard/admin/organizations')

  await page.getByRole('button', { name: 'Écrire à Agence Lumière' }).click()
  const dialog = page.getByRole('dialog', { name: 'Écrire à Agence Lumière' })
  await expect(dialog.getByLabel('Titre')).toBeFocused()
  await dialog.getByLabel('Titre').fill(' Compte activé ')
  await dialog.getByLabel('Message').fill('Vous pouvez créer vos événements.')
  await dialog.getByRole('button', { name: 'Envoyer', exact: true }).click()

  await expect(dialog).toHaveCount(0)
  await expect(page.getByText('Message envoyé à 1 organisateur.')).toBeVisible()
  expect(bell.sent).toEqual([{ audience: 'ORGANIZATION', organizationId: 9, title: 'Compte activé', message: 'Vous pouvez créer vos événements.' }])
})

test('a message to all organizers needs a second confirmation click', async ({ page }) => {
  const bell = bellFixture()
  bell.recipients = 12
  await signIn(page, ['SUPER_ADMIN'], bell)
  await page.goto('/dashboard/admin/organizations')

  await page.getByRole('button', { name: 'Message à tous les organisateurs' }).click()
  const dialog = page.getByRole('dialog', { name: 'Message à tous les organisateurs' })
  await dialog.getByLabel('Titre').fill('Maintenance')
  await dialog.getByLabel('Message').fill('Ce soir à 22h.')
  await dialog.getByRole('button', { name: 'Envoyer à tous' }).click()

  await expect(dialog.getByRole('alert')).toContainText('tous les organisateurs')
  expect(bell.sent).toEqual([])
  await dialog.getByRole('button', { name: "Confirmer l'envoi à tous" }).click()

  await expect(page.getByText('Message envoyé à 12 organisateurs.')).toBeVisible()
  expect(bell.sent).toEqual([{ audience: 'ALL_ORGANIZERS', organizationId: null, title: 'Maintenance', message: 'Ce soir à 22h.' }])
})

test('organizers never call the admin notifications API', async ({ page }) => {
  const { fixture } = await signIn(page, ['ORGANISATEUR'])
  await expect(page.getByRole('button', { name: 'Notifications' })).toBeVisible()
  await expect(page.getByTestId('bell-badge')).toHaveCount(0)
  expect(fixture.unexpectedRequests).toEqual([])
  const calls = await page.evaluate(() => performance.getEntriesByType('resource')
    .map((e) => e.name).filter((n) => n.includes('/api/admin/notifications')))
  expect(calls).toEqual([])
})
