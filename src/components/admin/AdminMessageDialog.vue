<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[60] bg-slate-900/40 grid place-items-center p-4" @click.self="close">
      <form
        class="w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-lg"
        role="dialog"
        aria-modal="true"
        :aria-label="heading"
        @submit.prevent="submit"
      >
        <div class="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h2 class="text-[16px] font-bold text-slate-900">{{ heading }}</h2>
            <p class="text-[12px] text-slate-500 mt-0.5 break-words">
              <template v-if="organization">Ses organisateurs le verront dans leur cloche de notifications.</template>
              <template v-else>Tous les organisateurs actifs de la plateforme le verront dans leur cloche.</template>
            </p>
          </div>
          <button type="button" class="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50" aria-label="Fermer" @click="close">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div class="px-5 py-4 space-y-3">
          <div>
            <label for="admin-message-title" class="block text-[12px] font-semibold text-slate-700 mb-1">Titre</label>
            <input
              id="admin-message-title"
              ref="titleField"
              v-model="title"
              maxlength="200"
              required
              :disabled="sending"
              class="w-full h-10 rounded-lg border border-slate-200 px-3 text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
          </div>
          <div>
            <label for="admin-message-body" class="block text-[12px] font-semibold text-slate-700 mb-1">Message</label>
            <textarea
              id="admin-message-body"
              v-model="message"
              rows="6"
              maxlength="2000"
              required
              :disabled="sending"
              class="w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            ></textarea>
            <p class="text-[11px] text-slate-400 text-right">{{ message.length }} / 2000</p>
          </div>
          <p
            v-if="!organization && confirming"
            class="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-[12px] font-semibold text-amber-800"
            role="alert"
          >Ce message partira chez tous les organisateurs. Cliquez à nouveau pour confirmer.</p>
          <p v-if="error" class="text-[12px] text-error" role="alert">{{ error }}</p>
        </div>

        <div class="px-5 py-4 border-t border-slate-100 flex justify-end gap-2">
          <button type="button" class="h-10 px-4 rounded-lg text-[13px] font-semibold text-slate-600 hover:bg-slate-50" :disabled="sending" @click="close">Annuler</button>
          <button
            type="submit"
            class="h-10 px-4 rounded-lg bg-primary text-white text-[13px] font-semibold inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="sending || !title.trim() || !message.trim()"
          >
            <span class="material-symbols-outlined text-[18px]" aria-hidden="true">send</span>
            {{ submitLabel }}
          </button>
        </div>
      </form>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { sendAdminMessage } from '../../api/adminNotifications'
import { apiErrorMessage } from '../../api/http'

/** `organization` null = message to every organizer. */
const props = defineProps<{ organization: { id: number; name: string } | null }>()
const emit = defineEmits<{ close: []; sent: [recipients: number] }>()

const title = ref('')
const message = ref('')
const sending = ref(false)
const confirming = ref(false)
const error = ref('')
const titleField = ref<HTMLInputElement | null>(null)

const heading = computed(() => props.organization ? `Écrire à ${props.organization.name}` : 'Message à tous les organisateurs')
const submitLabel = computed(() => {
  if (sending.value) return 'Envoi…'
  if (!props.organization) return confirming.value ? 'Confirmer l\'envoi à tous' : 'Envoyer à tous'
  return 'Envoyer'
})

// Any edit after the warning requires a fresh confirmation.
watch([title, message], () => { confirming.value = false })

function close() {
  if (!sending.value) emit('close')
}

async function submit() {
  if (sending.value || !title.value.trim() || !message.value.trim()) return
  if (!props.organization && !confirming.value) {
    confirming.value = true
    return
  }
  sending.value = true
  error.value = ''
  try {
    const recipients = await sendAdminMessage({
      audience: props.organization ? 'ORGANIZATION' : 'ALL_ORGANIZERS',
      organizationId: props.organization?.id ?? null,
      title: title.value.trim(),
      message: message.value.trim(),
    })
    emit('sent', recipients)
  } catch (e) {
    error.value = apiErrorMessage(e)
    confirming.value = false
  } finally {
    sending.value = false
  }
}

function onKey(e: KeyboardEvent) { if (e.key === 'Escape') close() }
onMounted(() => {
  document.addEventListener('keydown', onKey)
  void nextTick(() => titleField.value?.focus())
})
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
</script>
