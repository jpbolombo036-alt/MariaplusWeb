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
    // Le backend génère des QR avec une marge d'un seul module. Ajouter une
    // zone blanche évite de dépendre de la détection d'un bord trop serré.
    const { BrowserQRCodeReader } = await import('@zxing/browser')
    const image = new Image()
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('QR illisible'))
      image.src = dataUri
    })
    const reader = new BrowserQRCodeReader()
    const canvas = document.createElement('canvas')
    const padding = Math.max(32, Math.ceil(image.naturalWidth / 8))
    canvas.width = image.naturalWidth + padding * 2
    canvas.height = image.naturalHeight + padding * 2
    const context = canvas.getContext('2d')
    if (!context) return ''
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, padding, padding)
    return reader.decodeFromCanvas(canvas).getText()
  } catch {
    // QR non décodable (image non chargée, format inattendu…) : l'appelant décide.
    return ''
  }
}
