import { test, expect } from '@playwright/test'
import { fulfillJson, mockApi } from './support/e2e-api'

const diagnostics = {
  overall: 'ERROR',
  alerts: [
    { level: 'ERROR', title: 'Messages acceptés mais jamais livrés', detail: '3 message(s) acceptés par Meta depuis plus d\'une heure n\'ont aucun accusé de livraison.' },
    { level: 'ERROR', title: 'Webhook Meta non branché', detail: 'WHATSAPP_WEBHOOK_VERIFY_TOKEN est vide.' },
    { level: 'ERROR', title: "Image d'en-tête illisible (131053, 1 fois)", detail: 'Vérifiez que la photo de couverture s\'ouvre publiquement.' },
  ],
  config: {
    configured: true, phoneNumberId: '…4821', templateName: 'invitation_mariage', templateLanguage: 'fr', apiVersion: 'v23.0',
    sendHeaderImage: true, defaultCountryCode: null, webhookVerifyTokenSet: false, appSecretSet: false,
  },
  webhook: {
    callbackUrl: 'https://api.example.test/api/webhooks/whatsapp', lastVerifiedAt: null, lastReceivedAt: null,
    receivedSinceStart: 0, rejectedSinceStart: 0, lastStatusAt: null,
  },
  stats: { days: 7, accepted: 4, delivered: 0, read: 0, failed: 1, skipped: 0, awaitingOverOneHour: 3 },
  recentErrors: [{
    at: '2026-11-28T16:49:00', code: 131053, label: "Image d'en-tête illisible",
    cause: "Meta n'a pas pu télécharger l'image d'en-tête du modèle.", action: 'Vérifiez que la photo de couverture s\'ouvre publiquement.',
    rawMessage: '[131053] Media upload error', eventId: 1000013, eventName: 'Mariage de Jonathan et Sarah', afterAcceptance: true,
  }],
}

test('the super admin sees why WhatsApp invitations are not delivered', async ({ page }) => {
  const user = { id: 1, organizationId: 1, firstName: 'Admin', lastName: 'Plateforme', email: 'admin@example.test', active: true,
    roles: ['SUPER_ADMIN'], permissions: ['WEDDING_VIEW', 'ORGANIZATION_VIEW'] }
  const fixture = await mockApi(page, async (route, url) => {
    const p = url.pathname
    if (p === '/auth/refresh') await fulfillJson(route, { accessToken: 'fixture-token', expiresIn: 900 })
    else if (p === '/auth/me') await fulfillJson(route, user)
    else if (p === '/api/admin/whatsapp/diagnostics') await fulfillJson(route, diagnostics)
    else if (p === '/api/admin/notifications') await fulfillJson(route, { unreadCount: 0, items: [] })
    else if (p.startsWith('/api/platform/')) await fulfillJson(route, { enabled: true })
    else if (p === '/api/events') await fulfillJson(route, { content: [], totalPages: 1, totalElements: 0 })
    else return false
    return true
  })

  await page.goto('/dashboard/admin/whatsapp')
  await expect(page.locator('nav a[href="/dashboard/admin/whatsapp"]')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Envoi WhatsApp à corriger' })).toBeVisible()
  await expect(page.getByText('Messages acceptés mais jamais livrés')).toBeVisible()
  await expect(page.getByText('131053', { exact: true })).toBeVisible()
  await expect(page.getByText('Échec après acceptation')).toBeVisible()
  await expect(page.getByText('https://api.example.test/api/webhooks/whatsapp')).toBeVisible()
  await expect(page.getByText('Vide (WHATSAPP_WEBHOOK_VERIFY_TOKEN)')).toBeVisible()
  await expect(page.getByText('Aucun (numéros 08… ignorés)')).toBeVisible()
  await expect(page.getByText('…4821')).toBeVisible()
  expect(fixture.unexpectedRequests).toEqual([])
  await page.screenshot({ path: 'output/admin-whatsapp.png', fullPage: true })
})
