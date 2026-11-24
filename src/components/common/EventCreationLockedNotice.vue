<template>
  <div
    v-if="locked"
    role="status"
    data-testid="event-creation-locked"
    class="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-5 mb-6 flex items-start gap-3 shadow-sm"
  >
    <span class="material-symbols-outlined text-amber-600 text-[22px] shrink-0" aria-hidden="true">hourglass_top</span>
    <div class="min-w-0 flex-1">
      <p class="text-[14px] font-bold text-amber-800">Création d'événements pas encore activée</p>
      <p class="text-[13px] text-amber-700 mt-1 break-words">
        Votre compte est bien créé. Un administrateur de la plateforme doit activer la création
        d'événements pour votre organisation. Ce message disparaîtra dès l'activation, et vous
        pourrez alors créer votre premier événement depuis « Mes Événements ».
      </p>

      <p v-if="sent" class="mt-3 text-[13px] font-semibold text-amber-800 flex items-center gap-1.5" data-testid="contact-sent">
        <span class="material-symbols-outlined text-[18px]" aria-hidden="true">check_circle</span>
        Message envoyé. L'équipe de la plateforme vous répondra à {{ auth.user?.email }}.
      </p>

      <button
        v-else-if="!formOpen"
        type="button"
        class="mt-3 h-9 px-4 rounded-lg bg-white border border-amber-300 text-[13px] font-semibold text-amber-800 inline-flex items-center gap-2 hover:bg-amber-100 transition-colors"
        @click="formOpen = true"
      >
        <span class="material-symbols-outlined text-[18px]" aria-hidden="true">mail</span>
        Nous écrire
      </button>

      <form v-else class="mt-3" @submit.prevent="send">
        <label for="contact-message" class="block text-[12px] font-semibold text-amber-800 mb-1">Votre message à l'équipe</label>
        <textarea
          id="contact-message"
          ref="textarea"
          v-model="message"
          rows="4"
          maxlength="2000"
          required
          :disabled="sending"
          placeholder="Présentez votre activité ou posez votre question…"
          class="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-[13px] text-slate-800 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
        ></textarea>
        <div class="flex flex-wrap items-center justify-between gap-2 mt-2">
          <span class="text-[11px] text-amber-700">{{ message.length }} / 2000</span>
          <div class="flex gap-2">
            <button type="button" class="h-9 px-3 rounded-lg text-[13px] font-semibold text-amber-800 hover:bg-amber-100" :disabled="sending" @click="cancel">Annuler</button>
            <button
              type="submit"
              class="h-9 px-4 rounded-lg bg-primary text-white text-[13px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="sending || !message.trim()"
            >{{ sending ? 'Envoi…' : 'Envoyer' }}</button>
          </div>
        </div>
        <p v-if="error" class="mt-2 text-[12px] text-error" role="alert">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useEventCreationLock } from '../../composables/useEventCreationLock'
import { sendContactMessage } from '../../api/adminNotifications'
import { apiErrorMessage } from '../../api/http'
import { useAuthStore } from '../../stores/auth'

const { locked } = useEventCreationLock({ refresh: true })
const auth = useAuthStore()
const formOpen = ref(false)
const message = ref('')
const sending = ref(false)
const sent = ref(false)
const error = ref('')
const textarea = ref<HTMLTextAreaElement | null>(null)

watch(formOpen, (isOpen) => { if (isOpen) void nextTick(() => textarea.value?.focus()) })

function cancel() {
  formOpen.value = false
  error.value = ''
}

async function send() {
  const text = message.value.trim()
  if (!text || sending.value) return
  sending.value = true
  error.value = ''
  try {
    await sendContactMessage(text)
    sent.value = true
    formOpen.value = false
    message.value = ''
  } catch (e) {
    error.value = apiErrorMessage(e)
  } finally {
    sending.value = false
  }
}
</script>
