import { test, expect } from '@playwright/test'
import { INVITATION_PATH, INVITATION_TOKEN, mockPublicInvitation } from './support/public-invitation'
import { API_ORIGIN, fulfillJson, mockApi } from './support/e2e-api'

test('visible invitation records one opening without authentication', async ({ page }) => {
  const fixture = await mockPublicInvitation(page)
  await page.goto(INVITATION_PATH)
  await expect.poll(() => fixture.openingWrites).toBe(1)
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  expect(fixture.openingWrites).toBe(1)
  expect(fixture.apiRequests.filter((r) => r.path.endsWith('/opened')).every((r) => !r.authorization)).toBe(true)
  expect(fixture.unexpectedRequests).toEqual([])
})

test('unavailable invitation does not record an opening', async ({ page }) => {
  const fixture = await mockPublicInvitation(page, { invitationHttpStatus: 404 })
  await page.goto(INVITATION_PATH)
  await expect(page.getByText("Cette invitation n'est plus accessible ou n'existe pas.")).toBeVisible()
  expect(fixture.openingWrites).toBe(0)
})

test('tracking failure never blocks the public invitation', async ({ page }) => {
  const fixture = await mockPublicInvitation(page)
  await page.route(`${API_ORIGIN}/api/public/invitations/${INVITATION_TOKEN}/opened`, (route) => route.abort())
  await page.goto(INVITATION_PATH)
  await expect(page.getByRole('heading', { name: 'Marie et Paul', exact: true })).toBeVisible()
  expect(fixture.pageErrors).toEqual([])
})

test('organizer returning to the tab sees the recorded opening', async ({ page }) => {
  let openedAt: string | null = null
  const event = { id: 1, name: 'Réception test', type: 'OTHER', status: 'PUBLISHED', eventDate: '2099-12-15' }
  const paginated = (content: unknown[]) => ({ content, totalPages: 1, currentPage: 0, totalElements: content.length })
  const fixture = await mockApi(page, async (route, url) => {
    if (url.pathname === '/auth/login') {
      await fulfillJson(route, { accessToken: 'fixture-token', expiresIn: 900, user: {
        id: 1, organizationId: 1, firstName: 'Test', lastName: 'Organisateur', email: 'test@example.test',
        active: true, roles: ['ORGANIZER'], permissions: ['WEDDING_VIEW', 'INVITATION_VIEW'],
      } })
    } else if (url.pathname === '/api/events/1/invitations') {
      await fulfillJson(route, paginated([{ id: 1, weddingId: 1, guestId: 7, invitationCode: 'INV-TEST', status: 'SENT', openedAt }]))
    } else if (url.pathname === '/api/events/1/guests') {
      await fulfillJson(route, paginated([{ id: 7, firstName: 'Alice', lastName: 'Exemple', active: true }]))
    } else if (url.pathname === '/api/events') {
      await fulfillJson(route, paginated([event]))
    } else if (url.pathname === '/api/events/1') {
      await fulfillJson(route, event)
    } else if (url.pathname === '/api/events/1/dashboard') {
      await fulfillJson(route, { eventId: 1, guests: { total: 1 } })
    } else if (url.pathname.startsWith('/api/platform/')) {
      await fulfillJson(route, { enabled: true })
    } else return false
    return true
  })
  await page.goto('/login?redirect=%2Fdashboard%2Fevents%2F1%2Finvitations')
  await page.getByLabel(/Email/).fill('test@example.test')
  await page.getByLabel(/Mot de passe/).fill('fixture-password')
  await page.locator('form').getByRole('button', { name: 'Se connecter', exact: true }).click()
  const row = page.getByRole('row').filter({ hasText: 'INV-TEST' })
  await expect(row.getByRole('cell', { name: 'Non', exact: true })).toBeVisible()
  openedAt = '2026-11-20T10:00:00'
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await expect(row.getByRole('cell', { name: 'Oui', exact: true })).toBeVisible()
  expect(fixture.unexpectedRequests).toEqual([])
})