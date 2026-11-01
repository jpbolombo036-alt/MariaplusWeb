import { test, expect, type Page } from '@playwright/test'
import { BinaryBitmap, HybridBinarizer, QRCodeReader, RGBLuminanceSource } from '@zxing/library'
import { APP_ORIGIN } from './support/e2e-api'
import { INVITATION_PATH, INVITATION_TOKEN, mockPublicInvitation, publicInvitation } from './support/public-invitation'

type InvitationFixture = Awaited<ReturnType<typeof mockPublicInvitation>>

// Allow cold Vite module loading and a real html2canvas export on slower machines.
test.setTimeout(60_000)

function assertLocalPublicTraffic(fixture: InvitationFixture) {
  expect(fixture.unexpectedRequests).toEqual([])
  expect(fixture.pageErrors).toEqual([])
  expect(fixture.apiRequests.filter((request) => request.path.startsWith('/auth/'))).toEqual([])
  expect(fixture.apiRequests.every((request) => !request.authorization)).toBe(true)
  // Google Fonts are deliberately blocked; no application API may reach another origin.
  expect(fixture.externalRequests.filter((url) => new URL(url).pathname.startsWith('/api/'))).toEqual([])
}

async function assertNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }))
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1)
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport + 1)
}

/** Decode pixels from the exported PNG with ZXing, independently of the app's QR encoder. */
async function decodeExportedQr(page: Page) {
  const pixels = await page.locator('img.mp-inv-cardimg').evaluate((element) => {
    const image = element as HTMLImageElement
    const card = document.querySelector('.mp-inv-render')!.getBoundingClientRect()
    const qr = document.querySelector('.nx-ticket-qr img')!.getBoundingClientRect()
    const scale = image.naturalWidth / card.width
    const width = Math.round(qr.width * scale)
    const height = Math.round(qr.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')!
    context.drawImage(image, (qr.left - card.left) * scale, (qr.top - card.top) * scale, width, height, 0, 0, width, height)
    const rgba = context.getImageData(0, 0, width, height).data
    const luminance = Array.from({ length: width * height }, (_, index) =>
      (rgba[index * 4] + 2 * rgba[index * 4 + 1] + rgba[index * 4 + 2]) / 4)
    return { width, height, luminance }
  })
  const source = new RGBLuminanceSource(Uint8ClampedArray.from(pixels.luminance), pixels.width, pixels.height)
  return new QRCodeReader().decode(new BinaryBitmap(new HybridBinarizer(source))).getText()
}

for (const viewport of [{ name: 'ordinateur', width: 1440, height: 1000 }, { name: 'mobile', width: 390, height: 844 }]) {
  test(`invitation publique sans session : détails et formulaire sur ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    const fixture = await mockPublicInvitation(page)
    await page.goto(INVITATION_PATH, { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { name: 'Marie et Paul', exact: true })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Bonjour Alice,', { exact: false })).toBeVisible()
    await expect(page.getByText('12 décembre 2026', { exact: true })).toBeVisible()
    await expect(page.getByText('18:30', { exact: true })).toBeVisible()
    await expect(page.getByText(publicInvitation.message!, { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Ouvrir Jardin des Palmiers dans Google Maps' })).toHaveAttribute('href', publicInvitation.mapUrl!)
    await expect(page.locator('.mp-inv-map-link')).toHaveAttribute('rel', 'noopener noreferrer')
    await expect(page.locator('.mp-inv-map-link')).toHaveAttribute('target', '_blank')

    await expect(page.getByRole('heading', { name: 'Tenue & harmonie' })).toBeVisible()
    await expect(page.locator('.mp-inv-color-name')).toHaveText(['Violet', 'Doré'])
    await expect(page.locator('.mp-inv-color-swatch').first()).toHaveCSS('background-color', 'rgb(84, 39, 199)')
    const fabric = page.locator('.mp-inv-fabric-image img')
    await fabric.scrollIntoViewIfNeeded()
    await fabric.evaluate((image: HTMLImageElement) => image.decode())
    expect(await fabric.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0)
    await expect(page.getByRole('heading', { name: 'Programme', exact: true })).toBeVisible()
    await expect(page.locator('.mp-inv-program-name')).toHaveText(['Bénédiction de notre union', 'Dîner et réception'])
    await expect(page.locator('.mp-inv-program-time')).toHaveText(['14h00 – 15h30', '18h30'])
    await expect(page.locator('.mp-inv-program-map').first()).toHaveAttribute('href', publicInvitation.sessions![0].mapUrl!)
    await expect(page.locator('.mp-inv-program-map').nth(1)).toHaveAttribute('href', 'https://www.google.com/maps/search/?api=1&query=-4.325,15.322')
    await expect(page.getByRole('button', { name: 'Voir la photo 2' })).toBeVisible()
    await page.getByRole('button', { name: 'Voir la photo 2' }).click()
    await expect(page.getByRole('button', { name: 'Voir la photo 2' })).toHaveClass(/mp-inv-dot--active/)
    await assertNoHorizontalOverflow(page)

    await page.getByRole('button', { name: 'Je serai présent(e)', exact: false }).click()
    await expect(page.getByRole('button', { name: 'Confirmer ma présence', exact: false })).toBeVisible()
    await expect(page.locator('.mp-drink-card')).toHaveCount(4)
    await assertNoHorizontalOverflow(page)
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Marie et Paul', exact: true })).toBeVisible({ timeout: 15_000 })
    await expect(page).toHaveURL(`${APP_ORIGIN}${INVITATION_PATH}`)
    expect(fixture.invitationReads).toBe(2)
    expect(await page.context().cookies()).toEqual([])
    assertLocalPublicTraffic(fixture)
  })
}

test('RSVP accepté : limites, PNG avec QR lisible, sauvegarde et téléchargement', async ({ page }) => {
  const fixture = await mockPublicInvitation(page)
  await page.goto(INVITATION_PATH, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Je serai présent(e)', exact: false }).click()
  const add = page.getByRole('button', { name: 'Ajouter une personne' })
  const remove = page.getByRole('button', { name: 'Retirer une personne' })
  await expect(remove).toBeDisabled()
  await expect(page.locator('.mp-inv-step-value')).toHaveText('1')
  await add.click()
  await add.click()
  await expect(add).toBeDisabled()
  await expect(page.locator('.mp-inv-step-value')).toHaveText('3')

  for (const name of ['Eau minérale', 'Jus de mangue', 'Bissap']) await page.getByRole('button', { name, exact: false }).click()
  await page.getByRole('button', { name: 'Thé glacé', exact: false }).click()
  await expect(page.getByText('Vous pouvez choisir au maximum 3 boissons.', { exact: true })).toBeVisible()
  await expect(page.locator('.mp-drink-card--selected')).toHaveCount(3)
  await expect(page.getByRole('button', { name: 'Thé glacé', exact: false })).not.toHaveClass(/mp-drink-card--selected/)
  await page.getByRole('button', { name: 'Bissap', exact: false }).click()
  await page.getByRole('button', { name: 'Thé glacé', exact: false }).click()
  await page.locator('#mp-note').fill('  Heureux de célébrer avec vous !  ')
  await page.getByRole('button', { name: 'Confirmer ma présence', exact: false }).click()

  await expect(page.locator('.mp-inv-success-name')).toHaveText('Alice Mukendi')
  await expect(page.locator('.mp-inv-success').getByText('Présence confirmée', { exact: true })).toBeVisible()
  await expect.poll(() => fixture.rsvps).toEqual([{
    status: 'ACCEPTED',
    numberOfAttendees: 3,
    drinkChoices: ['Eau minérale', 'Jus de mangue', 'Thé glacé'],
    note: 'Heureux de célébrer avec vous !',
  }])
  const preview = page.getByRole('img', { name: 'Votre invitation confirmée' })
  await expect(preview).toBeVisible({ timeout: 20_000 })
  await expect(preview).toHaveJSProperty('naturalWidth', 1278)
  await expect(preview).toHaveJSProperty('naturalHeight', 1920)
  await expect(page.getByText("Enregistrée — présentée à l'accueil", { exact: false })).toBeVisible()
  expect(await decodeExportedQr(page)).toBe(INVITATION_TOKEN)

  const source = await preview.getAttribute('src')
  expect(source).toMatch(/^data:image\/png;base64,/)
  const png = Buffer.from(source!.split(',')[1], 'base64')
  expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  expect(png.readUInt32BE(16)).toBe(1278)
  expect(png.readUInt32BE(20)).toBe(1920)
  expect(png.length).toBeGreaterThan(20_000)
  expect(fixture.uploads).toHaveLength(1)
  const upload = fixture.uploads[0]
  expect(upload.contentType).toMatch(/^multipart\/form-data; boundary=/)
  const boundary = upload.contentType.split('boundary=')[1]
  const headerEnd = upload.body.indexOf('\r\n\r\n')
  const fileEnd = upload.body.indexOf(`\r\n--${boundary}`, headerEnd + 4)
  const headers = upload.body.subarray(0, headerEnd).toString('utf8')
  expect(headers).toContain('name="file"; filename="invitation-confirmee.png"')
  expect(headers).toContain('Content-Type: image/png')
  expect(upload.body.subarray(headerEnd + 4, fileEnd)).toEqual(png)

  const pendingDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: "Télécharger l'invitation", exact: false }).click()
  const download = await pendingDownload
  expect(download.suggestedFilename()).toBe('invitation-confirmee-alice.png')
  const stream = await download.createReadStream()
  expect(stream).not.toBeNull()
  const chunks: Buffer[] = []
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk))
  expect(Buffer.concat(chunks)).toEqual(png)
  assertLocalPublicTraffic(fixture)
})

test('réouverture du RSVP accepté, modification en refus et réouverture du refus', async ({ page }) => {
  const fixture = await mockPublicInvitation(page, {
    invitation: {
      rsvpStatus: 'ACCEPTED',
      rsvpNumberOfAttendees: 3,
      rsvpDrinkChoices: ['Eau minérale', 'Jus de mangue', 'Thé glacé'],
      rsvpNote: 'Heureux de célébrer avec vous !',
    },
  })
  await page.goto(INVITATION_PATH, { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.mp-inv-success-name')).toHaveText('Alice Mukendi')
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.locator('.mp-inv-success-name')).toHaveText('Alice Mukendi')
  expect(fixture.rsvps).toEqual([])
  await page.getByRole('button', { name: 'Modifier ma réponse', exact: true }).click()
  await page.getByRole('button', { name: 'Je serai présent(e)', exact: false }).click()
  await expect(page.locator('.mp-inv-step-value')).toHaveText('3')
  await expect(page.locator('.mp-drink-card--selected .mp-drink-name')).toHaveText(['Eau minérale', 'Jus de mangue', 'Thé glacé'])
  await page.getByRole('button', { name: 'Je ne pourrai pas venir', exact: false }).click()
  await page.locator('#mp-decline-note').fill('  Un empêchement, toutes mes félicitations !  ')
  await page.getByRole('button', { name: 'Confirmer mon absence', exact: false }).click()
  await expect(page.getByRole('heading', { name: 'Merci pour votre réponse !', exact: true })).toBeVisible()
  expect(fixture.rsvps).toEqual([{ status: 'DECLINED', numberOfAttendees: 0, note: 'Un empêchement, toutes mes félicitations !' }])
  await expect(page.getByRole('img', { name: 'Votre invitation confirmée' })).toHaveCount(0)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: 'Merci pour votre réponse !', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Modifier ma réponse', exact: true })).toBeVisible()
  expect(fixture.rsvps).toHaveLength(1)
  assertLocalPublicTraffic(fixture)
})

test('la carte confirmée reste téléchargeable si sa sauvegarde échoue', async ({ page }) => {
  const fixture = await mockPublicInvitation(page, {
    invitation: { rsvpStatus: 'ACCEPTED', rsvpNumberOfAttendees: 2 },
    cardUploadHttpStatus: 503,
  })
  await page.goto(INVITATION_PATH, { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('img', { name: 'Votre invitation confirmée' })).toBeVisible({ timeout: 20_000 })
  await expect.poll(() => fixture.uploads.length).toBe(1)
  await expect(page.getByRole('button', { name: "Télécharger l'invitation", exact: false })).toBeEnabled()
  await expect(page.getByText("Enregistrée — présentée à l'accueil", { exact: false })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Invitation indisponible' })).toHaveCount(0)
  expect(fixture.rsvps).toEqual([])
  assertLocalPublicTraffic(fixture)
})

for (const state of [
  { name: 'jeton inconnu', options: { invitationHttpStatus: 404 }, message: "Cette invitation n'est plus accessible ou n'existe pas." },
  { name: 'réponse HTTP expirée', options: { invitationHttpStatus: 410 }, message: 'Cette invitation a expiré.' },
  { name: 'statut expiré', options: { invitation: { status: 'EXPIRED' } }, message: 'Cette invitation a expiré.' },
  { name: 'statut annulé', options: { invitation: { status: 'CANCELLED' } }, message: "Cette invitation a été annulée par l'organisateur." },
]) {
  test(`invitation indisponible : ${state.name}`, async ({ page }) => {
    const fixture = await mockPublicInvitation(page, state.options)
    await page.goto(INVITATION_PATH, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Invitation indisponible', exact: true })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(state.message, { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Je serai présent(e)', exact: false })).toHaveCount(0)
    await expect(page.locator('.mp-inv-form')).toHaveCount(0)
    expect(fixture.rsvps).toEqual([])
    expect(fixture.uploads).toEqual([])
    assertLocalPublicTraffic(fixture)
  })
}
