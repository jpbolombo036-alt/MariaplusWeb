export const invitationCardTemplates = [
  { id: 'STANDARD', name: 'Standard', description: 'Ivoire, violet et doré. Un ticket élégant pour toutes vos occasions.' },
  { id: 'ROMANCE', name: 'Romance', description: 'Rose ancien, photographie et courbes douces pour votre union.' },
  { id: 'PRESTIGE', name: 'Prestige', description: 'Papier ivoire, tons champagne et calendrier de votre célébration.' },
] as const

export type InvitationCardTemplate = typeof invitationCardTemplates[number]['id']
export function resolveCardTemplate(value: unknown): InvitationCardTemplate {
  return invitationCardTemplates.find((template) => template.id === value)?.id ?? 'STANDARD'
}

/** Demo guest only: never invent a placement or a usable invitation token. */
export function cardPreviewData(event: { name?: string; eventDate?: string; startTime?: string; venueName?: string; venueAddress?: string; city?: string; message?: string }) {
  const rawDate = event.eventDate?.slice(0, 10)
  const date = rawDate ? new Date(`${rawDate}T12:00:00`) : null
  return {
    eventName: event.name || 'Votre événement',
    eventDate: date && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat('fr-FR', { day:'numeric', month:'long', year:'numeric' }).format(date) : null,
    eventStartTime: event.startTime || null,
    eventVenue: [event.venueName, event.venueAddress, event.city].filter(Boolean).join(', '),
    message: event.message || null,
    guestFirstName: 'Camille', guestLastName: 'Exemple',
    status: 'SENT', rsvpStatus: 'ACCEPTED', rsvpNumberOfAttendees: 1,
  }
}
