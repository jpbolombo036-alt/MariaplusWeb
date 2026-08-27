<template>
  <div class="min-h-full grid place-items-center bg-background px-4 py-10">
    <div class="w-full max-w-lg bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant shadow-sm">
      <img v-if="inv?.couplePhotoUrl" :src="inv.couplePhotoUrl" class="w-full h-56 object-cover" />
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

          <div class="mt-5 flex flex-wrap gap-2">
            <button class="px-5 py-2.5 rounded-lg bg-primary text-on-primary font-semibold" @click="accept">J'accepte</button>
            <button class="px-5 py-2.5 rounded-lg bg-outline-variant text-on-surface font-semibold" @click="decline">Je décline</button>
          </div>
        </template>

        <p v-if="message" class="mt-4 text-sm" :class="isError ? 'text-error' : 'text-secondary'">{{ message }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getPublicInvitation, submitPublicRsvp, type PublicInvitation } from '../api/publicInvitation'

const route = useRoute()
const token = String(route.params.token)
const inv = ref<PublicInvitation | null>(null)
const message = ref('')
const isError = ref(false)

onMounted(async () => {
  try {
    inv.value = await getPublicInvitation(token)
  } catch {
    isError.value = true
    message.value = 'Invitation introuvable'
  }
})

async function accept() {
  try {
    await submitPublicRsvp(token, 'ACCEPTED', 1)
    inv.value = await getPublicInvitation(token)
    message.value = 'Merci ! Votre réponse est enregistrée.'
    isError.value = false
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
  } catch (e: any) {
    isError.value = true
    message.value = e?.response?.data?.error || 'Erreur'
  }
}
</script>
