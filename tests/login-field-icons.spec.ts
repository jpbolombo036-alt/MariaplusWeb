import { expect, test } from '@playwright/test'
import { mockApi } from './support/e2e-api'

/** Le texte saisi ne doit jamais passer sous l'icône de gauche ni sous le bouton « œil ». */
test('login fields keep their text clear of the icons', async ({ page }) => {
  await mockApi(page, async () => false)
  await page.goto('/login')
  const padding = async (label: string) => page.getByLabel(label, { exact: true }).evaluate((el) => {
    const s = getComputedStyle(el)
    return { left: parseFloat(s.paddingLeft), right: parseFloat(s.paddingRight) }
  })
  expect((await padding('Email')).left).toBeGreaterThanOrEqual(40)
  const pwd = await padding('Mot de passe')
  expect(pwd.left).toBeGreaterThanOrEqual(40)
  expect(pwd.right).toBeGreaterThanOrEqual(40)

  await page.getByLabel('Email', { exact: true }).fill('jean-pierre.bolombo@exemple.com')
  await page.getByLabel('Mot de passe', { exact: true }).fill('un-mot-de-passe-assez-long')
  await page.getByRole('button', { name: 'Afficher le mot de passe' }).click()
  await page.locator('form').screenshot({ path: 'output/login-fields-fixed.png' })

  await page.goto('/login?mode=register')
  expect((await padding('Mot de passe')).right).toBeGreaterThanOrEqual(40)
  expect((await padding('Confirmation du mot de passe')).right).toBeGreaterThanOrEqual(40)
})
