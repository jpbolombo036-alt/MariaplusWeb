import { readFileSync } from 'node:fs'
import type { Page } from '@playwright/test'
import type { PublicInvitation } from '../../src/api/publicInvitation'
import { APP_ORIGIN, fulfillJson, mockApi } from './e2e-api'

export const INVITATION_TOKEN = 'public-e2e-invitation-token'
export const INVITATION_PATH = `/invitations/${INVITATION_TOKEN}`

export const publicInvitation: PublicInvitation = {
  guestFirstName: 'Alice',
  guestLastName: 'Mukendi',
  weddingDisplayName: 'Marie et Paul',
  eventName: 'Mariage de Marie et Paul',
  eventDate: '12 décembre 2026',
  eventStartTime: '18h30',
  eventVenue: 'Jardin des Palmiers, Kinshasa',
  mapUrl: 'https://www.google.com/maps/search/?api=1&query=Jardin+des+Palmiers',
  message: 'Retrouvons-nous pour célébrer notre union.',
  couplePhotoUrl: '/fixtures/couple.png',
  groomPhotoUrl: '/fixtures/groom.png',
  dressColors: [
    { value: 'PURPLE', label: 'Violet', hex: '#5427c7', description: 'Une touche de violet' },
    { value: 'GOLD', label: 'Doré', hex: '#c7a454', description: 'Accessoires dorés' },
  ],
  dressImageUrl: '/fixtures/fabric.png',
  maxAccepted: 3,
  status: 'SENT',
  rsvpStatus: 'PENDING',
  rsvpNumberOfAttendees: null,
  rsvpDrinkChoices: [],
  rsvpNote: null,
  publicToken: INVITATION_TOKEN,
  sessions: [
    {
      name: 'Bénédiction de notre union',
      type: 'RELIGIOUS_CEREMONY',
      sessionDate: '2026-12-12',
      startTime: '14:00:00',
      endTime: '15:30:00',
      venueName: 'Chapelle Sainte-Anne',
      city: 'Kinshasa',
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=Chapelle+Sainte-Anne',
      description: 'La cérémonie sera suivie des photos de famille.',
    },
    {
      name: 'Dîner et réception',
      type: 'RECEPTION',
      startTime: '18:30:00',
      venueName: 'Jardin des Palmiers',
      city: 'Kinshasa',
      latitude: -4.325,
      longitude: 15.322,
    },
  ],
}

export const publicDrinks = ['Eau minérale', 'Jus de mangue', 'Bissap', 'Thé glacé'].map((name, index) => ({
  id: index + 1,
  name,
  active: true,
  displayOrder: index,
}))

export interface RsvpPayload {
  status: 'ACCEPTED' | 'DECLINED'
  numberOfAttendees: number
  drinkChoices?: string[]
  note?: string
}

interface FixtureOptions {
  invitation?: Partial<PublicInvitation>
  invitationHttpStatus?: number
  cardUploadHttpStatus?: number
}

/** Stateful local API: GET reflects only the RSVP payload actually submitted by the UI. */
export async function mockPublicInvitation(page: Page, options: FixtureOptions = {}) {
  const invitation = structuredClone({ ...publicInvitation, ...options.invitation })
  const rsvps: RsvpPayload[] = []
  const uploads: { body: Buffer; contentType: string }[] = []
  const apiRequests: { path: string; authorization?: string }[] = []
  const pageErrors: string[] = []
  let invitationReads = 0
  const image = readFileSync(new URL('../../public/logo.png', import.meta.url))

  page.on('pageerror', (error) => pageErrors.push(error.message))
  const traffic = await mockApi(page, async (route, url) => {
    const request = route.request()
    apiRequests.push({ path: url.pathname, authorization: request.headers().authorization })
    const prefix = `/api/public/invitations/${INVITATION_TOKEN}`

    if (url.pathname.startsWith('/fixtures/')) {
      await route.fulfill({
        contentType: 'image/png',
        body: image,
        headers: {
          'access-control-allow-origin': APP_ORIGIN,
          'access-control-allow-credentials': 'true',
        },
      })
      return true
    }
    if (url.pathname === prefix && request.method() === 'GET') {
      invitationReads++
      await fulfillJson(route, options.invitationHttpStatus
        ? { error: 'Invitation indisponible' }
        : invitation, options.invitationHttpStatus ?? 200)
      return true
    }
    if (url.pathname === `${prefix}/drinks` && request.method() === 'GET') {
      await fulfillJson(route, publicDrinks)
      return true
    }
    if (url.pathname === `${prefix}/gallery` && request.method() === 'GET') {
      await fulfillJson(route, { id: 1, eventId: 42, enabled: true, photos: [] })
      return true
    }
    if (url.pathname === `${prefix}/rsvp` && request.method() === 'POST') {
      const payload = request.postDataJSON() as RsvpPayload
      rsvps.push(payload)
      Object.assign(invitation, {
        rsvpStatus: payload.status,
        rsvpNumberOfAttendees: payload.numberOfAttendees,
        rsvpDrinkChoices: payload.drinkChoices ?? [],
        rsvpNote: payload.note ?? null,
      })
      await fulfillJson(route, {
        invitationStatus: 'SENT',
        rsvpStatus: payload.status,
        numberOfAttendees: payload.numberOfAttendees,
      })
      return true
    }
    if (url.pathname === `${prefix}/card` && request.method() === 'POST') {
      uploads.push({ body: request.postDataBuffer() ?? Buffer.alloc(0), contentType: request.headers()['content-type'] })
      await fulfillJson(route, options.cardUploadHttpStatus ? { error: 'Stockage temporairement indisponible' } : {}, options.cardUploadHttpStatus ?? 200)
      return true
    }
    return false
  })

  return { ...traffic, rsvps, uploads, apiRequests, pageErrors, get invitationReads() { return invitationReads } }
}
