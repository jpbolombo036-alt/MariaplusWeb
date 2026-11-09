import { expect, test } from '@playwright/test'
import QRCode from 'qrcode'
import { mockApi } from './support/e2e-api'

test('connexion : noms de champs exacts et assistance de récupération honnête', async ({ page }) => {
  const network = await mockApi(page, async () => false)
  await page.goto('/login')
  await expect(page.getByRole('textbox', { name: 'Email', exact: true })).toBeVisible()
  await expect(page.getByLabel('Mot de passe', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Mot de passe oublié ?', exact: true }).click()
  await expect(page.getByRole('status')).toContainText("La réinitialisation automatique n'est pas encore disponible")
  await expect(page.getByRole('link', { name: "Contacter l'assistance" })).toHaveAttribute('href', /^https:\/\/wa\.me\//)
  expect(network.unexpectedRequests).toEqual([])
})

for (const payload of ['generated-token-32', 'https://front.example.test/invitations/generated-token-32']) {
  test(`QR de nouvelle invitation : décodage réel (${payload.startsWith('https') ? 'URL' : 'jeton'})`, async ({ page }) => {
    const network = await mockApi(page, async () => false)
    const dataUri = await QRCode.toDataURL(payload, { width: 320, margin: 1 })
    await page.goto('/login')
    const decoded = await page.evaluate(async (image) => {
      const modulePath = '/src/utils/qr.ts'
      const { decodeQrPayload } = await import(modulePath)
      return decodeQrPayload(image)
    }, dataUri)
    expect(decoded).toBe(payload)
    expect(network.unexpectedRequests).toEqual([])
  })
}