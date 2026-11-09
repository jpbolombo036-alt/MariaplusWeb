import { nextTick, onBeforeUnmount, ref, watch, type Ref } from 'vue'
import QRCode from 'qrcode'
import { uploadCardImage, type PublicInvitation } from '../api/publicInvitation'
import { absoluteUrl, useInvitationPresentation } from '../components/public-invitation/presentation'

/** Small controller consumed by the response panel; printable layout stays in its own component. */
export interface InvitationCardController {
  accepted: boolean
  cardDataUrl: string
  cardSaved: boolean
  cardError: string
  finished: boolean
  downloadCardImage(): void
  shareCardImage(): Promise<void>
}

export function useInvitationCard(inv: Ref<PublicInvitation | null>, renderElement: () => HTMLElement | null) {
  const { photos } = useInvitationPresentation(inv)
  const accepted = ref(false)
  const qrDataUri = ref('')
  const cardDataUrl = ref('')
  const cardSaved = ref(false)
  const cardError = ref('')
  const finished = ref(false)

  async function genQr(): Promise<string> {
    if (!inv.value?.publicToken) return ''
    return QRCode.toDataURL(inv.value.publicToken, { width: 260, margin: 1 })
  }

  const cardBgUrl = ref('')

  /* Photo (couple/mariés) du visuel du bandeau : pré-chargée avec CORS puis
     convertie en data URL JPEG 1200px — html2canvas ne sait pas dessiner les
     images cross-origin ni object-fit:cover sur <img> ; le fond du bandeau
     utilise donc background-image + background-size: cover avec cette version
     haute résolution (nette, contrairement à l'ancien fond flouté). */
  async function prepareCardBackground(): Promise<void> {
    if (cardBgUrl.value || !photos.value.length) return
    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('load'))
        img.src = absoluteUrl(photos.value[0])
      })
      const w = 1200
      const h = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * w))
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      const ctx = c.getContext('2d')
      if (!ctx) return
      ctx.drawImage(img, 0, 0, w, h)
      cardBgUrl.value = c.toDataURL('image/jpeg', 0.85)
    } catch {
      /* image non chargeable (CORS/absente) : le bandeau garde son dégradé */
    }
  }

  async function generateCard(): Promise<void> {
    cardError.value = ''
    const element = renderElement()
    if (!element) return
    try {
      qrDataUri.value = await genQr()
      await prepareCardBackground()
      await nextTick()
      // Polices du modèle chargées avant le rendu (sinon html2canvas dessine
      // les textes avec les polices de repli)
      try {
        await Promise.allSettled([
          document.fonts.load('700 47px "Playfair Display"'),
          document.fonts.load('400 42px "Great Vibes"'),
          document.fonts.ready,
        ])
      } catch {
        /* polices indisponibles : repli silencieux sur les polices système */
      }
      // Le moteur de rendu n'est téléchargé que pour une carte confirmée.
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(element, {
        width: 852,
        height: 1280,
        scale: 1.5,
        useCORS: true,
        backgroundColor: '#ffffff',
      })
      cardDataUrl.value = canvas.toDataURL('image/png')
      // Sauvegarde serveur (best effort) : l'agent d'accueil retrouvera la carte
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
      if (blob && inv.value?.publicToken) {
        try {
          await uploadCardImage(inv.value.publicToken, blob)
          cardSaved.value = true
        } catch {
          // non bloquant : l'invité garde sa carte en téléchargement
        }
      }
    } catch {
      cardError.value = "Impossible de générer l'image. Votre QR code reste téléchargeable ci-dessous."
    }
  }

  function downloadCardImage() {
    if (!cardDataUrl.value) return
    const link = document.createElement('a')
    link.href = cardDataUrl.value
    const slug = (inv.value?.guestFirstName ?? 'invite').toLowerCase().replace(/[^a-z0-9]+/g, '-')
    link.download = `invitation-confirmee-${slug}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  async function shareCardImage() {
    if (!cardDataUrl.value) return
    try {
      const blob = await (await fetch(cardDataUrl.value)).blob()
      const file = new File([blob], 'invitation-confirmee.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Mon invitation', text: 'Mon invitation confirmée' })
        return
      }
    } catch {
      // repli : téléchargement simple
    }
    downloadCardImage()
  }


  let renderTimer: number | undefined
  watch(accepted, (confirmed) => {
    if (confirmed) {
      void nextTick().then(() => {
        renderTimer = window.setTimeout(() => { void generateCard() }, 350)
      })
    }
  })
  onBeforeUnmount(() => { window.clearTimeout(renderTimer) })
  return {
    accepted, qrDataUri, cardBgUrl, cardDataUrl, cardSaved, cardError, finished,
    downloadCardImage, shareCardImage,
  }
}
