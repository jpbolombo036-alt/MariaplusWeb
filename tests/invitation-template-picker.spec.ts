import { test, expect } from '@playwright/test'
import { API_ORIGIN, fulfillJson, mockApi } from './support/e2e-api'

test('organizer previews, saves and restores the event card template on mobile', async ({ page }) => {
  await page.setViewportSize({ width:390, height:844 })
  let selected = 'STANDARD'
  const writes: unknown[] = []
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  const event = () => ({ id:1, organizationId:1, name:'La célébration de Marie & Paul', type:'OTHER', status:'ACTIVE',
    eventDate:'2026-12-12', startTime:'18:30', venueName:'Jardin des Palmiers', invitationCardTemplate:selected, hasImage:false })
  const api = await mockApi(page, async (route, url) => {
    const path = url.pathname
    if (path === '/auth/login' || path === '/auth/refresh') {
      await fulfillJson(route, { accessToken:'template-fixture', expiresIn:900, user:{
        id:1, firstName:'Compte', lastName:'Test', organizationId:1, roles:['ORGANIZER'], permissions:['EVENT_UPDATE','WEDDING_UPDATE','EVENT_VIEW'],
      } })
    } else if (path === '/auth/me') await fulfillJson(route, { id:1, organizationId:1, roles:['ORGANIZER'], permissions:['EVENT_UPDATE','WEDDING_UPDATE','EVENT_VIEW'] })
    else if (path === '/api/events/1' && route.request().method() === 'PUT') {
      const body = route.request().postDataJSON()
      selected = body.invitationCardTemplate || selected
      writes.push(body)
      await fulfillJson(route, event())
    } else if (path === '/api/events/1') await fulfillJson(route, event())
    else if (path === '/api/events') await fulfillJson(route, { content:[event()], totalPages:1, totalElements:1 })
    else if (path === '/api/events/dress-codes') await fulfillJson(route, [])
    else if (path === '/api/events/1/sessions') await fulfillJson(route, { content:[], totalPages:1, totalElements:0 })
    else if (path === '/api/events/1/image' || path === '/api/events/1/dress-image') await fulfillJson(route, {}, 404)
    else if (path === '/api/events/1/dashboard') await fulfillJson(route, { eventId:1, guests:{total:0} })
    else if (path.startsWith('/api/platform/')) await fulfillJson(route, { enabled:true })
    else return false
    return true
  })
  await page.context().addCookies([{ name:'mp_refresh', value:'template-session-fixture', url:API_ORIGIN, httpOnly:true, sameSite:'Lax' }])
  await page.goto('/dashboard/events/1/edit', { waitUntil:'domcontentloaded' })
  await expect(page.getByRole('radio')).toHaveCount(3, { timeout:30_000 })
  await page.getByRole('radio', { name:/Prestige/ }).check()
  await page.getByRole('button', { name:'Agrandir l’aperçu' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('dialog').locator('[data-card-template]')).toHaveAttribute('data-card-template','PRESTIGE')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await page.getByRole('button', { name:'Enregistrer', exact:true }).click()
  await expect.poll(() => selected).toBe('PRESTIGE')
  await expect(page).toHaveURL(/\/dashboard\/events\/1$/)
  await page.getByRole('button', { name:/Modifier$/ }).click()
  await expect(page.getByRole('radio', { name:/Prestige/ })).toBeChecked({ timeout:30_000 })
  await expect(page.getByText(/Les images déjà téléchargées/)).toBeVisible()
  expect(writes).toHaveLength(1)
  expect(errors).toEqual([])
  expect(api.unexpectedRequests).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await expect(page.locator('.mp-toast--error')).toHaveCount(0)
  await page.locator('.template-picker').scrollIntoViewIfNeeded()
  await page.locator('.template-picker').screenshot({ path:'output/playwright/invitation-models/selector-mobile.png' })
})
