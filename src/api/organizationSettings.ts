import { http, decodeMap } from './http'

/**
 * Réglages par organisation (SUPER_ADMIN) avec héritage du réglage global :
 * null = hériter, true/false = override explicite.
 */
export interface OrgSettings {
  whatsappEnabled: boolean | null
  eventCreationEnabled: boolean | null
  /** Module « Salles » : null ou false = désactivé (pas d'héritage global). */
  venueModuleEnabled: boolean | null
  effectiveWhatsapp: boolean
  effectiveEventCreation: boolean
  effectiveVenueModule: boolean
}

function mapSettings(data: unknown): OrgSettings {
  const j = decodeMap(data)
  return {
    whatsappEnabled: (j.whatsappEnabled ?? null) as boolean | null,
    eventCreationEnabled: (j.eventCreationEnabled ?? null) as boolean | null,
    effectiveWhatsapp: Boolean(j.effectiveWhatsapp),
    effectiveEventCreation: Boolean(j.effectiveEventCreation),
    venueModuleEnabled: (j.venueModuleEnabled ?? null) as boolean | null,
    effectiveVenueModule: Boolean(j.effectiveVenueModule),
  }
}

/** Réglages d'une organisation (SUPER_ADMIN). */
export async function getOrgSettings(orgId: number): Promise<OrgSettings> {
  const res = await http.get(`/api/admin/organizations/${orgId}/settings`)
  return mapSettings(res.data)
}

/**
 * Modifie un réglage d'une organisation :
 * true/false = override explicite, 'inherit' = revenir au réglage global.
 */
export async function updateOrgSettings(
  orgId: number,
  body: {
    whatsappEnabled?: boolean | 'inherit'
    eventCreationEnabled?: boolean | 'inherit'
    venueModuleEnabled?: boolean
  },
): Promise<OrgSettings> {
  const res = await http.put(`/api/admin/organizations/${orgId}/settings`, body)
  return mapSettings(res.data)
}
