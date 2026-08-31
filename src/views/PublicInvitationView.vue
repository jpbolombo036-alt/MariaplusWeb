<template>
  <div class="min-h-full grid place-items-center bg-background px-4 py-10">
    <div class="w-full max-w-lg bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant shadow-sm">
      <img v-if="inv?.couplePhotoUrl" :src="absolutePhotoUrl(inv.couplePhotoUrl)" class="w-full h-56 object-cover" />
      <div class="p-6">
        <div class="text-sm text-on-surface-variant">Bonjour {{ inv?.guestFirstName }},</div>
        <h1 class="mt-1 text-2xl font-bold text-on-surface">{{ inv?.weddingDisplayName }}</h1>

        <div v-if="inv?.eventDate" class="mt-4 text-on-surface-variant text-sm">
          <div v-if="inv?.eventName">{{ inv.eventName }}</div>
          <div>{{ inv.eventDate }}<template v-if="inv?.eventStartTime"> à {{ inv.eventStartTime }}</template></div>
          <div v-if="inv?.eventVenue">{{ inv.eventVenue }}</div>
        </div>

        <p v-if="inv?.message" class="mt-4 italic text-on-surface-variant">{{ inv.message }}</p>

        <template v-if="inv">
          <div v-if="inv.rsvpStatus" class="mt-5 p-3 rounded-lg bg-surface-container text-on-surface">
            Réponse actuelle : <strong>{{ inv.rsvpStatus }}</strong> ({{ inv.rsvpNumberOfAttendees ?? 0 }} pers.)
          </div>

          <div v-if="!inv.rsvpStatus" class="mt-5">
            <div class="flex items-center gap-3 mb-3">
              <label class="text-sm text-on-surface-variant">Nombre de personnes :</label>
              <input type="number" v-model.number="attendees" min="1" :max="inv.maxAccepted ?? 1" class="w-20 px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm text-on-surface" />
            </div>
            <div class="flex items-center gap-3 mb-4">
              <label class="text-sm text-on-surface-variant">Boisson préférée :</label>
              <select v-model="drinkChoice" :disabled="drinksLoading" class="px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm text-on-surface">
                <option value="">-- Choisir --</option>
                <option v-for="d in drinks" :key="d.id" :value="d.name">{{ d.name }}</option>
              </select>
            </div>
            <div class="flex flex-wrap gap-2">
              <button class="px-5 py-2.5 rounded-lg bg-primary text-on-primary font-semibold" @click="accept">J'accepte</button>
              <button class="px-5 py-2.5 rounded-lg bg-outline-variant text-on-surface font-semibold" @click="decline">Je décline</button>
            </div>
          </div>
        </template>

        <div v-if="inv?.rsvpStatus === 'ACCEPTED' && qrDataUri" class="mt-6 text-center">
          <p class="text-sm font-semibold text-on-surface mb-2">Présentez ce QR code à l'accueil</p>
          <img :src="qrDataUri" class="w-56 h-56 mx-auto" alt="QR code" />
          <p class="mt-2 text-xs text-on-surface-variant">N° d'invitation : {{ inv?.publicToken }}</p>
          <p v-if="inv?.rsvpDrinkChoice" class="mt-2 text-xs text-on-surface-variant">Boisson choisie : {{ inv?.rsvpDrinkChoice }}</p>
          <button class="mt-3 px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold" @click="downloadQr">Télécharger le QR</button>
        </div>

        <p v-if="message" class="mt-4 text-sm" :class="isError ? 'text-error' : 'text-secondary'">{{ message }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getPublicInvitation, listPublicDrinks, submitPublicRsvp, type PublicInvitation } from '../api/publicInvitation'
import { absolutePhotoUrl } from '../api/events'
import QRCode from 'qrcode'

const route = useRoute()
const token = String(route.params.token)
const inv = ref<PublicInvitation | null>(null)
const message = ref('')
const isError = ref(false)
const qrDataUri = ref('')
const attendees = ref(1)
const drinkChoice = ref('')
const drinks = ref<{ id: number; name: string }[]>([])
const drinksLoading = ref(false)

onMounted(async () => {
  try {
    inv.value = await getPublicInvitation(token)
    if (inv.value?.rsvpStatus === 'ACCEPTED' && inv.value?.publicToken) {
      qrDataUri.value = await QRCode.toDataURL(inv.value.publicToken, { width: 320, margin: 1 })
      drinkChoice.value = inv.value.rsvpDrinkChoice || ''
    }
  } catch {
    isError.value = true
    message.value = 'Invitation introuvable'
  }
  await loadDrinks()
})

async function loadDrinks() {
  drinksLoading.value = true
  try {
    drinks.value = await listPublicDrinks(token)
  } catch {
    // non bloquant
  } finally {
    drinksLoading.value = false
  }
}

async function accept() {
  try {
    await submitPublicRsvp(token, 'ACCEPTED', attendees.value, drinkChoice.value || undefined)
    inv.value = await getPublicInvitation(token)
    message.value = 'Merci ! Votre réponse est enregistrée.'
    isError.value = false
    if (inv.value?.publicToken) {
      qrDataUri.value = await QRCode.toDataURL(inv.value.publicToken, { width: 320, margin: 1 })
    }
  } catch (e: any) {
    isError.value = true
    message.value = e?.response?.data?.error || 'Erreur'
  }
}
async function decline() {
  try {
    await submitPublicRsvp(token, 'DECLINED', 0)
    inv.value = await getPublicInvitation(token)
    message.value = 'Votre réponse est enregistrée.'
    isError.value = false
    qrDataUri.value = ''
  } catch (e: any) {
    isError.value = true
    message.value = e?.response?.data?.error || 'Erreur'
  }
}
function downloadQr() {
  if (!qrDataUri.value) return
  const link = document.createElement('a')
  link.href = qrDataUri.value
  link.download = `qr-invitation-${token}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>
