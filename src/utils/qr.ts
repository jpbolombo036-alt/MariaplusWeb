/**
 * Lecture d'un QR code fourni sous forme de data URI (PNG) — sert à retrouver le
 * jeton public d'une invitation à partir de son QR, sans dépendre de la réponse
 * de `/send` ou `/resend`.
 *
 * ZXing est chargé à la demande (chunk séparé) : l'onglet Invitations ne
 * télécharge le décodeur que si l'organisateur demande un lien.
 *
 * Renvoie le texte encodé (`''` si l'image est illisible ou le QR non détecté).
 */
export async function decodeQrPayload(dataUri: string): Promise<string> {
  if (!dataUri) return ''
  try {
    const { BrowserMultiFormatReader } = await import('@zxing/browser')
    const reader = new BrowserMultiFormatReader()
    const result = await reader.decodeFromImageUrl(dataUri)
    return result?.getText() ?? ''
  } catch {
    // QR non décodable (image non chargée, format inattendu…) : l'appelant décide.
    return ''
  }
}
