import { nextTick, onBeforeUnmount, ref, watch, type Ref } from 'vue'
import QRCode from 'qrcode'
import { uploadCardImage, type PublicInvitation } from '../api/publicInvitation'
import { absoluteUrl, useInvitationPresentation } from '../components/public-invitation/presentation'

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
  const cardBgUrl = ref('')
  const cardDataUrl = ref('')
  const cardSaved = ref(false)
  const cardError = ref('')
  const finished = ref(false)
  let revision = 0
  let renderTimer: number | undefined
  // Serialize exports and uploads: an old upload must finish before a new card is saved.
  let generation = Promise.resolve()

  async function prepareBackground(url: string): Promise<string> {
    if (!url) return ''
    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Image indisponible'))
        img.src = absoluteUrl(url)
      })
      const canvas = document.createElement('canvas')
      canvas.width = 1200
      canvas.height = Math.max(1, Math.round(img.naturalHeight / img.naturalWidth * canvas.width))
      const context = canvas.getContext('2d')
      if (!context) return ''
      context.drawImage(img, 0, 0, canvas.width, canvas.height)
      return canvas.toDataURL('image/jpeg', .88)
    } catch { return '' }
  }

  async function generateCard(current: number) {
    if (current !== revision || !accepted.value || !inv.value?.publicToken) return
    const token = inv.value.publicToken
    try {
      const [qr, background] = await Promise.all([
        QRCode.toDataURL(token, { width:260, margin:4 }),
        prepareBackground(photos.value[0] || ''),
      ])
      if (current !== revision) return
      qrDataUri.value = qr
      cardBgUrl.value = background
      await nextTick()
      const element = renderElement()
      if (!element) throw new Error('Carte indisponible')
      await Promise.allSettled([
        document.fonts.load('400 63px "Eventia Script"'),
        document.fonts.load('400 43px "Playfair Display"'),
        document.fonts.load('700 28px "Inter"'),
        document.fonts.ready,
        ...Array.from(element.querySelectorAll('img')).map(img => img.decode()),
      ])
      if (current !== revision) return
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(element, {
        width:852, height:1280, scale:1.5, useCORS:true, backgroundColor:'#ffffff',
      })
      if (current !== revision) return
      cardDataUrl.value = canvas.toDataURL('image/png')
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'))
      if (blob && current === revision) {
        try {
          await uploadCardImage(token, blob)
          if (current === revision) cardSaved.value = true
        } catch { /* Download remains available if storage fails. */ }
      }
    } catch {
      if (current === revision) cardError.value = 'Impossible de générer la carte. Rechargez la page pour réessayer.'
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
    link.remove()
  }

  async function shareCardImage() {
    if (!cardDataUrl.value) return
    try {
      const blob = await (await fetch(cardDataUrl.value)).blob()
      const file = new File([blob], 'invitation-confirmee.png', { type:'image/png' })
      if (navigator.canShare?.({ files:[file] })) {
        await navigator.share({ files:[file], title:'Mon invitation', text:'Mon invitation confirmée' })
        return
      }
    } catch { /* Fall back to download. */ }
    downloadCardImage()
  }

  watch(() => JSON.stringify({
    accepted:accepted.value, token:inv.value?.publicToken, template:inv.value?.invitationCardTemplate,
    name:[inv.value?.guestFirstName,inv.value?.guestLastName], title:[inv.value?.weddingDisplayName,inv.value?.eventName],
    message:inv.value?.message, date:inv.value?.eventDate, time:inv.value?.eventStartTime,
    venue:inv.value?.eventVenue, table:inv.value?.tableName, count:inv.value?.rsvpNumberOfAttendees,
    dress:inv.value?.dressColors, photos:photos.value,
  }), () => {
    const current = ++revision
    window.clearTimeout(renderTimer)
    cardDataUrl.value = ''
    cardSaved.value = false
    cardError.value = ''
    finished.value = false
    if (accepted.value) renderTimer = window.setTimeout(() => {
      generation = generation.then(() => generateCard(current))
    }, 350)
  }, { immediate:true })

  onBeforeUnmount(() => { revision++; window.clearTimeout(renderTimer) })
  return { accepted, qrDataUri, cardBgUrl, cardDataUrl, cardSaved, cardError, finished, downloadCardImage, shareCardImage }
}
