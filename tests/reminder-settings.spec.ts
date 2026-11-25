import { test, expect, type Page } from '@playwright/test'
import { fulfillJson, mockApi } from './support/e2e-api'

const SERVER = { enabled: true, firstReminderEnabled: true, firstReminderDays: 7, eveEnabled: true, dayOfEnabled: true, sendHour: 8, timeZone: 'Africa/Kinshasa' }
const EMPTY = { enabled: null, firstReminderEnabled: null, firstReminderDays: null, eveEnabled: null, dayOfEnabled: null, sendHour: null, timeZone: null }

async function signInOrganizer(page: Page) {
  const saved: { path: string; body: Record<string, unknown> }[] = []
  const event = { id: 4, name: 'Mariage de Nadia', type: 'WEDDING', status: 'PUBLISHED', eventDate: '2099-12-15', organizationId: 9 }
  const user = {
    id: 5, organizationId: 9, firstName: 'Nadia', lastName: 'Nouvelle', email: 'nadia@example.test',
    active: true, roles: ['ORGANISATEUR'], permissions: ['WEDDING_VIEW', 'WEDDING_UPDATE'],
  }
  await mockApi(page, async (route, url) => {
    const method = route.request().method()
    if (url.pathname === '/auth/login') {
      await fulfillJson(route, { accessToken: 'fixture-token', expiresIn: 900, user })
    } else if (url.pathname === '/auth/refresh') {
      // Stands in for the HttpOnly session cookie on a full page load.
      await fulfillJson(route, { accessToken: 'fixture-token', expiresIn: 900 })
    } else if (url.pathname === '/auth/me') {
      await fulfillJson(route, user)
    } else if (url.pathname === '/api/organizations/9/reminder-settings' && method === 'GET') {
      await fulfillJson(route, { scope: 'ORGANIZATION', scopeId: 9, settings: EMPTY, inherited: SERVER, timeZoneEditable: true })
    } else if (/\/reminder-settings$/.test(url.pathname) && method === 'PUT') {
      const body = route.request().postDataJSON()
      saved.push({ path: url.pathname, body })
      await fulfillJson(route, { settings: body, inherited: SERVER, timeZoneEditable: !url.pathname.startsWith('/api/events') })
    } else if (url.pathname === '/api/events/4/reminder-settings' && method === 'GET') {
      await fulfillJson(route, { scope: 'EVENT', scopeId: 4, settings: EMPTY,
        inherited: { ...SERVER, eveEnabled: false, timeZone: 'Africa/Lubumbashi' }, timeZoneEditable: false })
    } else if (url.pathname === '/api/events') {
      await fulfillJson(route, { content: [event], totalPages: 1, currentPage: 0, totalElements: 1 })
    } else if (url.pathname === '/api/events/4') {
      await fulfillJson(route, event)
    } else if (url.pathname === '/api/events/4/dashboard') {
      await fulfillJson(route, { eventId: 4, guests: { total: 0 }, invitations: { total: 0 }, attendance: { checkedIn: 0 } })
    } else if (url.pathname.startsWith('/api/platform/')) {
      await fulfillJson(route, { enabled: true })
    } else return false
    return true
  })
  await page.goto('/login?redirect=%2Fdashboard%2Fevents')
  await page.getByLabel(/Email/).first().fill('nadia@example.test')
  await page.getByLabel('Mot de passe', { exact: true }).fill('fixture-password')
  await page.locator('form').getByRole('button', { name: 'Se connecter', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Réglages des rappels' })).toBeVisible()
  return saved
}

test('an organizer sets the reminders of the organization, inheriting the platform values', async ({ page }) => {
  const saved = await signInOrganizer(page)
  await page.getByRole('button', { name: 'Réglages des rappels' }).click()
  const dialog = page.getByRole('dialog', { name: "Rappels d'événements" })

  await expect(dialog.getByLabel('Rappels', { exact: true })).toHaveValue('inherit')
  await expect(dialog.getByLabel('Rappel la veille').locator('option:checked')).toHaveText('Hériter (Oui)')
  await expect(dialog.getByTestId('reminder-summary')).toContainText('7 jours avant, la veille et le jour J, à 08h (Africa/Kinshasa)')

  await dialog.getByLabel('Rappel la veille').selectOption('off')
  await dialog.getByLabel("Heure d'envoi").selectOption('18')
  await dialog.getByLabel('Jours avant le premier rappel').selectOption('10')
  await dialog.getByLabel('Fuseau horaire').selectOption('Africa/Lubumbashi')
  await expect(dialog.getByTestId('reminder-summary')).toContainText('10 jours avant et le jour J, à 18h (Africa/Lubumbashi)')

  await dialog.getByRole('button', { name: 'Enregistrer' }).click()
  await expect(dialog).toHaveCount(0)
  await expect(page.getByText('Réglages des rappels enregistrés.')).toBeVisible()
  expect(saved).toEqual([{ path: '/api/organizations/9/reminder-settings', body: {
    enabled: null, firstReminderEnabled: null, firstReminderDays: 10, eveEnabled: false,
    dayOfEnabled: null, sendHour: 18, timeZone: 'Africa/Lubumbashi',
  } }])
})

test('an event inherits from its organization and has no time zone of its own', async ({ page }) => {
  const saved = await signInOrganizer(page)
  await page.goto('/dashboard/events/4')
  await page.getByRole('button', { name: 'Rappels de cet événement' }).click()
  const dialog = page.getByRole('dialog', { name: "Rappels d'événements" })

  await expect(dialog.getByText("Fuseau horaire : celui de l'organisation (Lubumbashi (UTC+2)).")).toBeVisible()
  await expect(dialog.getByLabel('Fuseau horaire')).toHaveCount(0)
  await expect(dialog.getByTestId('reminder-summary')).toContainText('7 jours avant et le jour J')

  await dialog.getByLabel('Rappels', { exact: true }).selectOption('off')
  await expect(dialog.getByTestId('reminder-summary')).toContainText('Aucun rappel')
  await dialog.getByRole('button', { name: 'Enregistrer' }).click()
  await expect(dialog).toHaveCount(0)
  expect(saved).toEqual([{ path: '/api/events/4/reminder-settings', body: { ...EMPTY, enabled: false } }])
})
