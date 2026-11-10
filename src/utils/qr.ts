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
    const { DecodeHintType } = await import('@zxing/library')
    const image = new Image()
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('QR illisible'))
      image.src = dataUri
    })
    const canvas = document.createElement('canvas')
    const padding = Math.max(32, Math.ceil(image.naturalWidth / 8))
    canvas.width = image.naturalWidth + padding * 2
    canvas.height = image.naturalHeight + padding * 2
    const context = canvas.getContext('2d')
    if (!context) return ''
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, padding, padding)
    // Image numérique produite par le backend : pas de perspective à détecter.
    // Le détecteur photographique peut confondre certains motifs du jeton avec
    // les repères du QR, même si l'image et ses marges sont parfaitement lisibles.
    const pureReader = new BrowserQRCodeReader(new Map([[DecodeHintType.PURE_BARCODE, true]]))
    try {
      return pureReader.decodeFromCanvas(canvas).getText()
    } catch {
      // Garder la détection classique pour un QR tourné ou une image recadrée.
      return new BrowserQRCodeReader().decodeFromCanvas(canvas).getText()
    }
  } catch {
    // QR non décodable (image non chargée, format inattendu…) : l'appelant décide.
    return ''
  }
}
