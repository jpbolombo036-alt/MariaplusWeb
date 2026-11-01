import { onMounted, ref } from 'vue'
import { getPublicInvitation, type PublicInvitation } from '../api/publicInvitation'

/** Load the invitation and translate endpoint availability into the public page state. */
export function usePublicInvitation(token: string) {
  const loading = ref(true)
  const unavailable = ref(false)
  const unavailableText = ref('')
  const inv = ref<PublicInvitation | null>(null)

  async function load() {
    loading.value = true
    try {
      inv.value = await getPublicInvitation(token)
      const st = inv.value?.status
      if (st === 'CANCELLED') {
        unavailable.value = true
        unavailableText.value = "Cette invitation a été annulée par l'organisateur."
      } else if (st === 'EXPIRED') {
        unavailable.value = true
        unavailableText.value = 'Cette invitation a expiré.'

      }
    } catch (e: any) {
      unavailable.value = true
      if (!e?.response) {
        unavailableText.value = 'Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.'
      } else if (e.response.status === 404) {
        unavailableText.value = "Cette invitation n'est plus accessible ou n'existe pas."
      } else if (e.response.status === 410) {
        unavailableText.value = 'Cette invitation a expiré.'
      } else {
        unavailableText.value = 'Une erreur est survenue. Merci de réessayer plus tard.'
      }
    } finally {
      loading.value = false
    }
  }


  onMounted(() => { void load() })
  return { loading, unavailable, unavailableText, inv }
}
