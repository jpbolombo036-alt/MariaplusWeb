import { test, expect, type Page, type Route } from '@playwright/test'
import { fulfillJson, mockApi } from './support/e2e-api'

const venue = { id: 3, name: 'Salle Le Palmier', active: true, imageUrl: null, rates: [] }

const managerPerms = ['DASHBOARD_VIEW', 'VENUE_VIEW', 'VENUE_MANAGE', 'BOOKING_VIEW', 'BOOKING_MANAGE',
  'BOOKING_PAYMENT_RECORD', 'VENUE_REPORT_VIEW', 'BOOKING_REFUND', 'EXPENSE_RECORD', 'EXPENSE_MANAGE']
const cashierPerms = ['VENUE_VIEW', 'BOOKING_VIEW', 'BOOKING_MANAGE', 'BOOKING_PAYMENT_RECORD', 'EXPENSE_RECORD']

function expense(overrides: Record<string, unknown> = {}) {
  return {
    id: 51, category: 'CARBURANT', label: 'Gasoil groupe électrogène', amount: 40, currency: 'USD', method: 'ESPECES',
    venueId: 3, venueName: 'Salle Le Palmier', spentAt: '2026-11-28T09:30:00', recordedBy: 6, recordedByName: 'Caissier Salle',
    ...overrides,
  }
}

function list(items: Record<string, unknown>[], allRecorders: boolean) {
  return {
    from: '2026-11-01', to: '2026-11-30', allRecorders, items,
    total: ['USD', 'CDF'].map((currency) => ({ currency, amount: items.filter((e) => e.currency === currency).reduce((s, e) => s + Number(e.amount), 0) }))
      .filter((t) => t.amount > 0),
    byCategory: items.map((e) => ({ category: e.category, currency: e.currency, amount: e.amount, count: 1 })),
  }
}

async function signIn(page: Page, permissions: string[], roles: string[], extra: (route: Route, url: URL) => Promise<boolean>) {
  const user = { id: 6, organizationId: 9, firstName: 'Caissier', lastName: 'Salle', email: 'c@example.test', active: true, roles, permissions }
  return mockApi(page, async (route, url) => {
    if (await extra(route, url)) return true
    const p = url.pathname
    if (p === '/auth/refresh') await fulfillJson(route, { accessToken: 'fixture-token', expiresIn: 900 })
    else if (p === '/auth/me') await fulfillJson(route, user)
    else if (p === '/api/venues/module-status') await fulfillJson(route, { enabled: true })
    else if (p.startsWith('/api/platform/')) await fulfillJson(route, { enabled: true })
    else if (p === '/api/events') await fulfillJson(route, { content: [], totalPages: 1, totalElements: 0 })
    else if (p === '/api/venues') await fulfillJson(route, [venue])
    else if (p === '/api/venues/exchange-rate') await fulfillJson(route, { current: null, history: [] })
    else return false
    return true
  })
}

test('a cashier records a cash expense and only sees their own, without edit or cancel', async ({ page }) => {
  let items: Record<string, unknown>[] = []
  let sent: Record<string, unknown> | null = null
  const fixture = await signIn(page, cashierPerms, ['AGENT_SALLE'], async (route, url) => {
    if (url.pathname === '/api/venues/my-cash') {
      await fulfillJson(route, { from: '2026-11-01', to: '2026-11-30', today: [], collected: [{ currency: 'USD', amount: 300 }],
        paymentCount: 1, refundCount: 0, byMethod: [], movements: [], upcoming: [],
        spent: [{ currency: 'USD', amount: 40 }], todaySpent: [], balance: [{ currency: 'USD', amount: 260 }], expenseCount: 1, expenses: [expense()] })
      return true
    }
    if (url.pathname !== '/api/venues/expenses') return false
    if (route.request().method() === 'POST') {
      sent = route.request().postDataJSON()
      items = [expense({ label: String(sent!.label) })]
      await fulfillJson(route, items[0], 201)
    } else {
      await fulfillJson(route, list(items, false))
    }
    return true
  })

  await page.goto('/dashboard/venue/my-cash')
  const balance = page.locator('.v-card', { has: page.getByText('Solde de la période') })
  await expect(balance.getByText('260,00 USD')).toBeVisible()
  await page.screenshot({ path: 'output/expenses-my-cash.png', fullPage: true })
  await expect(page.locator('aside nav').getByRole('link', { name: /Dépenses/ })).toBeVisible()
  await page.locator('aside nav').getByRole('link', { name: /Dépenses/ }).click()
  await expect(page.locator('main').getByRole('heading', { name: 'Dépenses', exact: true })).toBeVisible()
  await expect(page.getByText('Aucune dépense sur cette période.')).toBeVisible()

  await page.getByRole('button', { name: 'Nouvelle dépense' }).click()
  const dialog = page.getByRole('dialog', { name: 'Nouvelle dépense' })
  await expect(dialog.getByText('Payée en espèces : elle sera déduite de votre caisse.')).toBeVisible()
  await dialog.getByLabel('Libellé *').fill('Gasoil groupe électrogène')
  await dialog.getByLabel('Montant *').fill('40')
  await dialog.getByRole('button', { name: 'Ajouter la dépense' }).click()

  await expect(dialog).toHaveCount(0)
  await expect(page.getByRole('cell', { name: /Gasoil groupe électrogène/ })).toBeVisible()
  await expect(page.getByText('Mes dépenses')).toBeVisible()
  await expect(page.getByRole('button', { name: /Modifier Gasoil/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Annuler Gasoil/ })).toHaveCount(0)
  expect(sent).toMatchObject({ category: 'CARBURANT', label: 'Gasoil groupe électrogène', amount: 40, currency: 'USD', method: 'ESPECES', venueId: 3 })
  expect(fixture.unexpectedRequests).toEqual([])
  await page.screenshot({ path: 'output/expenses-cashier.png', fullPage: true })
})

test('the manager cancels an expense with a reason and sees the month result on the dashboard', async ({ page }) => {
  let items: Record<string, unknown>[] = [expense(), expense({ id: 52, category: 'ELECTRICITE', label: 'Facture SNEL', amount: 150000, currency: 'CDF', method: 'MPESA', venueId: null, venueName: null, recordedByName: 'Gaston Salle' })]
  let cancelled = ''
  await signIn(page, managerPerms, ['ORGANISATEUR'], async (route, url) => {
    const p = url.pathname
    if (p === '/api/venues/expenses') await fulfillJson(route, list(items, true))
    else if (p === '/api/venues/expenses/51' && route.request().method() === 'DELETE') {
      cancelled = url.searchParams.get('reason') ?? ''
      items = items.filter((e) => e.id !== 51)
      await route.fulfill({ status: 204, headers: { 'access-control-allow-origin': 'http://127.0.0.1:4183', 'access-control-allow-credentials': 'true' } })
    } else if (p === '/api/venues/dashboard') {
      await fulfillJson(route, {
        from: '2026-11-01', to: '2026-11-30', venueCount: 1, bookingsByStatus: {}, collected: [{ currency: 'USD', amount: 1200 }],
        spent: [{ currency: 'USD', amount: 40 }], result: [{ currency: 'USD', amount: 1160 }], expenseCount: 1,
        expensesByCategory: [{ category: 'CARBURANT', currency: 'USD', amount: 40, count: 1 }],
        refunded: [], refunds: [], bookedValue: [], outstanding: [], occupancyRate: 0, occupiedVenueDays: 0, availableVenueDays: 30,
        unpaid: [], upcoming: [],
        byCashier: [{ userId: 6, name: 'Caissier Salle', today: [], collected: [{ currency: 'USD', amount: 300 }], cash: [{ currency: 'USD', amount: 300 }],
          mobileMoney: [], transfer: [], paymentCount: 2, refundCount: 0, spent: [{ currency: 'USD', amount: 40 }], cashInHand: [{ currency: 'USD', amount: 260 }] }],
      })
    } else return false
    return true
  })

  await page.goto('/dashboard/venue/expenses')
  await expect(page.getByText('Toutes les dépenses')).toBeVisible()
  await expect(page.getByRole('cell', { name: 'Gaston Salle' })).toBeVisible()
  await page.screenshot({ path: 'output/expenses-manager.png', fullPage: true })

  await page.getByRole('button', { name: /Annuler Gasoil/ }).click()
  const dialog = page.getByRole('dialog', { name: 'Annuler la dépense' })
  await dialog.getByLabel('Motif').fill('Saisie en double')
  await dialog.getByRole('button', { name: 'Annuler la dépense' }).click()
  await expect(page.getByRole('cell', { name: /Gasoil/ })).toHaveCount(0)
  expect(cancelled).toBe('Saisie en double')

  await page.goto('/dashboard/venue')
  const result = page.locator('.v-card', { has: page.getByText('Résultat du mois') })
  await expect(result.getByText('1 160,00 USD')).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Espèces en caisse' })).toBeVisible()
  await expect(page.getByText('260,00 USD')).toBeVisible()
  await page.screenshot({ path: 'output/expenses-dashboard.png', fullPage: true })
})
