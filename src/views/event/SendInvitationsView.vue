<template>
  <!-- Écran « Envoyer les invitations » (WhatsApp) : sélection invité par invité -->
  <div class="max-w-2xl mx-auto">
    <!-- En-tête collant -->
    <div class="sticky top-0 z-20 -mx-4 px-4 py-3 flex items-center gap-3 bg-surface-container-lowest/95 backdrop-blur border-b border-outline-variant/40">
      <button class="w-9 h-9 grid place-items-center rounded-full hover:bg-surface-container-high text-on-surface transition-colors" @click="goBack">
        <span class="material-symbols-outlined">arrow_back</span>
      </button>
      <h1 class="text-[17px] font-bold text-on-surface tracking-tight">Envoyer les invitations</h1>
      <span v-if="step === 'select'" class="ml-auto text-xs font-semibold text-on-surface-variant">{{ selection.size }} sélectionné(s)</span>
    </div>

    <!-- Interrupteur plateforme : envoi WhatsApp coupé par le super-admin -->
    <div v-if="!waEnabled" class="mt-4 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800">
      <span class="material-symbols-outlined text-[20px] shrink-0">warning</span>
      <p class="text-[13px] font-medium">Les envois WhatsApp sont actuellement désactivés par l'administrateur de la plateforme. Le bouton d'envoi est neutralisé.</p>
    </div>

    <!-- ————— Étape sélection ————— -->
    <template v-if="step === 'select'">
      <!-- Recherche -->
      <div class="relative mt-4">
        <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant">
          <span class="material-symbols-outlined text-[20px]">search</span>
        </span>
        <input v-model="query" placeholder="Rechercher un invité…"
               class="h-11 w-full pl-10 pr-4 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all" />
      </div>

      <!-- Filtres -->
      <div class="flex gap-2 mt-3 overflow-x-auto pb-1">
        <button v-for="f in FILTERS" :key="f.key" @click="filter = f.key"
                class="h-8 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all"
                :class="filter === f.key ? 'bg-primary text-on-primary border-primary shadow-md shadow-primary/20' : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:bg-surface-container'">
          {{ f.label }} ({{ filterCount(f.key) }})
        </button>
      </div>

      <p v-if="loading" class="mt-6 text-sm text-on-surface-variant">Chargement des invités…</p>

      <!-- Liste des invités -->
      <div v-else class="mt-4 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest overflow-hidden divide-y divide-outline-variant/40">
        <!-- Ligne maître -->
        <label class="flex items-center gap-3 px-4 py-3.5 bg-surface-container cursor-pointer select-none">
          <input type="checkbox" class="w-5 h-5 rounded accent-primary shrink-0"
                 :checked="allVisibleSelected" @change="toggleAllVisible" />
          <span class="text-sm font-bold text-on-surface">Tous les invités ({{ rows.length }})</span>
        </label>

        <div v-for="row in visibleRows" :key="row.guest.id">
          <label class="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
                 :class="row.eligible ? 'hover:bg-surface-container/60' : 'opacity-50 cursor-not-allowed'"
                 :title="row.reason || ''">
            <input type="checkbox" class="w-5 h-5 rounded accent-primary shrink-0" :disabled="!row.eligible"
                   :checked="selection.has(row.guest.id)" @change="toggleGuest(row.guest.id)" />
            <span class="w-10 h-10 rounded-full grid place-items-center text-white text-sm font-bold shrink-0"
                  :style="{ backgroundColor: avatarColor(row.guest.id) }">
              {{ initialsFor(row.guest) }}
            </span>
            <span class="min-w-0 flex-1">
              <span class="block text-sm font-semibold text-on-surface truncate">{{ row.guest.firstName }} {{ row.guest.lastName }}</span>
              <span class="block text-xs text-on-surface-variant truncate">{{ formatPhone(row.guest.phone) }}</span>
            </span>
            <span class="text-[11px] font-semibold px-2 py-1 rounded-full shrink-0" :class="statusChipClass(row)">
              {{ statusLabel(row) }}
            </span>
          </label>
        </div>

        <div v-if="visibleRows.length === 0" class="px-4 py-10 text-center">
          <span class="material-symbols-outlined text-3xl text-on-surface-variant">person_search</span>
          <p class="text-sm text-on-surface-variant mt-2">Aucun invité pour ce filtre.</p>
        </div>
      </div>

      <!-- Aperçu de l'invitation -->
      <div class="mt-5 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest overflow-hidden">
        <div class="h-28 bg-surface-container grid place-items-center overflow-hidden">
          <img v-if="eventImage" :src="eventImage" alt="" class="w-full h-full object-cover" />
          <span v-else class="material-symbols-outlined text-4xl text-on-surface-variant">image</span>
        </div>
        <div class="p-4">
          <p class="text-[11px] font-black tracking-widest text-primary uppercase">Invitation</p>
          <h3 class="text-base font-bold text-on-surface mt-0.5">{{ event?.name || '…' }}</h3>
          <ul class="mt-2 space-y-1.5 text-xs text-on-surface-variant">
            <li v-if="dateLabel" class="flex items-center gap-2"><span class="material-symbols-outlined text-[16px]">calendar_month</span>{{ dateLabel }}</li>
            <li v-if="event?.venueName" class="flex items-center gap-2"><span class="material-symbols-outlined text-[16px]">location_on</span>{{ event.venueName }}<template v-if="event?.city"> — {{ event.city }}</template></li>
            <li v-if="timeLabel" class="flex items-center gap-2"><span class="material-symbols-outlined text-[16px]">schedule</span>{{ timeLabel }}</li>
          </ul>
        </div>
      </div>

      <p class="mt-4 mb-4 text-xs text-on-surface-variant flex items-start gap-1.5">
        <span class="material-symbols-outlined text-[16px] mt-0.5">info</span>
        <span>WhatsApp limite l'envoi à 250 destinataires / 24 h tant que l'entreprise n'est pas vérifiée. Les invités sans numéro valide seront ignorés.</span>
      </p>
    </template>

    <!-- ————— Étape progression ————— -->
    <template v-else>
      <div class="mt-6 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5">
        <div class="flex items-center justify-between text-sm mb-2">
          <span class="font-semibold text-on-surface">{{ finishedSending ? 'Envoi terminé' : 'Envoi en cours…' }}</span>
          <span class="text-on-surface-variant">{{ progressPct }}%</span>
        </div>
        <div class="h-2.5 rounded-full bg-surface-container-high overflow-hidden">
          <div class="h-full rounded-full bg-primary transition-all duration-500" :style="{ width: progressPct + '%' }"></div>
        </div>
        <div class="grid grid-cols-4 gap-2 mt-4 text-center">
          <div class="rounded-xl bg-surface-container p-3">
            <p class="text-lg font-bold text-on-surface">{{ agg.sent }}</p>
            <p class="text-[11px] text-on-surface-variant font-semibold">Envoyées</p>
          </div>
          <div class="rounded-xl bg-surface-container p-3">
            <p class="text-lg font-bold text-emerald-600">{{ deliveredCount }}</p>
            <p class="text-[11px] text-on-surface-variant font-semibold">Délivrées</p>
          </div>
          <div class="rounded-xl bg-surface-container p-3">
            <p class="text-lg font-bold text-error">{{ agg.failed }}</p>
            <p class="text-[11px] text-on-surface-variant font-semibold">Échecs</p>
          </div>
          <div class="rounded-xl bg-surface-container p-3">
            <p class="text-lg font-bold text-on-surface-variant">{{ agg.skipped }}</p>
            <p class="text-[11px] text-on-surface-variant font-semibold">Ignorés</p>
          </div>
        </div>
        <ul v-if="failedLogs.length" class="mt-4 space-y-1.5 max-h-40 overflow-y-auto">
          <li v-for="l in failedLogs" :key="l.id" class="text-xs text-on-surface-variant flex gap-2">
            <span class="material-symbols-outlined text-[15px] text-error shrink-0">error</span>
            <span class="truncate"><b class="text-on-surface">{{ guestNameFor(l) }}</b> — {{ l.errorMessage || 'échec' }}</span>
          </li>
        </ul>
      </div>
      <p v-if="!finishedSending" class="mt-3 text-xs text-on-surface-variant text-center">Vous pouvez fermer la page, l'envoi se poursuit en arrière-plan.</p>
      <button v-else class="mt-4 mb-4 w-full h-12 rounded-xl bg-primary text-on-primary font-semibold text-sm shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all" @click="goBackToList">
        Terminer
      </button>
    </template>

    <!-- Bouton WhatsApp collant en bas (étape sélection) -->
    <div v-if="step === 'select'" class="sticky bottom-0 -mx-4 px-4 py-3 bg-surface-container-lowest/95 backdrop-blur border-t border-outline-variant/40">
      <button :disabled="!waEnabled || sending || selectedCount === 0" @click="send"
              class="w-full h-12 rounded-full bg-[#25D366] text-white font-bold text-sm inline-flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/30 hover:brightness-95 transition-all disabled:opacity-50 disabled:shadow-none">
        <svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        {{ sending ? 'Démarrage…' : (waEnabled ? `Envoyer sur WhatsApp (${selectedCount})` : 'Envoi WhatsApp désactivé') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { listInvitations, createInvitation, startBulkSend, getBulkBatch, getBulkBatchLogs, type Invitation, type BulkSendBatch, type NotificationLog } from '../../api/invitations'
import { listGuests, type Guest } from '../../api/guests'
import { getEvent, loadEventImage, type Event } from '../../api/events'
import { useAuthStore } from '../../stores/auth'
import { hasAny } from '../../permissions'
import { useNotificationStore } from '../../stores/notifications'
import { getWhatsappSettings } from '../../api/admin'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const notifications = useNotificationStore()
const eventId = Number(route.params.id)

type FilterKey = 'all' | 'pending' | 'sent'
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'pending', label: 'Pas encore invités' },
  { key: 'sent', label: 'Déjà envoyés' },
]

interface Row {
  guest: Guest
  invitation: Invitation | null
  eligible: boolean
  reason: string | null
  /** true si l'invitation existe mais n'a jamais été envoyée (ou pas d'invitation). */
  isFirstSend: boolean
}

const loading = ref(true)
const sending = ref(false)
const waEnabled = ref(true)
const step = ref<'select' | 'progress'>('select')
const query = ref('')
const filter = ref<FilterKey>('pending')
const guests = ref<Guest[]>([])
const invitations = ref<Invitation[]>([])
const selection = ref<Set<number>>(new Set())
const event = ref<Event | null>(null)
const eventImage = ref<string | null>(null)

const batches = ref<BulkSendBatch[]>([])
const logs = ref<NotificationLog[]>([])
let timer: ReturnType<typeof setInterval> | null = null

const canCreateInvitations = computed(() => hasAny(auth.permissions, 'INVITATION_CREATE'))

const rows = computed<Row[]>(() => {
  return guests.value.map((g) => {
    const invitation = invitations.value.find((i) => i.guestId === g.id) ?? null
    if (!invitation) {
      return {
        guest: g, invitation: null,
        eligible: canCreateInvitations.value,
        reason: canCreateInvitations.value ? null : 'Invitation à créer d’abord (permission requise)',
        isFirstSend: true,
      }
    }
    const status = invitation.status
    if (status === 'CANCELLED' || status === 'EXPIRED') {
      return { guest: g, invitation, eligible: false, reason: `Invitation ${status === 'CANCELLED' ? 'annulée' : 'expirée'}`, isFirstSend: false }
    }
    if (!g.phone) {
      return { guest: g, invitation, eligible: false, reason: 'Aucun numéro de téléphone', isFirstSend: invitation.status !== 'SENT' }
    }
    return {
      guest: g, invitation, eligible: true, reason: null,
      isFirstSend: status === 'GENERATED' || status === 'DRAFT',
    }
  })
})

const pendingCount = computed(() => rows.value.filter((r) => r.isFirstSend).length)
const sentCount = computed(() => rows.value.filter((r) => r.invitation?.status === 'SENT').length)

const visibleRows = computed(() => {
  const q = query.value.trim().toLowerCase()
  return rows.value.filter((r) => {
    if (filter.value === 'pending' && !r.isFirstSend) return false
    if (filter.value === 'sent' && r.invitation?.status !== 'SENT') return false
    if (q && !`${r.guest.firstName} ${r.guest.lastName}`.toLowerCase().includes(q)
      && !(r.guest.phone ?? '').toLowerCase().includes(q)) return false
    return true
  })
})

function filterCount(key: FilterKey): number {
  if (key === 'pending') return pendingCount.value
  if (key === 'sent') return sentCount.value
  return rows.value.length
}

const selectedCount = computed(() => {
  const ids = selection.value
  return rows.value.filter((r) => ids.has(r.guest.id) && r.eligible).length
})

const allVisibleSelected = computed(() =>
  visibleRows.value.length > 0 && visibleRows.value.every((r) => !r.eligible || selection.value.has(r.guest.id)))

function toggleGuest(guestId: number) {
  const next = new Set(selection.value)
  if (next.has(guestId)) next.delete(guestId)
  else next.add(guestId)
  selection.value = next
}

function toggleAllVisible() {
  const next = new Set(selection.value)
  if (allVisibleSelected.value) {
    visibleRows.value.forEach((r) => next.delete(r.guest.id))
  } else {
    visibleRows.value.forEach((r) => { if (r.eligible) next.add(r.guest.id) })
  }
  selection.value = next
}

// ————— Helpers affichage —————

const avatarPalette = ['#5b2ecc', '#176b5b', '#f4a340', '#1f2937', '#7c3aed', '#0e7490']
const avatarColor = (n: number) => avatarPalette[n % avatarPalette.length]
const initialsFor = (g: Guest) => `${g.firstName.charAt(0)}${g.lastName.charAt(0)}`.toUpperCase()

function formatPhone(phone: string | null | undefined): string {
  if (!phone) return 'Sans numéro'
  const cleaned = phone.replace(/[^\d+]/g, '')
  if (cleaned.startsWith('+')) {
    const rest = cleaned.slice(1)
    return `+${rest.slice(0, 3)} ${rest.slice(3).replace(/(\d{2})(?=\d)/g, '$1 ').trim()}`
  }
  return cleaned.replace(/(\d{2})(?=\d)/g, '$1 ').trim()
}

function statusLabel(row: Row): string {
  if (!row.invitation) return 'Pas invité'
  switch (row.invitation.status) {
    case 'SENT': return row.invitation.deliveredAt ? 'Délivrée' : 'Envoyée'
    case 'GENERATED': return 'Prête'
    case 'DRAFT': return 'Brouillon'
    case 'CANCELLED': return 'Annulée'
    case 'EXPIRED': return 'Expirée'
    default: return row.invitation.status
  }
}

function statusChipClass(row: Row): string {
  if (!row.invitation) return 'bg-surface-container-high text-on-surface-variant'
  switch (row.invitation.status) {
    case 'SENT': return row.invitation.deliveredAt ? 'bg-emerald-600/10 text-emerald-700' : 'bg-primary/10 text-primary'
    case 'GENERATED': return 'bg-amber-500/15 text-amber-600'
    case 'CANCELLED':
    case 'EXPIRED': return 'bg-error/10 text-error'
    default: return 'bg-surface-container-high text-on-surface-variant'
  }
}

// ————— Événement (aperçu) —————

const dateLabel = computed(() => {
  const d = event.value?.eventDate
  if (!d) return null
  const parsed = new Date(d.length <= 10 ? `${d}T00:00:00` : d)
  if (Number.isNaN(parsed.getTime())) return null
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(parsed)
})
const timeLabel = computed(() => (event.value?.startTime ? event.value.startTime.slice(0, 5) : null))

// ————— Chargement —————

onMounted(async () => {
  try {
    const [g, inv, ev, img] = await Promise.all([
      listGuests(eventId),
      listInvitations(eventId),
      getEvent(eventId).catch(() => null),
      loadEventImage(eventId),
    ])
    guests.value = g
    invitations.value = inv
    event.value = ev
    eventImage.value = img
  } finally {
    loading.value = false
  }
  try {
    waEnabled.value = (await getWhatsappSettings()).whatsappSendingEnabled
  } catch {
    // en cas d'erreur : l'envoi reste actif (comportement par défaut)
  }
})

onBeforeUnmount(stopPolling)

// ————— Envoi —————

const finishedSending = computed(() => batches.value.length > 0 && batches.value.every((b) => b.status === 'COMPLETED' || b.status === 'FAILED'))

const agg = computed(() => batches.value.reduce(
  (acc, b) => ({ sent: acc.sent + b.sentCount, failed: acc.failed + b.failedCount, skipped: acc.skipped + b.skippedCount }),
  { sent: 0, failed: 0, skipped: 0 },
))

const progressPct = computed(() => {
  const total = batches.value.reduce((s, b) => s + b.totalCount, 0)
  if (total === 0) return 0
  const processed = agg.value.sent + agg.value.failed + agg.value.skipped
  return Math.min(100, Math.round((processed / total) * 100))
})

const failedLogs = computed(() => logs.value.filter((l) => l.status === 'FAILED'))

/** Confirmations de livraison reçues du webhook Meta (delivered/read). */
const deliveredCount = computed(() => logs.value.filter((l) => l.status === 'DELIVERED' || l.status === 'READ').length)

function guestNameFor(l: NotificationLog): string {
  const g = guests.value.find((x) => x.id === l.guestId)
  return g ? `${g.firstName} ${g.lastName}` : `#${l.guestId ?? '?'}`
}

async function send() {
  const selected = rows.value.filter((r) => selection.value.has(r.guest.id) && r.eligible)
  if (selected.length === 0) return
  if (!waEnabled.value) {
    notifications.push("L'envoi WhatsApp est désactivé par l'administrateur de la plateforme.", 'error')
    return
  }
  sending.value = true
  try {
    // 1) Invités sans invitation : création à la volée (le backend n'accepte qu'une invitation par invité)
    const createdIds: number[] = []
    for (const row of selected.filter((r) => !r.invitation)) {
      try {
        const created = await createInvitation(eventId, row.guest.id)
        createdIds.push(created.id)
      } catch {
        notifications.push(`Impossible de créer l'invitation pour ${row.guest.firstName} ${row.guest.lastName}.`, 'error')
      }
    }

    // 2) Deux lots : premiers envois (GENERATED/DRAFT) et relances (SENT → resend)
    const firstSendIds = selected.filter((r) => r.invitation && r.invitation.status !== 'SENT').map((r) => r.invitation!.id)
    const resendIds = selected.filter((r) => r.invitation && r.invitation.status === 'SENT').map((r) => r.invitation!.id)

    const launched: BulkSendBatch[] = []
    const firstBatchIds = [...firstSendIds, ...createdIds]
    if (firstBatchIds.length > 0) {
      launched.push(await startBulkSend(eventId, { invitationIds: firstBatchIds }))
    }
    if (resendIds.length > 0) {
      launched.push(await startBulkSend(eventId, { invitationIds: resendIds, resend: true }))
    }
    if (launched.length === 0) {
      notifications.push('Aucune invitation éligible à l’envoi.', 'error')
      return
    }

    batches.value = launched
    logs.value = []
    step.value = 'progress'
    timer = setInterval(poll, 2000)
    await poll()
  } finally {
    sending.value = false
  }
}

async function poll() {
  if (batches.value.length === 0) return
  try {
    const updated = await Promise.all(batches.value.map((b) => getBulkBatch(eventId, b.id)))
    batches.value = updated
    const logsArrays = await Promise.all(updated.map((b) => getBulkBatchLogs(eventId, b.id)))
    logs.value = logsArrays.flat()
    if (finishedSending.value) {
      stopPolling()
      const inv = await listInvitations(eventId)
      invitations.value = inv
      notifications.push(`Envoi terminé : ${agg.value.sent} envoyée(s), ${agg.value.failed} échec(s).`, 'success')
    }
  } catch { /* nouvelle tentative au prochain tick */ }
}

function stopPolling() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

// ————— Navigation —————

function goBack() {
  if (step.value === 'progress' && !finishedSending.value) {
    notifications.push('L’envoi se poursuit en arrière-plan.', 'info')
  }
  goBackToList()
}

function goBackToList() {
  router.push({ name: 'event-invitations', params: { id: String(eventId) } })
}
</script>



