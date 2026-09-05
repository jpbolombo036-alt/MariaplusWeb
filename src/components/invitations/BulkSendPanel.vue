<template>
  <!-- Modale : envoi en masse des invitations (WhatsApp) -->
  <div v-if="open" class="fixed inset-0 bg-black/40 z-50 grid place-items-center px-4" @click.self="requestClose">
    <div class="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-lg">
      <h3 class="text-lg font-bold text-on-surface mb-1">Envoyer en masse (WhatsApp)</h3>
      <p class="text-sm text-on-surface-variant mb-4">Chaque invité reçoit son invitation avec son lien unique de confirmation.</p>

      <!-- Étape 1 : configuration -->
      <template v-if="step === 'config'">
        <div class="space-y-2 mb-4">
          <label class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors"
                 :class="target === 'all' ? 'border-primary bg-primary/5' : 'border-outline-variant hover:bg-surface-container/40'">
            <input v-model="target" type="radio" value="all" class="accent-primary" />
            <span class="text-sm font-medium text-on-surface">Toutes les invitations</span>
            <span class="text-xs text-on-surface-variant">(premiers envois)</span>
          </label>
          <label class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors flex-wrap"
                 :class="target === 'category' ? 'border-primary bg-primary/5' : 'border-outline-variant hover:bg-surface-container/40'">
            <input v-model="target" type="radio" value="category" class="accent-primary" />
            <span class="text-sm font-medium text-on-surface">Une catégorie</span>
            <select v-model="categoryId" :disabled="target !== 'category'"
                    class="ml-auto h-9 px-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm text-on-surface disabled:opacity-50">
              <option :value="null" disabled>Choisir…</option>
              <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </label>
          <label class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors"
                 :class="target === 'pending' ? 'border-primary bg-primary/5' : 'border-outline-variant hover:bg-surface-container/40'">
            <input v-model="target" type="radio" value="pending" class="accent-primary" />
            <span class="text-sm font-medium text-on-surface">Relancer les non-répondants</span>
          </label>
        </div>
        <p class="text-xs text-on-surface-variant mb-4 flex items-start gap-1.5">
          <span class="material-symbols-outlined text-[16px] mt-0.5">info</span>
          <span>WhatsApp limite l'envoi à 250 destinataires / 24 h tant que l'entreprise n'est pas vérifiée. Les invités sans numéro valide seront listés comme « ignorés ».</span>
        </p>
        <div class="flex justify-end gap-2">
          <button class="px-4 py-2 rounded-lg border border-outline-variant text-sm text-on-surface" @click="requestClose">Annuler</button>
          <button :disabled="starting || (target === 'category' && !categoryId)"
                  class="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold inline-flex items-center gap-2 shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all disabled:opacity-50 disabled:shadow-none"
                  @click="launch">
            <span class="material-symbols-outlined text-[18px]">send</span>
            {{ starting ? 'Démarrage…' : 'Envoyer' }}
          </button>
        </div>
      </template>

      <!-- Étape 2 : progression -->
      <template v-else-if="batch">
        <div class="mb-4">
          <div class="flex justify-between text-sm mb-1.5">
            <span class="text-on-surface-variant">{{ finished ? 'Terminé' : 'Envoi en cours…' }}</span>
            <span class="font-semibold text-on-surface">{{ processed }} / {{ batch.totalCount }}</span>
          </div>
          <div class="h-2.5 rounded-full bg-surface-container overflow-hidden">
            <div class="h-full rounded-full transition-all duration-500"
                 :class="batch.failedCount > 0 ? 'bg-amber-500' : 'bg-primary'"
                 :style="{ width: progressPct + '%' }"></div>
          </div>
          <div class="grid grid-cols-3 gap-2 mt-4 text-center">
            <div class="p-3 rounded-xl bg-surface-container/60">
              <p class="text-lg font-bold text-primary">{{ batch.sentCount }}</p>
              <p class="text-xs text-on-surface-variant">Envoyées</p>
            </div>
            <div class="p-3 rounded-xl bg-surface-container/60">
              <p class="text-lg font-bold text-error">{{ batch.failedCount }}</p>
              <p class="text-xs text-on-surface-variant">Échecs</p>
            </div>
            <div class="p-3 rounded-xl bg-surface-container/60">
              <p class="text-lg font-bold text-on-surface-variant">{{ batch.skippedCount }}</p>
              <p class="text-xs text-on-surface-variant">Ignorés</p>
            </div>
          </div>
        </div>

        <div v-if="logs.length" class="max-h-44 overflow-y-auto rounded-xl border border-outline-variant/60 divide-y divide-outline-variant/60 mb-4">
          <div v-for="l in logs" :key="l.id" class="px-3 py-2 text-xs flex items-start gap-2">
            <span class="material-symbols-outlined text-[16px] shrink-0 mt-0.5"
                  :class="l.status === 'SENT' ? 'text-primary' : l.status === 'FAILED' ? 'text-error' : 'text-on-surface-variant'">
              {{ l.status === 'SENT' ? 'check_circle' : l.status === 'FAILED' ? 'cancel' : 'skip_next' }}
            </span>
            <div class="min-w-0">
              <p class="font-medium text-on-surface">{{ guestNameFor(l) }}</p>
              <p v-if="l.errorMessage" class="text-error truncate" :title="l.errorMessage">{{ l.errorMessage }}</p>
            </div>
          </div>
        </div>

        <div class="flex justify-end">
          <button v-if="finished" class="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold" @click="finish">Terminer</button>
          <button v-else class="px-4 py-2 rounded-lg border border-outline-variant text-sm text-on-surface" @click="requestClose">Fermer</button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { startBulkSend, getBulkBatch, getBulkBatchLogs, type BulkSendBatch, type NotificationLog } from '../../api/invitations'
import { listCategories, type GuestCategory, type Guest } from '../../api/guests'
import { useNotificationStore } from '../../stores/notifications'

const props = defineProps<{
  eventId: number
  open: boolean
  guests: Guest[]
}>()

const emit = defineEmits<{
  close: []
  completed: []
}>()

const notifications = useNotificationStore()

const step = ref<'config' | 'progress'>('config')
const target = ref<'all' | 'category' | 'pending'>('all')
const categoryId = ref<number | null>(null)
const categories = ref<GuestCategory[]>([])
const starting = ref(false)

const batch = ref<BulkSendBatch | null>(null)
const logs = ref<NotificationLog[]>([])
let timer: ReturnType<typeof setInterval> | null = null

const finished = computed(() => batch.value?.status === 'COMPLETED' || batch.value?.status === 'FAILED')
const processed = computed(() => (batch.value?.sentCount ?? 0) + (batch.value?.failedCount ?? 0) + (batch.value?.skippedCount ?? 0))
const progressPct = computed(() => {
  const total = batch.value?.totalCount ?? 0
  return total === 0 ? 0 : Math.min(100, Math.round((processed.value / total) * 100))
})

watch(() => props.open, async (open) => {
  if (!open) return
  step.value = 'config'
  target.value = 'all'
  categoryId.value = null
  batch.value = null
  logs.value = []
  stopPolling()
  try {
    categories.value = await listCategories(props.eventId)
  } catch { /* catégories optionnelles */ }
})

onBeforeUnmount(stopPolling)

function stopPolling() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function requestClose() {
  if (step.value === 'progress' && !finished.value) {
    notifications.push("L'envoi se poursuit en arrière-plan.", 'success')
  }
  emit('close')
}

async function launch() {
  starting.value = true
  try {
    const opts = target.value === 'category'
      ? { categoryId: categoryId.value }
      : target.value === 'pending'
        ? { onlyPendingRsvp: true }
        : {}
    batch.value = await startBulkSend(props.eventId, opts)
    logs.value = []
    step.value = 'progress'
    timer = setInterval(poll, 2000)
    await poll()
  } catch {
    // le message d'erreur est déjà notifié par l'intercepteur HTTP
  } finally {
    starting.value = false
  }
}

async function poll() {
  if (!batch.value) return
  try {
    batch.value = await getBulkBatch(props.eventId, batch.value.id)
    if (processed.value > 0 || finished.value) {
      logs.value = await getBulkBatchLogs(props.eventId, batch.value.id)
    }
    if (finished.value) {
      stopPolling()
      emit('completed')
    }
  } catch { /* nouvelle tentative au prochain tick */ }
}

function guestNameFor(l: NotificationLog): string {
  const g = props.guests.find((x) => x.id === l.guestId)
  return g ? `${g.firstName} ${g.lastName}` : `#${l.guestId ?? '?'}`
}

function finish() {
  stopPolling()
  emit('close')
}
</script>