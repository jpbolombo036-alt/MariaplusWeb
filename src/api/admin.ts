import { http, decodeMap } from './http'
import { ApiConfig } from './config'

/**
 * Réglages plateforme (interrupteurs globaux).
 * Lecture : tout utilisateur authentifié — écriture : SUPER_ADMIN (403 sinon).
 */
export interface WhatsappSettings {
  whatsappSendingEnabled: boolean
}

function parseSettings(json: Record<string, unknown>): WhatsappSettings {
  return { whatsappSendingEnabled: Boolean(json.whatsappSendingEnabled ?? true) }
}

export async function getWhatsappSettings(): Promise<WhatsappSettings> {
  const res = await http.get(ApiConfig.adminWhatsappSettingsPath)
  return parseSettings(decodeMap(res.data))
}

export async function updateWhatsappSettings(enabled: boolean): Promise<WhatsappSettings> {
  const res = await http.put(ApiConfig.adminWhatsappSettingsPath, { enabled })
  return parseSettings(decodeMap(res.data))
}