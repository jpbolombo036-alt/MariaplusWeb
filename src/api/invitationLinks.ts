import { extractPublicToken, getQr, inviteUrlFromPayload } from './invitations'
import { publicInvitationExists } from './publicInvitation'
import { decodeQrPayload } from '../utils/qr'
import { withTimeout } from '../utils/withTimeout'

/** Lecture seule : retrouver un lien ne doit jamais envoyer une invitation. */
export async function getInvitationLink(
  eventId: number,
  invitationId: number,
  decode: (dataUri: string) => Promise<string> = decodeQrPayload,
): Promise<string> {
  const qr = await getQr(eventId, invitationId)
  if (!qr.dataUri) return ''
  const payload = await withTimeout(decode(qr.dataUri), 15000, '')
  const url = inviteUrlFromPayload(payload)
  const token = extractPublicToken(url)
  if (!url || !token) return ''
  return await withTimeout(publicInvitationExists(token), 5000, false) ? url : ''
}