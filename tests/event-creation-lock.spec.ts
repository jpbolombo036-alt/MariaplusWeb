import { test, expect, type Page } from '@playwright/test'
import { fulfillJson, mockApi } from './support/e2e-api'

const NOTICE = "Création d'événements pas encore activée"
const paginated = (content: unknown[]) => ({ content, totalPages: 1, currentPage: 0, totalElements: content.length })

/** New organizer with no event; `creation.enabled` is read on every settings request. */
async function signInNewOrganizer(
  page: Page,
  creation: { enabled: boolean },
  contact: { status: number; body?: unknown; sent: unknown[] } = { status: 204, sent: [] },
) {
  const user = {
    id: 5, organizationId: 9, firstName: 'Nadia', lastName: 'Nouvelle', email: 'new@example.test',
    active: true, roles: ['ORGANISATEUR'], permissions: ['WEDDING_VIEW', 'WEDDING_CREATE', 'EVENT_CREATE'],
  }
  const fixture = await mockApi(page, async (route, url) => {
    if (url.pathname === '/auth/login') {
      await fulfillJson(route, { accessToken: 'fixture-token', expiresIn: 900, user })
    } else if (url.pathname === '/auth/refresh') {
      // Stands in for the HttpOnly session cookie on a full page load.
      await fulfillJson(route, { accessToken: 'fixture-token', expiresIn: 900 })
    } else if (url.pathname === '/auth/me') {
      await fulfillJson(route, user)
    } else if (url.pathname === '/api/events') {
      await fulfillJson(route, paginated([]))
    } else if (url.pathname === '/api/contact-messages' && route.request().method() === 'POST') {
      contact.sent.push({ body: route.request().postDataJSON(), authorization: route.request().headers().authorization })
      if (contact.status === 204) await route.fulfill({ status: 204, headers: { 'access-control-allow-origin': 'http://127.0.0.1:4183', 'access-control-allow-credentials': 'true' } })
      else await fulfillJson(route, contact.body ?? {}, contact.status)
    } else if (url.pathname === '/api/platform/event-creation-enabled') {
      await fulfillJson(route, { enabled: creation.enabled })
    } else if (url.pathname.startsWith('/api/platform/')) {
      await fulfillJson(route, { enabled: false })
    } else return false
    return true
  })
  await page.goto('/login?redirect=%2Fdashboard')
  await page.getByLabel(/Email/).fill('new@example.test')
  await page.getByLabel(/Mot de passe/).fill('fixture-password')
  await page.locator('form').getByRole('button', { name: 'Se connecter', exact: true }).click()
  await expect(page.getByRole('heading', { name: /Bonjour, Nadia/ })).toBeVisible()
  return fixture
}

test('a locked organizer is told why event creation is unavailable', async ({ page }) => {
  const fixture = await signInNewOrganizer(page, { enabled: false })

  await expect(page.getByText(NOTICE)).toBeVisible()
  await expect(page.getByText('Créez votre premier événement')).toHaveCount(0)

  await page.goto('/dashboard/events')
  await expect(page.getByText(NOTICE)).toBeVisible()
  await expect(page.getByRole('button', { name: /Nouvel événement/ })).toHaveCount(0)

  // A typed URL still lands on the list, where the notice explains the redirect.
  await page.goto('/dashboard/events/new')
  await expect(page).toHaveURL(/\/dashboard\/events$/)
  await expect(page.getByText(NOTICE)).toBeVisible()
  expect(fixture.unexpectedRequests).toEqual([])
})

test('the notice disappears on the next visit after activation, without a reload', async ({ page }) => {
  const creation = { enabled: false }
  await signInNewOrganizer(page, creation)
  await expect(page.getByText(NOTICE)).toBeVisible()

  creation.enabled = true
  await page.getByRole('link', { name: /Événements/ }).first().click()
  await expect(page).toHaveURL(/\/dashboard\/events$/)
  await expect(page.getByRole('button', { name: /Nouvel événement/ })).toBeVisible()
  await expect(page.getByText(NOTICE)).toHaveCount(0)
})

test('a locked organizer can write to the platform team from the notice', async ({ page }) => {
  const contact = { status: 204, sent: [] as unknown[] }
  const fixture = await signInNewOrganizer(page, { enabled: false }, contact)

  await page.getByRole('button', { name: 'Nous écrire' }).click()
  const field = page.getByLabel("Votre message à l'équipe")
  await expect(field).toBeFocused()
  await expect(page.getByRole('button', { name: 'Envoyer', exact: true })).toBeDisabled()
  await field.fill('  Bonjour, je suis wedding planner à Kinshasa.  ')
  await page.getByRole('button', { name: 'Envoyer', exact: true }).click()

  await expect(page.getByTestId('contact-sent')).toContainText('new@example.test')
  expect(contact.sent).toEqual([{
    body: { message: 'Bonjour, je suis wedding planner à Kinshasa.' },
    authorization: 'Bearer fixture-token',
  }])
  expect(fixture.unexpectedRequests).toEqual([])
})

test('a second message within the cooldown shows the server explanation', async ({ page }) => {
  const contact = {
    status: 429,
    body: { error: 'Votre message précédent a bien été reçu. Vous pourrez en envoyer un autre dans quelques minutes.' },
    sent: [] as unknown[],
  }
  await signInNewOrganizer(page, { enabled: false }, contact)

  await page.getByRole('button', { name: 'Nous écrire' }).click()
  await page.getByLabel("Votre message à l'équipe").fill('Encore moi')
  await page.getByRole('button', { name: 'Envoyer', exact: true }).click()

  await expect(page.getByRole('alert')).toContainText('Votre message précédent a bien été reçu')
  await expect(page.getByLabel("Votre message à l'équipe")).toHaveValue('Encore moi')
  await expect(page.getByTestId('contact-sent')).toHaveCount(0)
})

test('an activated organizer never sees the notice', async ({ page }) => {
  await signInNewOrganizer(page, { enabled: true })
  await expect(page.getByText('Créez votre premier événement')).toBeVisible()
  await expect(page.getByText(NOTICE)).toHaveCount(0)
})
