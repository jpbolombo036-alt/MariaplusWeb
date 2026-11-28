import { http, decodeMap } from './http'

export type DiagnosticLevel = 'ERROR' | 'WARNING' | 'INFO'

export interface WhatsAppDiagnostics {
  overall: 'OK' | 'WARNING' | 'ERROR'
  alerts: { level: DiagnosticLevel; title: string; detail: string }[]
  config: {
    configured: boolean
    phoneNumberId: string | null
    templateName: string | null
    templateLanguage: string | null
    apiVersion: string | null
    sendHeaderImage: boolean
    defaultCountryCode: string | null
    webhookVerifyTokenSet: boolean
    appSecretSet: boolean
  }
  webhook: {
    callbackUrl: string | null
    lastVerifiedAt: string | null
    lastReceivedAt: string | null
    receivedSinceStart: number
    rejectedSinceStart: number
    lastStatusAt: string | null
  }
  stats: {
    days: number
    accepted: number
    delivered: number
    read: number
    failed: number
    skipped: number
    awaitingOverOneHour: number
  }
  recentErrors: {
    at: string
    code: number
    label: string
    cause: string
    action: string
    rawMessage: string | null
    eventId: number | null
    eventName: string | null
    afterAcceptance: boolean
  }[]
}

/** Diagnostic de l'envoi WhatsApp (SUPER_ADMIN). */
export async function getWhatsAppDiagnostics(): Promise<WhatsAppDiagnostics> {
  return decodeMap((await http.get('/api/admin/whatsapp/diagnostics')).data) as unknown as WhatsAppDiagnostics
}
