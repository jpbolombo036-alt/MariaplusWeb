import { expect, test } from '@playwright/test'
import { fulfillJson, mockApi } from './support/e2e-api'

test('registration runs in two steps and flags a venue owner', async ({ page }) => {
  let payload: Record<string, unknown> | null = null
  await mockApi(page, async (route, url) => {
    if (url.pathname === '/auth/register' && route.request().method() === 'POST') {
      payload = route.request().postDataJSON()
      await fulfillJson(route, { error: 'Cet email est déjà utilisé' }, 409)
      return true
    }
    return false
  })

  await page.goto('/login?mode=register')
  await expect(page.getByText('Étape 1 sur 2')).toBeVisible()
  await page.getByLabel('Prénom').fill('Grace')
  await page.getByLabel('Nom', { exact: true }).fill('Mwamba')
  await page.getByLabel('Email').fill('grace@example.test')
  await page.getByLabel(/Téléphone WhatsApp/).fill('+243 81 234 5678')
  await page.getByLabel('Mot de passe', { exact: true }).fill('MotDePasse123')
  await page.getByLabel('Confirmation du mot de passe', { exact: true }).fill('MotDePasse123')
  await page.getByRole('button', { name: 'Continuer' }).click()

  await expect(page.getByText('Étape 2 sur 2')).toBeVisible()
  await page.getByText("J'ai une salle").click()
  await expect(page.getByText('active le module Salles')).toBeVisible()
  await page.getByLabel('Nom de la salle ou de la société').fill('Salle Exodus')
  await page.getByRole('button', { name: 'Créer mon espace' }).click()

  await expect(page.getByRole('alert')).toContainText('Cet email est déjà utilisé')
  expect(payload).toMatchObject({
    firstName: 'Grace',
    email: 'grace@example.test',
    organizationName: 'Salle Exodus',
    organizationEmail: 'grace@example.test',
    organizationPhone: '+243 81 234 5678',
    venueOwner: true,
  })

  // Back to step 1 keeps what was typed.
  await page.getByRole('button', { name: 'Retour' }).click()
  await expect(page.getByLabel('Prénom')).toHaveValue('Grace')
})

test('the login page has no horizontal scroll on a phone and shows the product preview', async ({ page }) => {
  await mockApi(page, async () => false)
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Connexion à votre espace' })).toBeVisible()
  await expect(page.getByLabel("Aperçu d'EventiaEasy (exemple)")).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBe(0)
})
