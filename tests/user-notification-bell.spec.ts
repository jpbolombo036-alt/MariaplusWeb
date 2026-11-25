import { test, expect, type Page } from '@playwright/test'
import { APP_ORIGIN, fulfillJson, mockApi } from './support/e2e-api'

const noContent = { status: 204, headers: { 'access-control-allow-origin': APP_ORIGIN, 'access-control-allow-credentials': 'true' } }

async function signInOrganizer(page: Page) {
  const state = {
    items: [
      { id: 11, type: 'ADMIN_MESSAGE', title: 'Compte activé', message: 'Vous pouvez créer vos événements.\nBonne préparation !',
        broadcast: false, eventId: null, createdAt: '2026-11-24T12:00:00', readAt: null as string | null },
      { id: 12, type: 'EVENT_REMINDER', title: '« Mariage de Nadia » a lieu demain',
        message: 'Samedi 28 novembre 2026 à 14h00 — Salle Lumière\nInvités : 120 · Confirmés : 80 · Sans réponse : 30',
        broadcast: false, eventId: 1, createdAt: '2026-11-24T08:00:00', readAt: '2026-11-24T08:30:00' as string | null },
      { id: 10, type: 'ADMIN_MESSAGE', title: 'Maintenance', message: 'Ce soir à 22h.',
        broadcast: true, eventId: null, createdAt: '2026-11-24T09:00:00', readAt: '2026-11-24T09:30:00' as string | null },
    ],
    reads: [] as number[],
    replies: [] as unknown[],
  }
  const fixture = await mockApi(page, async (route, url) => {
    const method = route.request().method()
    if (url.pathname === '/auth/login') {
      await fulfillJson(route, { accessToken: 'fixture-token', expiresIn: 900, user: {
        id: 5, organizationId: 9, firstName: 'Nadia', lastName: 'Nouvelle', email: 'nadia@example.test',
        active: true, roles: ['ORGANISATEUR'], permissions: ['WEDDING_VIEW'],
      } })
    } else if (url.pathname === '/api/notifications' && method === 'GET') {
      await fulfillJson(route, { unreadCount: state.items.filter((n) => !n.readAt).length, items: state.items })
    } else if (/^\/api\/notifications\/\d+\/read$/.test(url.pathname) && method === 'PATCH') {
      const id = Number(url.pathname.split('/')[3])
      state.reads.push(id)
      state.items.find((n) => n.id === id)!.readAt = '2026-11-24T12:30:00'
      await route.fulfill(noContent)
    } else if (url.pathname === '/api/contact-messages' && method === 'POST') {
      state.replies.push(route.request().postDataJSON())
      await route.fulfill(noContent)
    } else if (url.pathname === '/api/events') {
      await fulfillJson(route, { content: [], totalPages: 1, currentPage: 0, totalElements: 0 })
    } else if (url.pathname.startsWith('/api/platform/')) {
      await fulfillJson(route, { enabled: true })
    } else return false
    return true
  })
  await page.goto('/login?redirect=%2Fdashboard')
  await page.getByLabel(/Email/).fill('nadia@example.test')
  await page.getByLabel(/Mot de passe/).fill('fixture-password')
  await page.locator('form').getByRole('button', { name: 'Se connecter', exact: true }).click()
  await expect(page.getByRole('heading', { name: /Bonjour, Nadia/ })).toBeVisible()
  return { fixture, state }
}

test('an organizer reads a message from the team and replies', async ({ page }) => {
  const { fixture, state } = await signInOrganizer(page)

  await expect(page.getByTestId('bell-badge')).toHaveText('1')
  await page.getByRole('button', { name: /Notifications, 1 non lue/ }).click()
  const panel = page.getByRole('dialog', { name: 'Notifications' })
  await expect(panel.getByText('Tous les organisateurs')).toBeVisible()

  await panel.getByText('Compte activé').click()
  await expect(panel.getByText('Bonne préparation !')).toBeVisible()
  await expect.poll(() => state.reads).toEqual([11])
  await expect(page.getByTestId('bell-badge')).toHaveCount(0)

  await panel.getByRole('button', { name: 'Répondre' }).click()
  await expect(panel.getByLabel('Votre réponse')).toBeFocused()
  await panel.getByLabel('Votre réponse').fill('Merci beaucoup !')
  await panel.getByRole('button', { name: 'Envoyer', exact: true }).click()

  await expect(panel.getByTestId('reply-sent')).toBeVisible()
  expect(state.replies).toEqual([{ message: 'Réponse à « Compte activé » :\nMerci beaucoup !' }])
  expect(fixture.unexpectedRequests).toEqual([])
})

test('an automatic event reminder links to its event and cannot be answered', async ({ page }) => {
  await signInOrganizer(page)
  await page.getByRole('button', { name: /Notifications/ }).first().click()
  const panel = page.getByRole('dialog', { name: 'Notifications' })
  await expect(panel.getByText('Rappel automatique')).toBeVisible()

  await panel.getByText('« Mariage de Nadia » a lieu demain').click()
  await expect(panel.getByText('Sans réponse : 30')).toBeVisible()
  await expect(panel.getByRole('button', { name: 'Répondre' })).toHaveCount(0)
  await panel.getByRole('button', { name: "Ouvrir l'événement" }).click()
  await expect(page).toHaveURL(/\/dashboard\/events\/1$/)
})
