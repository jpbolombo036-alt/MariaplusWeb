import { test, expect } from '@playwright/test'
import { fulfillJson, mockApi } from './support/e2e-api'

const paginated = (content: unknown[]) => ({ content, totalPages: 1, currentPage: 0, totalElements: content.length })

test('the event wizard creates a wedding in five short steps', async ({ page }) => {
  const user = {
    id: 5, organizationId: 9, firstName: 'Nadia', lastName: 'Nouvelle', email: 'new@example.test',
    active: true, roles: ['ORGANISATEUR'], permissions: ['WEDDING_VIEW', 'WEDDING_CREATE', 'EVENT_CREATE'],
  }
  let created: Record<string, unknown> | null = null
  await mockApi(page, async (route, url) => {
    const method = route.request().method()
    if (url.pathname === '/auth/login') await fulfillJson(route, { accessToken: 't', expiresIn: 900, user })
    else if (url.pathname === '/auth/refresh') await fulfillJson(route, { accessToken: 't', expiresIn: 900 })
    else if (url.pathname === '/auth/me') await fulfillJson(route, user)
    else if (url.pathname === '/api/events' && method === 'POST') {
      created = route.request().postDataJSON()
      await fulfillJson(route, { id: 77, ...created })
    } else if (url.pathname === '/api/events') await fulfillJson(route, paginated([]))
    else if (url.pathname === '/api/events/dress-codes') await fulfillJson(route, [])
    else if (url.pathname === '/api/platform/event-creation-enabled') await fulfillJson(route, { enabled: true })
    else if (url.pathname.startsWith('/api/platform/')) await fulfillJson(route, { enabled: false })
    else if (url.pathname.startsWith('/api/events/77')) await fulfillJson(route, {}, 404)
    else return false
    return true
  })

  await page.goto('/login?redirect=%2Fdashboard%2Fevents%2Fnew')
  await page.getByLabel(/Email/).fill('new@example.test')
  await page.getByLabel(/Mot de passe/).fill('x')
  await page.locator('form').getByRole('button', { name: 'Se connecter', exact: true }).click()
  await expect(page.getByText('Étape 1 sur 5 · L’essentiel')).toBeVisible()

  // The couple's first names are required for a wedding.
  await page.getByRole('button', { name: /Continuer/ }).click()
  await expect(page.getByRole('alert')).toContainText('requis')

  await page.getByLabel('Prénom').first().fill('Patrick')
  await page.getByLabel('Nom', { exact: true }).first().fill('Kabongo')
  await page.getByLabel('Prénom').nth(1).fill('Grace')
  await page.getByLabel('Nom', { exact: true }).nth(1).fill('Mukendi')
  await expect(page.getByLabel("Nom de l'événement")).toHaveValue('Mariage de Patrick et Grace')
  await page.getByLabel('Date').fill('2027-03-20')
  await page.getByLabel('Début').fill('14:00')
  await page.getByRole('button', { name: /Continuer/ }).click()

  await expect(page.getByText('Étape 2 sur 5')).toBeVisible()
  await page.getByLabel('Nom du lieu').fill('Salle Exodus')
  await page.getByLabel('Ville').fill('Bukavu')
  await page.getByText('Coordonnées GPS (avancé)').click()
  await page.getByLabel('Latitude').fill('-2,5')
  await page.getByRole('button', { name: /Continuer/ }).click()
  await page.getByRole('button', { name: /Continuer/ }).click()

  await expect(page.getByText('Étape 4 sur 5')).toBeVisible()
  await page.getByRole('button', { name: /Continuer/ }).click()

  await expect(page.getByText('Salle Exodus, Bukavu')).toBeVisible()
  await expect(page.getByText('Patrick Kabongo et Grace Mukendi')).toBeVisible()
  await page.getByRole('button', { name: /Créer l'événement/ }).click()

  await expect(page).toHaveURL(/\/dashboard\/events\/77/)
  expect(created).toMatchObject({
    name: 'Mariage de Patrick et Grace',
    type: 'WEDDING',
    weddingDetails: { groomFirstName: 'Patrick', brideLastName: 'Mukendi' },
    eventDate: '2027-03-20',
    startTime: '14:00',
    venueName: 'Salle Exodus',
    city: 'Bukavu',
    latitude: -2.5,
  })
})
