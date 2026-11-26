import { test, expect, type Page } from '@playwright/test'
import { fulfillJson, mockApi } from './support/e2e-api'

const VENUE_PERMS = ['DASHBOARD_VIEW', 'VENUE_VIEW', 'VENUE_MANAGE', 'VENUE_CLIENT_MANAGE', 'BOOKING_VIEW',
  'BOOKING_MANAGE', 'BOOKING_PAYMENT_RECORD', 'VENUE_REPORT_VIEW', 'EVENT_VIEW']

const user = {
  id: 5, organizationId: 9, firstName: 'Gaston', lastName: 'Salle', email: 'gerant@example.test',
  active: true, roles: ['ORGANISATEUR'], permissions: VENUE_PERMS,
}

const venue = {
  id: 3, name: 'Salle Le Palmier', address: 'Avenue de la Justice 12', commune: 'Gombe', city: 'Kinshasa',
  capacitySeated: 400, active: true, imageUrl: null,
  rates: [{ id: 7, venueId: 3, label: 'Journée', price: 1500, currency: 'USD', active: true }],
}

function booking(overrides: Record<string, unknown> = {}) {
  return {
    id: 42, reference: 'RES-00042', venueId: 3, venueName: 'Salle Le Palmier', clientId: 11, clientName: 'Patrick Ilunga',
    clientPhone: '+243812345678', title: 'Mariage Ilunga', eventType: 'WEDDING', startAt: '2027-03-20T14:00:00',
    endAt: '2027-03-20T23:00:00', guestCount: 300, status: 'OPTION', currency: 'USD', rateId: 7, basePrice: 1500,
    extrasTotal: 0, discount: 0, totalAmount: 1500, paidAmount: 0, balance: 1500, optionExpiresAt: '2027-01-10T10:00:00',
    eventId: null, extras: [], payments: [], ...overrides,
  }
}

async function signIn(page: Page, enabled: boolean, extra: Parameters<typeof mockApi>[1] = async () => false) {
  return mockApi(page, async (route, url) => {
    if (await extra(route, url)) return true
    if (url.pathname === '/auth/refresh') await fulfillJson(route, { accessToken: 'fixture-token', expiresIn: 900 })
    else if (url.pathname === '/auth/me') await fulfillJson(route, user)
    else if (url.pathname === '/api/venues/module-status') await fulfillJson(route, { enabled })
    else if (url.pathname.startsWith('/api/platform/')) await fulfillJson(route, { enabled: true })
    else if (url.pathname === '/api/events') await fulfillJson(route, { content: [], totalPages: 1, totalElements: 0 })
    else return false
    return true
  })
}

test('the venue menu stays hidden and its pages closed until the SUPER_ADMIN enables the module', async ({ page }) => {
  await signIn(page, false, async (route, url) => {
    if (url.pathname.startsWith('/api/')) { await fulfillJson(route, {}); return true }
    return false
  })
  await page.goto('/dashboard/venue/bookings')
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole('link', { name: 'Réservations' })).toHaveCount(0)
})

test('a venue manager books a slot for a new client, then records a CDF payment at the day rate', async ({ page }) => {
  const sent: { booking?: Record<string, unknown>; payment?: Record<string, unknown> } = {}
  let current = booking()
  const fixture = await signIn(page, true, async (route, url) => {
    const method = route.request().method()
    if (url.pathname === '/api/venues' && method === 'GET') await fulfillJson(route, [venue])
    else if (url.pathname === '/api/venue-clients' && method === 'GET') await fulfillJson(route, { content: [], totalPages: 1, totalElements: 0 })
    else if (url.pathname === '/api/venue-clients/11') await fulfillJson(route, { id: 11, lastName: 'Ilunga', fullName: 'Patrick Ilunga', email: 'patrick@example.test' })
    else if (url.pathname === '/api/bookings' && method === 'POST') {
      sent.booking = route.request().postDataJSON()
      await fulfillJson(route, current, 201)
    } else if (url.pathname === '/api/bookings/42' && method === 'GET') await fulfillJson(route, current)
    else if (url.pathname === '/api/bookings/42/payments' && method === 'POST') {
      sent.payment = route.request().postDataJSON()
      current = booking({ paidAmount: 100, balance: 1400, payments: [{
        id: 9, bookingId: 42, receiptNumber: 'REC-00009', amount: 280000, currency: 'CDF', exchangeRate: 2800,
        amountInBookingCurrency: 100, method: 'MPESA', reference: 'MP-123', paidAt: '2026-11-26T10:00:00',
      }] })
      await fulfillJson(route, current.payments[0], 201)
    } else return false
    return true
  })

  await page.goto('/dashboard/venue/bookings/new')
  await expect(page.getByRole('heading', { name: 'Nouvelle réservation' })).toBeVisible()
  await page.getByLabel('Début *').fill('2027-03-20T14:00')
  await page.getByLabel('Fin *').fill('2027-03-20T23:00')
  await page.getByLabel('Titre').fill('Mariage Ilunga')
  await page.getByLabel('Nom *').fill('Ilunga')
  await page.getByLabel('Téléphone').fill('0812345678')
  await page.getByLabel('Tarif').selectOption({ label: 'Journée — 1 500,00 USD' })
  await expect(page.getByLabel('Prix de la salle *')).toHaveValue('1500')
  await page.getByRole('button', { name: 'Réserver' }).click()

  await expect(page).toHaveURL(/\/dashboard\/venue\/bookings\/42$/)
  expect(sent.booking).toMatchObject({
    venueId: 3, rateId: 7, currency: 'USD', basePrice: 1500, status: 'OPTION', eventType: 'WEDDING',
    startAt: '2027-03-20T14:00:00', endAt: '2027-03-20T23:00:00', client: { lastName: 'Ilunga', phone: '0812345678' },
  })
  await expect(page.getByText('Option valable jusqu')).toBeVisible()

  await page.getByLabel('Montant *').fill('280000')
  await page.getByLabel('Devise du paiement').selectOption('CDF')
  await page.getByLabel('Taux du jour (CDF pour 1 USD) *').fill('2800')
  await expect(page.getByText('Équivalent : 100,00 USD')).toBeVisible()
  await page.getByLabel('Mode *').selectOption('MPESA')
  await page.getByLabel('Référence').fill('MP-123')
  await page.getByRole('button', { name: 'Encaisser' }).click()

  await expect(page.getByText('REC-00009')).toBeVisible()
  expect(sent.payment).toMatchObject({ amount: 280000, currency: 'CDF', exchangeRate: 2800, method: 'MPESA', reference: 'MP-123' })
  await expect(page.getByText('1 400,00 USD')).toBeVisible()
  expect(fixture.unexpectedRequests.filter((r) => /venue|booking/.test(r))).toEqual([])
})
