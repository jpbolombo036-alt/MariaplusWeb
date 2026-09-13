import { http, decodeMap, decodeList } from './http'

/**
 * Boisson du catalogue avec son statut de DISPONIBILITÉ pour un événement.
 * L'organisateur déclare les boissons que ses invités verront sur le RSVP.
 */
export interface AvailableDrink {
  catalogItemId: number
  name: string
  description?: string | null
  displayOrder?: number | null
  active: boolean
  /** Déclarée disponible pour cet événement (visible par les invités). */
  available: boolean
  imageUrl?: string | null
}

function parse(json: Record<string, unknown>): AvailableDrink {
  return {
    catalogItemId: Number(json.catalogItemId ?? 0),
    name: String(json.name ?? ''),
    description: json.description ? String(json.description) : null,
    displayOrder: json.displayOrder != null ? Number(json.displayOrder) : null,
    active: Boolean(json.active ?? true),
    available: Boolean(json.available ?? false),
    imageUrl: json.imageUrl ? String(json.imageUrl) : null,
  }
}

/** Catalogue + statut de disponibilité pour l'événement. */
export async function listAvailableDrinks(eventId: number): Promise<AvailableDrink[]> {
  const res = await http.get(`/api/events/${eventId}/available-drinks`)
  return (decodeList(res.data) as Record<string, unknown>[]).map(parse)
}

/** Déclare / retire la disponibilité d'une boisson du catalogue pour l'événement. */
export async function toggleAvailableDrink(eventId: number, catalogItemId: number, available: boolean): Promise<AvailableDrink> {
  const res = await http.put(`/api/events/${eventId}/available-drinks`, { catalogItemId, available })
  return parse(decodeMap(res.data))
}
