import { expect, test } from '@playwright/test'
import QRCode from 'qrcode'
import { readFileSync } from 'node:fs'
import { fulfillJson, mockApi } from './support/e2e-api'

test('connexion : noms de champs exacts et demande de réinitialisation neutre', async ({ page }) => {
  const requests: unknown[] = []
  const network = await mockApi(page, async (route, url) => {
    if (url.pathname !== '/auth/password-reset-requests') return false
    requests.push(route.request().postDataJSON())
    await fulfillJson(route, { message: 'Si un compte correspond à cette adresse, notre équipe a été prévenue et vous contactera.' }, 202)
    return true
  })
  await page.goto('/login')
  await expect(page.getByRole('textbox', { name: 'Email', exact: true })).toBeVisible()
  await expect(page.getByLabel('Mot de passe', { exact: true })).toBeVisible()
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill('nadia@example.test')
  await page.getByRole('button', { name: 'Mot de passe oublié ?', exact: true }).click()
  await expect(page.getByRole('link', { name: 'Ou écrivez-nous sur WhatsApp' })).toHaveAttribute('href', /^https:\/\/wa\.me\//)

  // Prefilled from the login field; Enter sends the request, never the login form.
  const field = page.getByLabel('Email du compte')
  await expect(field).toHaveValue('nadia@example.test')
  await field.fill('pas-un-email')
  await field.press('Enter')
  await expect(page.getByRole('alert')).toContainText('adresse email valide')
  expect(requests).toEqual([])

  await field.fill('nadia@example.test')
  await field.press('Enter')
  await expect(page.getByTestId('recovery-sent')).toContainText('notre équipe a été prévenue')
  expect(requests).toEqual([{ email: 'nadia@example.test' }])
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

for (const payload of [
  'generated-token-32',
  'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG',
  '1x0YJ--c_pgz-dmIs9rrvk_aioy7StjAXIEcVFTxRfg',
  'jAgq89XXi5i8wAvSb65RMD8j-6J3tOBgLL9-Xpuo7CI',
  'uiSv8Kai3yIS23VidjU_0XF1b6W-zkL6TDw9xQMzubM',
]) {
  test(`QR backend Java UTF-8 : ${payload}`, async ({ page }) => {
    await mockApi(page, async () => false)
    const image = `data:image/png;base64,${readFileSync(new URL(`./fixtures/backend-qr/${payload}.png`, import.meta.url)).toString('base64')}`
    await page.goto('/login')
    const decoded = await page.evaluate(async (dataUri) => {
      const modulePath = '/src/utils/qr.ts'
      const { decodeQrPayload } = await import(modulePath)
      return decodeQrPayload(dataUri)
    }, image)
    expect(decoded).toBe(payload)
  })
}