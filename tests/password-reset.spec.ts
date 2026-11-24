import { test, expect, type Page } from '@playwright/test'
import { APP_ORIGIN, fulfillJson, mockApi } from './support/e2e-api'

const noContent = { status: 204, headers: { 'access-control-allow-origin': APP_ORIGIN, 'access-control-allow-credentials': 'true' } }

async function login(page: Page, email: string) {
  await page.goto('/login?redirect=%2Fdashboard')
  await page.getByLabel(/Email/).first().fill(email)
  await page.getByLabel('Mot de passe', { exact: true }).fill('Abcd-Efgh-Jkmn')
  await page.locator('form').getByRole('button', { name: 'Se connecter', exact: true }).click()
}

test('a user with a temporary password must choose a new one before anything else', async ({ page }) => {
  const changes: unknown[] = []
  const user = {
    id: 5, organizationId: 9, firstName: 'Nadia', lastName: 'Nouvelle', email: 'nadia@example.test',
    active: true, roles: ['ORGANISATEUR'], permissions: ['WEDDING_VIEW'], mustChangePassword: true,
  }
  const fixture = await mockApi(page, async (route, url) => {
    if (url.pathname === '/auth/login') {
      await fulfillJson(route, { accessToken: 'fixture-token', expiresIn: 900, user })
    } else if (url.pathname === '/api/users/me/password' && route.request().method() === 'PUT') {
      changes.push(route.request().postDataJSON())
      await fulfillJson(route, {})
    } else if (url.pathname === '/api/events') {
      await fulfillJson(route, { content: [], totalPages: 1, currentPage: 0, totalElements: 0 })
    } else if (url.pathname.startsWith('/api/platform/')) {
      await fulfillJson(route, { enabled: true })
    } else return false
    return true
  })

  await login(page, 'nadia@example.test')
  await expect(page).toHaveURL(/\/change-password\?redirect=(%2F|\/)dashboard$/)
  await expect(page.getByRole('heading', { name: 'Choisissez votre nouveau mot de passe' })).toBeVisible()

  await page.getByLabel('Mot de passe temporaire').fill('Abcd-Efgh-Jkmn')
  await page.getByLabel('Nouveau mot de passe', { exact: true }).fill('MonNouveauSecret1')
  await page.getByLabel('Confirmer le nouveau mot de passe').fill('Different123')
  await page.getByRole('button', { name: 'Enregistrer et continuer' }).click()
  await expect(page.getByRole('alert')).toContainText('ne correspondent pas')

  await page.getByLabel('Nouveau mot de passe', { exact: true }).fill('Abcd-Efgh-Jkmn')
  await page.getByLabel('Confirmer le nouveau mot de passe').fill('Abcd-Efgh-Jkmn')
  await page.getByRole('button', { name: 'Enregistrer et continuer' }).click()
  await expect(page.getByRole('alert')).toContainText('différent du mot de passe temporaire')
  expect(changes).toEqual([])

  await page.getByLabel('Nouveau mot de passe', { exact: true }).fill('MonNouveauSecret1')
  await page.getByLabel('Confirmer le nouveau mot de passe').fill('MonNouveauSecret1')
  await page.getByRole('button', { name: 'Enregistrer et continuer' }).click()

  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole('heading', { name: /Bonjour, Nadia/ })).toBeVisible()
  expect(changes).toEqual([{ oldPassword: 'Abcd-Efgh-Jkmn', newPassword: 'MonNouveauSecret1' }])
  expect(fixture.unexpectedRequests).toEqual([])
})

test('super admin answers a forgotten-password request from the bell', async ({ page }) => {
  let issued = 0
  const bell = [{
    id: 3, type: 'PASSWORD_RESET_REQUEST', title: 'Mot de passe oublié : Nadia Nouvelle',
    message: 'Demande de réinitialisation du mot de passe. Téléphone : 0812345678.', organizationId: null, userId: 7,
    senderEmail: 'nadia@example.test', createdAt: '2026-11-24T10:00:00', readAt: null as string | null,
  }]
  await mockApi(page, async (route, url) => {
    const method = route.request().method()
    if (url.pathname === '/auth/login') {
      await fulfillJson(route, { accessToken: 'fixture-token', expiresIn: 900, user: {
        id: 1, organizationId: null, firstName: 'Admin', lastName: 'Plateforme', email: 'admin@example.test',
        active: true, roles: ['SUPER_ADMIN'], permissions: ['USER_VIEW'],
      } })
    } else if (url.pathname === '/api/admin/notifications' && method === 'GET') {
      await fulfillJson(route, { unreadCount: bell.filter((n) => !n.readAt).length, items: bell })
    } else if (url.pathname === '/api/admin/notifications/3/read') {
      bell[0].readAt = '2026-11-24T10:10:00'
      await route.fulfill(noContent)
    } else if (url.pathname === '/api/users' && method === 'GET') {
      // Nadia is not on the first page: the dialog must fetch her by id.
      await fulfillJson(route, { content: [], totalPages: 3, currentPage: 0, totalElements: 60 })
    } else if (url.pathname === '/api/users/7' && method === 'GET') {
      await fulfillJson(route, { id: 7, firstName: 'Nadia', lastName: 'Nouvelle', email: 'nadia@example.test',
        phone: '0812345678', active: true, roles: ['ORGANISATEUR'] })
    } else if (url.pathname === '/api/users/7/temporary-password' && method === 'POST') {
      issued++
      await fulfillJson(route, { temporaryPassword: 'Abcd-Efgh-Jkmn', firstName: 'Nadia', lastName: 'Nouvelle',
        email: 'nadia@example.test', phone: '0812345678', whatsappNumber: '243812345678' })
    } else if (url.pathname === '/api/organizations') {
      await fulfillJson(route, [])
    } else if (url.pathname === '/api/events') {
      await fulfillJson(route, { content: [], totalPages: 1, currentPage: 0, totalElements: 0 })
    } else if (url.pathname.startsWith('/api/platform/') || url.pathname.startsWith('/api/admin/')) {
      await fulfillJson(route, { enabled: true })
    } else return false
    return true
  })

  await login(page, 'admin@example.test')
  await page.getByRole('button', { name: /Notifications, 1 non lue/ }).click()
  await page.getByRole('dialog', { name: 'Notifications' }).getByText('Mot de passe oublié : Nadia Nouvelle').click()

  await expect(page).toHaveURL(/\/dashboard\/admin\/users$/)
  const dialog = page.getByRole('dialog', { name: 'Réinitialiser le mot de passe' })
  await expect(dialog).toContainText('nadia@example.test')
  expect(issued).toBe(0) // nothing happens before the explicit click

  await dialog.getByRole('button', { name: 'Générer un mot de passe temporaire' }).click()
  const result = page.getByRole('dialog', { name: 'Mot de passe temporaire' })
  await expect(result.getByTestId('temporary-password')).toHaveText('Abcd-Efgh-Jkmn')
  const whatsapp = result.getByRole('link', { name: /Envoyer par WhatsApp/ })
  await expect(whatsapp).toHaveAttribute('href', /^https:\/\/wa\.me\/243812345678\?text=.*Abcd-Efgh-Jkmn/)
  expect(issued).toBe(1)

  await result.getByRole('button', { name: 'Terminé' }).click()
  await expect(page.getByTestId('temporary-password')).toHaveCount(0)
})
