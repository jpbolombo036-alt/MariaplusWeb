import { test, expect, type Page } from '@playwright/test'
import { fulfillJson, mockApi } from './support/e2e-api'

/** yyyy-mm-dd, `days` from today (local). */
function inDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const page1 = <T>(content: T[]) => ({ content, totalPages: 1, currentPage: 0, totalElements: content.length })

async function openDashboard(page: Page, opts: { status?: string; dashboard?: Record<string, unknown>; otherEvents?: number } = {}) {
  const event = {
    id: 1, name: 'Mariage de Grâce & David', type: 'WEDDING', status: opts.status ?? 'PUBLISHED',
    eventDate: inDays(18), startTime: '14:00:00', venueName: 'Salle Les Palmiers', city: 'Gombe', organizationId: 9,
  }
  const dashboard = opts.dashboard ?? {
    eventId: 1,
    guests: { total: 240, unassigned: 18 },
    invitations: { total: 240, accepted: 152, declined: 26, pending: 62, responseRate: 74, sent: 228, opened: 196 },
    attendance: { expected: 210, checkedIn: 0, remaining: 210, checkInRate: 0 },
    tables: { total: 18, capacity: 180, assignedGuests: 134, remainingCapacity: 46 },
  }
  const fixture = await mockApi(page, async (route, url) => {
    const p = url.pathname
    if (p === '/auth/login') {
      await fulfillJson(route, { accessToken: 'fixture-token', expiresIn: 900, user: {
        id: 5, organizationId: 9, firstName: 'Aline', lastName: 'Mbuyi', email: 'aline@example.test', active: true,
        roles: ['ORGANISATEUR'],
        permissions: ['WEDDING_VIEW', 'GUEST_VIEW', 'GUEST_CREATE', 'RSVP_VIEW', 'INVITATION_SEND', 'CHECKIN_SCAN', 'DASHBOARD_VIEW'],
      } })
    } else if (p === '/api/events') {
      await fulfillJson(route, page1([event, ...Array.from({ length: opts.otherEvents ?? 0 }, (_, k) => ({
        ...event, id: 100 + k, name: `Autre événement ${k + 1}`, eventDate: inDays(30 + k),
      }))]))
    } else if (p === '/api/events/1') {
      await fulfillJson(route, event)
    } else if (p === '/api/events/1/dashboard') {
      await fulfillJson(route, dashboard)
    } else if (p === '/api/events/1/sessions') {
      await fulfillJson(route, page1([
        { id: 3, eventId: 1, type: 'RECEPTION', name: 'Réception', sessionDate: inDays(18), startTime: '14:00:00', venueName: 'Salle Les Palmiers', city: 'Gombe' },
        { id: 2, eventId: 1, type: 'CEREMONY', name: 'Cérémonie religieuse', sessionDate: inDays(18), startTime: '11:00:00', venueName: 'Paroisse Saint-Joseph' },
        { id: 1, eventId: 1, type: 'DOWRY', name: 'Dot coutumière', sessionDate: inDays(17), startTime: '16:00:00' },
      ]))
    } else if (p === '/api/events/1/dashboard/recent-activity') {
      await fulfillJson(route, [
        { id: 2, action: 'INVITATION_BULK_SEND', details: '40 invitations envoyées par WhatsApp', performedAt: new Date(Date.now() - 40 * 60_000).toISOString() },
        { id: 1, action: 'GUEST_CREATE', details: null, performedAt: new Date(Date.now() - 12 * 60_000).toISOString() },
      ])
    } else if (p === '/api/events/1/rsvps') {
      await fulfillJson(route, [
        { invitationId: 11, guestId: 101, status: 'ACCEPTED', numberOfAttendees: 2, respondedAt: '2026-11-20T10:00:00' },
        { invitationId: 12, guestId: 102, status: 'DECLINED', numberOfAttendees: 0, respondedAt: '2026-11-22T10:00:00' },
      ])
    } else if (p === '/api/events/1/guests') {
      await fulfillJson(route, page1([
        { id: 101, eventId: 1, categoryId: 7, firstName: 'Patrick', lastName: 'Kabila', active: true },
        { id: 102, eventId: 1, categoryId: null, firstName: 'Jonathan', lastName: 'Mbala', active: true },
      ]))
    } else if (p === '/api/events/1/guest-categories') {
      await fulfillJson(route, page1([{ id: 7, eventId: 1, name: 'Famille', active: true }]))
    } else if (p === '/api/events/1/reminder-settings') {
      const none = { enabled: null, firstReminderEnabled: null, firstReminderDays: null, eveEnabled: null, dayOfEnabled: null, sendHour: null, timeZone: null }
      await fulfillJson(route, { settings: none, inherited: { enabled: true, firstReminderEnabled: true, firstReminderDays: 7, eveEnabled: true, dayOfEnabled: true, sendHour: 8, timeZone: 'Africa/Kinshasa' }, timeZoneEditable: false })
    } else if (p.startsWith('/api/platform/')) {
      await fulfillJson(route, { enabled: true })
    } else return false
    return true
  })
  await page.goto('/login?redirect=%2Fdashboard')
  await page.getByLabel(/Email/).first().fill('aline@example.test')
  await page.getByLabel('Mot de passe', { exact: true }).fill('fixture-password')
  await page.locator('form').getByRole('button', { name: 'Se connecter', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Bonjour, Aline' })).toBeVisible()
  return fixture
}

test('the dashboard shows the event, its figures and what to do next', async ({ page }) => {
  const fixture = await openDashboard(page)

  // Event banner with countdown and quick actions.
  await expect(page.getByRole('heading', { name: 'Mariage de Grâce & David' })).toBeVisible()
  await expect(page.getByTestId('countdown')).toHaveAccessibleName('Dans 18 jours')
  await expect(page.getByRole('link', { name: 'Ajouter un invité' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Check-in' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Envoyer les invitations' })).toHaveAttribute('href', '/dashboard/events/1/invitations/send')

  // Key figures, response rate on SENT invitations: 178 / 228 = 78 %.
  await expect(page.getByTestId('kpi-guests')).toContainText('240')
  await expect(page.getByTestId('kpi-guests')).toContainText('228 invitations envoyées · 12 à envoyer')
  await expect(page.getByTestId('kpi-response')).toContainText('78%')
  await expect(page.getByTestId('kpi-response')).toContainText('178 / 228')
  await expect(page.getByTestId('kpi-confirmed')).toContainText('210')
  await expect(page.getByTestId('kpi-tables')).toContainText('/ 180 places')

  // Funnel, including openings.
  const funnel = page.getByTestId('funnel')
  await expect(funnel.getByRole('img', { name: 'Ouvertes : 196' })).toBeVisible()
  await expect(funnel.getByRole('img', { name: 'Présents : pas encore' })).toBeVisible()

  // To-do list with real links.
  const todo = page.getByTestId('todo')
  await expect(todo.getByText("50 invités n'ont pas répondu")).toBeVisible()
  await expect(todo.getByRole('link', { name: 'Relancer' })).toHaveAttribute('href', '/dashboard/events/1/invitations')
  await expect(todo.getByText('12 invitations pas encore envoyées')).toBeVisible()
  await expect(todo.getByText('32 invitations jamais ouvertes')).toBeVisible()
  await expect(todo.getByText('18 invités sans table')).toBeVisible()
  await expect(todo.getByText(/^Prochain rappel : /)).toBeVisible()
  // The next reminder is information, not an action: 4 actions.
  await expect(page.getByText('4 actions')).toBeVisible()

  // Answers, programme in time order, latest answers with names, readable activity.
  await expect(page.getByTestId('responses-donut')).toHaveAccessibleName('Sur 228 invitations envoyées : 152 acceptées, 26 refusées, 50 sans réponse')
  await expect(page.getByTestId('programme').getByRole('listitem').first()).toContainText('Dot coutumière')
  const latest = page.getByTestId('latest-responses')
  await expect(latest.getByRole('row').nth(1)).toContainText('Jonathan Mbala')
  await expect(latest.getByRole('row').nth(1)).toContainText('Refusée')
  await expect(latest.getByRole('row').nth(2)).toContainText('Famille')
  await expect(page.getByTestId('activity')).toContainText('40 invitations envoyées par WhatsApp')
  await expect(page.getByTestId('activity')).toContainText('Invité ajouté')
  expect(fixture.unexpectedRequests).toEqual([])
})

test('a draft event with everything else in order asks only to be published', async ({ page }) => {
  await openDashboard(page, {
    status: 'DRAFT',
    dashboard: {
      eventId: 1,
      guests: { total: 2, unassigned: 0 },
      invitations: { total: 2, accepted: 1, declined: 1, pending: 0, responseRate: 100, sent: 2, opened: 2 },
      attendance: { expected: 2, checkedIn: 0, remaining: 2, checkInRate: 0 },
      tables: { total: 0, capacity: 0, assignedGuests: 0, remainingCapacity: 0 },
    },
  })
  const todo = page.getByTestId('todo')
  await expect(todo.getByText("L'événement est encore en brouillon")).toBeVisible()
  await expect(todo.getByRole('link', { name: 'Publier' })).toHaveAttribute('href', '/dashboard/events/1')
  await expect(todo.getByText(/pas répondu|sans table|jamais ouvertes/)).toHaveCount(0)
  await expect(page.getByText('1 action', { exact: true })).toBeVisible()
})

test('an older backend without sent/opened figures hides the funnel instead of showing wrong numbers', async ({ page }) => {
  await openDashboard(page, {
    dashboard: {
      eventId: 1,
      guests: { total: 11, unassigned: 0 },
      invitations: { total: 11, accepted: 4, declined: 0, pending: 7, responseRate: 36 },
      attendance: { expected: 4, checkedIn: 1, remaining: 3, checkInRate: 25 },
      tables: { total: 0, capacity: 0, assignedGuests: 0, remainingCapacity: 0 },
    },
  })
  await expect(page.getByTestId('kpi-guests')).toContainText('11 invitations créées')
  await expect(page.getByTestId('funnel')).toHaveCount(0)
  await expect(page.getByTestId('todo').getByText(/pas encore envoyée|jamais ouverte/)).toHaveCount(0)
  await expect(page.getByTestId('kpi-confirmed')).toContainText('1 déjà présent')
})

test('the event list opens above the key figures and can be clicked', async ({ page }) => {
  await openDashboard(page, { otherEvents: 5 })
  await page.getByRole('button', { name: "Changer d'événement" }).click()
  // The last entries sit over the key figure cards: a click there must reach the list.
  const dashboardRequest = page.waitForRequest((r) => new URL(r.url()).pathname === '/api/events/104/dashboard')
  await page.getByText('Autre événement 5').click()
  await dashboardRequest
})
