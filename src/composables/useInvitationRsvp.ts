import { computed, onMounted, ref, watch, type MaybeRefOrGetter, toValue } from 'vue'
import { getPublicInvitation, listPublicDrinks, submitPublicRsvp, type PublicInvitation } from '../api/publicInvitation'
import { useNotificationStore } from '../stores/notifications'
import { useInvitationPresentation } from '../components/public-invitation/presentation'

/** The response form is independent of cover, programme and printable-card rendering. */
export function useInvitationRsvp(
  token: string,
  source: MaybeRefOrGetter<PublicInvitation>,
  onUpdated: (invitation: PublicInvitation) => void,
) {
  const inv = ref(toValue(source))
  const notifications = useNotificationStore()
  const { maxAccepted, guestFullName } = useInvitationPresentation(inv)
  watch(() => toValue(source), (invitation) => { inv.value = invitation })
  function updateInvitation(invitation: PublicInvitation) {
    inv.value = invitation
    onUpdated(invitation)
  }
  const choice = ref<'ACCEPTED' | 'DECLINED' | ''>('')
  const success = ref<'ACCEPTED' | 'DECLINED' | ''>('')
  const attendees = ref(1)
  const note = ref('')
  const drinkChoices = ref<string[]>([])
  const drinks = ref<{ id: number; name: string; imageUrl?: string | null }[]>([])
  const drinksLoading = ref(false)
  const sending = ref(false)

  const initialStatus = inv.value.rsvpStatus
  success.value = initialStatus === 'ACCEPTED' || initialStatus === 'DECLINED' ? initialStatus : ''
  drinkChoices.value = inv.value.rsvpDrinkChoices?.length ? [...inv.value.rsvpDrinkChoices] : []
  note.value = inv.value.rsvpNote ?? ''

  const successText = computed(() =>
    success.value === 'ACCEPTED'
      ? 'Votre présence a bien été confirmée.'
      : 'Votre réponse a bien été enregistrée. Merci pour votre retour.',
  )

  function editAnswer() {
    success.value = ''
    choice.value = ''
    if (inv.value?.rsvpNumberOfAttendees) {
      attendees.value = Math.min(Math.max(inv.value.rsvpNumberOfAttendees, 1), maxAccepted.value)
    }
    note.value = ''
  }

  async function loadDrinks() {
    drinksLoading.value = true
    try {
      drinks.value = await listPublicDrinks(token)
    } catch {
      // non bloquant : la boisson reste facultative
    } finally {
      drinksLoading.value = false
    }
  }

  /* ---------- Sélection des boissons (3 max) ---------- */
  const MAX_DRINK_CHOICES = 3

  function toggleDrink(name: string) {
    const idx = drinkChoices.value.indexOf(name)
    if (idx >= 0) {
      drinkChoices.value.splice(idx, 1)
    } else if (drinkChoices.value.length >= MAX_DRINK_CHOICES) {
      notifications.push(`Vous pouvez choisir au maximum ${MAX_DRINK_CHOICES} boissons.`, 'error')
    } else {
      drinkChoices.value.push(name)
    }
  }

  async function submitAccepted() {
    if (attendees.value < 1 || attendees.value > maxAccepted.value) {
      notifications.push(`Le nombre doit être compris entre 1 et ${maxAccepted.value}.`, 'error')
      return
    }
    sending.value = true
    try {
      await submitPublicRsvp(token, 'ACCEPTED', attendees.value, drinkChoices.value, note.value)
      updateInvitation(await getPublicInvitation(token))
      success.value = 'ACCEPTED'
      notifications.push('Votre présence a bien été confirmée.', 'success')
      note.value = ''
    } catch (e: any) {
      const msg = String(e?.response?.data?.error || '')
      if (/limit|capacit|maximum|dépass|dépasse|places/i.test(msg)) {
        notifications.push('La limite de participants pour cette invitation est atteinte.', 'error')
      } else if (!e?.response) {
        notifications.push('Erreur réseau. Vérifiez votre connexion et réessayez.', 'error')
      } else {
        notifications.push('Erreur serveur. Merci de réessayer.', 'error')
      }
    } finally {
      sending.value = false
    }
  }

  async function submitDecline() {
    sending.value = true
    try {
      await submitPublicRsvp(token, 'DECLINED', 0, [], note.value)
      updateInvitation(await getPublicInvitation(token))
      success.value = 'DECLINED'
      note.value = ''
      notifications.push('Votre réponse a bien été enregistrée.', 'success')
    } catch (e: any) {
      notifications.push(e?.response ? 'Erreur serveur. Merci de réessayer.' : 'Erreur réseau. Vérifiez votre connexion et réessayez.', 'error')
    } finally {
      sending.value = false
    }
  }


  watch(maxAccepted, (max) => {
    if (attendees.value > max) attendees.value = max
  })
  onMounted(() => { void loadDrinks() })
  return {
    choice, success, attendees, note, drinkChoices, drinks, drinksLoading, sending,
    maxAccepted, guestFullName, successText, editAnswer, toggleDrink, submitAccepted, submitDecline,
  }
}
