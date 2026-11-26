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
    extrasTotal: 0, discount: 0, totalAmount: 1500, paidAmount: 0, refundedAmount: 0, balance: 1500, optionExpiresAt: '2027-01-10T10:00:00',
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
    else if (url.pathname === '/api/venues/exchange-rate') await fulfillJson(route, { current: null, history: [] })
    else if (url.pathname === '/api/bookings' && method === 'POST') {
      sent.booking = route.request().postDataJSON()
      await fulfillJson(route, current, 201)
    } else if (url.pathname === '/api/bookings/42' && method === 'GET') await fulfillJson(route, current)
    else if (url.pathname === '/api/bookings/42/payments' && method === 'POST') {
      sent.payment = route.request().postDataJSON()
      current = booking({ paidAmount: 100, balance: 1400, payments: [{
        id: 9, bookingId: 42, kind: 'PAYMENT', receiptNumber: 'REC-00009', amount: 280000, currency: 'CDF', exchangeRate: 2800,
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
  await expect(page.getByRole('link', { name: 'Fixer le taux du jour' })).toBeVisible()
  await page.getByLabel('Taux (CDF pour 1 USD)').fill('2800')
  await expect(page.getByText('Équivalent : 100,00 USD')).toBeVisible()
  await page.getByLabel('Mode *').selectOption('MPESA')
  await page.getByLabel('Référence').fill('MP-123')
  await page.getByRole('button', { name: 'Encaisser' }).click()

  await expect(page.getByText('REC-00009')).toBeVisible()
  expect(sent.payment).toMatchObject({ amount: 280000, currency: 'CDF', exchangeRate: 2800, method: 'MPESA', reference: 'MP-123' })
  await expect(page.getByText('1 400,00 USD')).toBeVisible()
  expect(fixture.unexpectedRequests.filter((r) => /venue|booking/.test(r))).toEqual([])
})

test('a venue deleted by mistake is listed and can be restored', async ({ page }) => {
  let deleted = [{ ...venue, id: 1, name: 'Exodus', rates: [] }]
  const restored: number[] = []
  await signIn(page, true, async (route, url) => {
    const method = route.request().method()
    if (url.pathname === '/api/venues' && method === 'GET') await fulfillJson(route, deleted.length ? [] : [{ ...venue, id: 1, name: 'Exodus', rates: [] }])
    else if (url.pathname === '/api/venues/deleted') await fulfillJson(route, deleted)
    else if (url.pathname === '/api/venues/1/restore' && method === 'POST') {
      restored.push(1)
      deleted = []
      await fulfillJson(route, { ...venue, id: 1, name: 'Exodus', rates: [] })
    } else return false
    return true
  })
  await page.goto('/dashboard/venue/venues')
  await page.getByRole('button', { name: /Salles supprimées \(1\)/ }).click()
  await page.getByRole('button', { name: 'Restaurer la salle Exodus' }).click()
  await expect(page.getByText('Salle « Exodus » restaurée')).toBeVisible()
  expect(restored).toEqual([1])
  await expect(page.getByRole('button', { name: /Salles supprimées/ })).toHaveCount(0)
  await expect(page.getByText('Exodus', { exact: true })).toBeVisible()
})

test('Ma salle comes first in the menu when the module is enabled', async ({ page }) => {
  await signIn(page, true, async (route, url) => {
    if (url.pathname === '/api/venues/dashboard') {
      await fulfillJson(route, { from: '2026-11-01', to: '2026-11-30', venueCount: 0, bookingsByStatus: {}, collected: [], refunded: [],
        bookedValue: [], outstanding: [], occupancyRate: 0, occupiedVenueDays: 0, availableVenueDays: 0, unpaid: [], upcoming: [] })
    } else if (url.pathname === '/api/venues/exchange-rate') await fulfillJson(route, { current: null, history: [] })
    else if (url.pathname === '/api/venues') await fulfillJson(route, [])
    else return false
    return true
  })
  await page.goto('/dashboard/venue')
  const links = page.locator('aside nav a')
  await expect(links.first()).toHaveAttribute('href', '/dashboard/venue')
  await expect(page.locator('aside nav').getByText('Ma salle', { exact: true })).toBeVisible()
  const hrefs = await links.evaluateAll((els) => els.map((e) => e.getAttribute('href')))
  expect(hrefs.indexOf('/dashboard/venue/exchange-rate')).toBeLessThan(hrefs.indexOf('/dashboard'))
})

test('the manager sets the daily rate, which is then proposed on a CDF payment', async ({ page }) => {
  let overview: { current: unknown; history: unknown[] } = { current: null, history: [] }
  const sent: Record<string, unknown>[] = []
  await signIn(page, true, async (route, url) => {
    const method = route.request().method()
    if (url.pathname === '/api/venues/exchange-rate' && method === 'GET') await fulfillJson(route, overview)
    else if (url.pathname === '/api/venues/exchange-rate' && method === 'POST') {
      const body = route.request().postDataJSON()
      sent.push({ rate: body })
      const rate = { id: 1, cdfPerUsd: body.cdfPerUsd, effectiveAt: new Date().toISOString().slice(0, 19), setByName: 'Gaston Salle', note: body.note }
      overview = { current: rate, history: [rate] }
      await fulfillJson(route, overview)
    } else if (url.pathname === '/api/bookings/42' && method === 'GET') await fulfillJson(route, booking())
    else if (url.pathname === '/api/venue-clients/11') await fulfillJson(route, { id: 11, lastName: 'Ilunga', fullName: 'Patrick Ilunga' })
    else if (url.pathname === '/api/bookings/42/payments' && method === 'POST') {
      sent.push({ payment: route.request().postDataJSON() })
      await fulfillJson(route, { id: 9, bookingId: 42, kind: 'PAYMENT', receiptNumber: 'REC-00009', amount: 285000, currency: 'CDF',
        exchangeRate: 2850, amountInBookingCurrency: 100, method: 'MPESA', paidAt: '2026-11-26T10:00:00' }, 201)
    } else return false
    return true
  })

  await page.goto('/dashboard/venue/exchange-rate')
  await expect(page.getByText('Aucun taux défini')).toBeVisible()
  await page.getByLabel('CDF pour 1 USD').fill('2850')
  await expect(page.getByText('100 USD = 285 000 CDF')).toBeVisible()
  await page.getByRole('button', { name: 'Appliquer ce taux' }).click()
  await expect(page.getByText('1 USD = 2 850 CDF')).toBeVisible()
  expect(sent[0]).toEqual({ rate: { cdfPerUsd: 2850 } })

  await page.goto('/dashboard/venue/bookings/42')
  await page.getByLabel('Montant *').fill('285000')
  await page.getByLabel('Devise du paiement').selectOption('CDF')
  await expect(page.getByLabel('Taux (CDF pour 1 USD)')).toHaveValue('2850')
  await expect(page.getByText('Équivalent : 100,00 USD')).toBeVisible()
  await page.getByRole('button', { name: 'Encaisser' }).click()
  await expect.poll(() => sent.length).toBe(2)
  expect(sent[1]).toMatchObject({ payment: { amount: 285000, currency: 'CDF', exchangeRate: 2850 } })
})

test('cancelling a paid booking refunds part of it and keeps the rest', async ({ page }) => {
  const paid = booking({ status: 'CONFIRMEE', optionExpiresAt: null, paidAmount: 600, balance: 900, payments: [
    { id: 9, bookingId: 42, kind: 'PAYMENT', receiptNumber: 'REC-00009', amount: 600, currency: 'USD', amountInBookingCurrency: 600,
      method: 'ESPECES', paidAt: '2026-11-20T10:00:00' }] })
  let current = paid
  let cancelBody: Record<string, unknown> | undefined
  await signIn(page, true, async (route, url) => {
    const method = route.request().method()
    if (url.pathname === '/api/venues/exchange-rate') await fulfillJson(route, { current: null, history: [] })
    else if (url.pathname === '/api/venue-clients/11') await fulfillJson(route, { id: 11, lastName: 'Ilunga', fullName: 'Patrick Ilunga' })
    else if (url.pathname === '/api/bookings/42' && method === 'GET') await fulfillJson(route, current)
    else if (url.pathname === '/api/bookings/42/cancel' && method === 'POST') {
      cancelBody = route.request().postDataJSON()
      current = { ...paid, status: 'ANNULEE', cancelReason: 'Client empêché', refundedAmount: 400, retainedAmount: 200, balance: 0,
        payments: [...paid.payments, { id: 10, bookingId: 42, kind: 'REFUND', receiptNumber: 'RMB-00010', amount: 400, currency: 'USD',
          amountInBookingCurrency: 400, method: 'MPESA', reference: 'MP-9', paidAt: '2026-11-26T10:00:00' }] }
      await fulfillJson(route, current)
    } else return false
    return true
  })

  await page.goto('/dashboard/venue/bookings/42')
  await page.getByRole('button', { name: /Annuler$/ }).click()
  const dialog = page.getByRole('dialog', { name: 'Annuler la réservation' })
  await expect(dialog.getByText('Le client a déjà payé')).toBeVisible()
  await dialog.getByLabel('Motif').fill('Client empêché')
  await dialog.getByText('Rembourser une partie').click()
  await dialog.getByLabel('Montant remboursé').fill('400')
  await expect(dialog.getByText('Retenu par la salle : 200,00 USD')).toBeVisible()
  await dialog.getByLabel('Mode de remboursement').selectOption('MPESA')
  await dialog.getByLabel('Référence').fill('MP-9')
  await dialog.getByRole('button', { name: "Confirmer l'annulation" }).click()

  await expect(page.getByText('RMB-00010')).toBeVisible()
  expect(cancelBody).toEqual({ reason: 'Client empêché', refund: { amount: 400, currency: 'USD', method: 'MPESA', reference: 'MP-9' } })
  await expect(page.getByText('Retenu (frais d\'annulation)')).toBeVisible()
  await expect(page.getByText('200,00 USD').first()).toBeVisible()
})

test('the dashboard shows the month refunds in a card and a list', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 1100 })
  await signIn(page, true, async (route, url) => {
    if (url.pathname === '/api/venues/dashboard') {
      await fulfillJson(route, { from: '2026-11-01', to: '2026-11-30', venueCount: 1,
        bookingsByStatus: { DEMANDE: 0, OPTION: 0, CONFIRMEE: 1, REALISEE: 0, ANNULEE: 1 },
        collected: [{ currency: 'USD', amount: 200 }], refunded: [{ currency: 'USD', amount: 400 }],
        refunds: [{ paymentId: 10, receiptNumber: 'RMB-00010', bookingId: 42, bookingReference: 'RES-00042', clientName: 'Patrick Ilunga',
          venueName: 'Salle Le Palmier', amount: 400, currency: 'USD', method: 'MPESA', reference: 'MP-9', paidAt: '2026-11-26T10:00:00' }],
        bookedValue: [], outstanding: [], occupancyRate: 0, occupiedVenueDays: 0, availableVenueDays: 30, unpaid: [], upcoming: [] })
    } else if (url.pathname === '/api/venues/exchange-rate') await fulfillJson(route, { current: null, history: [] })
    else if (url.pathname === '/api/venues') await fulfillJson(route, [venue])
    else return false
    return true
  })
  await page.goto('/dashboard/venue')
  const card = page.locator('.v-card', { has: page.getByText('Remboursé ce mois') })
  await expect(card.getByText('400,00 USD')).toBeVisible()
  await expect(card.getByText('1 remboursement(s) aux clients')).toBeVisible()
  const list = page.locator('.v-card', { has: page.getByRole('heading', { name: 'Remboursements du mois' }) })
  await expect(list.getByText('RMB-00010')).toBeVisible()
  await expect(list.getByText('Patrick Ilunga')).toBeVisible()
  await expect(list.getByText('− 400,00 USD')).toBeVisible()
  await page.screenshot({ path: 'output/venue-dashboard-refunds.png', fullPage: true })
  await list.getByText('RMB-00010').click()
  await expect(page).toHaveURL(/\/dashboard\/venue\/bookings\/42$/)
})
