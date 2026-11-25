<template>
  <div class="min-h-full">
    <p v-if="loading" class="text-slate-500 py-20 text-center text-sm">Chargement…</p>
    <p v-else-if="error" class="text-error py-20 text-center text-sm" role="alert">{{ error }}</p>

    <template v-else>
      <div class="mb-5">
        <h1 class="m-0 text-[22px] font-bold text-slate-900 tracking-tight">Bonjour, {{ firstName }}</h1>
        <p class="m-0 mt-0.5 text-[14px] text-slate-600">Voici où en est votre événement.</p>
      </div>

      <EventCreationLockedNotice />

      <div v-if="!active" class="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-600 text-sm">
        <template v-if="creationLocked">Aucun événement pour le moment. Votre activité apparaîtra ici après votre premier événement.</template>
        <template v-else>Aucun événement actif pour le moment. Créez votre premier événement pour suivre votre activité ici.</template>
      </div>

      <div v-else class="flex flex-col gap-5">
        <DashHero :event="active" :can-send="canSend" />

        <section v-if="dashboard" aria-label="Indicateurs clés" class="grid gap-4 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
          <DashKpi
            v-if="dashboard.has.guests"
            test-id="kpi-guests"
            label="Invités"
            :value="dashboard.guests.total"
            :icon="Users"
            tone="primary"
            :hint="guestsHint"
          />
          <DashKpi
            v-if="dashboard.has.invitations"
            test-id="kpi-response"
            label="Taux de réponse"
            :value="`${responseRate}%`"
            :suffix="`${responded} / ${responseBase}`"
            :icon="RefreshCw"
            tone="amber"
            :progress="responseRate"
            :progress-label="`${responseRate} % des invitations envoyées ont reçu une réponse`"
          />
          <DashKpi
            v-if="dashboard.has.invitations || dashboard.has.attendance"
            test-id="kpi-confirmed"
            label="Présences confirmées"
            :value="dashboard.has.attendance ? dashboard.attendance.expected : dashboard.invitations.accepted"
            :suffix="dashboard.has.attendance ? 'personnes' : 'acceptées'"
            :icon="UserCheck"
            tone="green"
            :hint="confirmedHint"
          />
          <DashKpi
            v-if="dashboard.has.tables"
            test-id="kpi-tables"
            label="Places aux tables"
            :value="dashboard.tables.assignedGuests"
            :suffix="dashboard.tables.capacity ? `/ ${dashboard.tables.capacity} places` : 'aucune table'"
            :icon="LayoutGrid"
            tone="blue"
            :progress="dashboard.tables.capacity ? percent(dashboard.tables.assignedGuests, dashboard.tables.capacity) : null"
            :progress-label="`${dashboard.tables.assignedGuests} places attribuées sur ${dashboard.tables.capacity}`"
          />
        </section>

        <div v-if="dashboard?.has.invitations" class="grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))]">
          <DashFunnel
            v-if="dashboard.has.tracking"
            :created="dashboard.invitations.total"
            :sent="sent"
            :opened="dashboard.invitations.opened"
            :responded="responded"
            :present="dashboard.has.attendance && dashboard.attendance.checkedIn > 0 ? dashboard.attendance.checkedIn : null"
          />
          <DashTodo :items="todo" />
        </div>

        <div class="grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))]">
          <DashResponses
            v-if="dashboard?.has.invitations"
            :accepted="dashboard.invitations.accepted"
            :declined="dashboard.invitations.declined"
            :no-answer="noAnswer"
            :link="auth.can([Perm.rsvpView]) ? `/dashboard/events/${active.id}/rsvp` : undefined"
          />
          <DashProgramme :sessions="sessions" :link="`/dashboard/events/${active.id}/internal-events`" />
        </div>

        <div class="grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))]">
          <DashLatestResponses
            v-if="rsvps !== null"
            :rows="latestResponses"
            :link="auth.can([Perm.guestView]) ? `/dashboard/events/${active.id}/guests` : undefined"
          />
          <DashActivity :activity="activity" />
        </div>
      </div>

      <ReminderSettingsDialog
        v-if="remindersOpen && active"
        level="event"
        :target-id="active.id"
        :subtitle="`Événement : ${active.weddingDetails?.displayName || active.name}`"
        @close="remindersOpen = false"
        @saved="onRemindersSaved"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { Bell, Eye, LayoutGrid, Mail, Megaphone, RefreshCw, Send, UserCheck, Users } from 'lucide-vue-next'
import { getDashboard, getRecentActivity, type Dashboard, type ActivityItem } from '../api/dashboard'
import { listGuests, listCategories, type Guest, type GuestCategory } from '../api/guests'
import { listRsvps, type RsvpRow } from '../api/rsvp'
import { listWeddingEvents, type WeddingEventItem } from '../api/weddingEvents'
import { getReminderSettings, effectiveReminderSettings, type ReminderSettings } from '../api/reminderSettings'
import { apiErrorMessage } from '../api/http'
import { Perm } from '../permissions'
import { useWeddingStore } from '../stores/wedding'
import { useAuthStore } from '../stores/auth'
import { useNotificationStore } from '../stores/notifications'
import { initialsOf, fullName } from '../utils/initials'
import DashHero from '../components/dashboard/DashHero.vue'
import DashKpi from '../components/dashboard/DashKpi.vue'
import DashFunnel from '../components/dashboard/DashFunnel.vue'
import DashTodo, { type TodoItem } from '../components/dashboard/DashTodo.vue'
import DashResponses from '../components/dashboard/DashResponses.vue'
import DashProgramme from '../components/dashboard/DashProgramme.vue'
import DashLatestResponses, { type LatestResponseRow } from '../components/dashboard/DashLatestResponses.vue'
import DashActivity from '../components/dashboard/DashActivity.vue'
import EventCreationLockedNotice from '../components/common/EventCreationLockedNotice.vue'
import ReminderSettingsDialog from '../components/common/ReminderSettingsDialog.vue'
import { useEventCreationLock } from '../composables/useEventCreationLock'
import { percent, plural } from '../components/dashboard/dashboardMath'

const auth = useAuthStore()
const toasts = useNotificationStore()
const { locked: creationLocked } = useEventCreationLock()
const weddingStore = useWeddingStore()

const dashboard = ref<Dashboard | null>(null)
const sessions = ref<WeddingEventItem[]>([])
const activity = ref<ActivityItem[]>([])
// null: answers not accessible to this user (or not loaded).
const rsvps = ref<RsvpRow[] | null>(null)
const guests = ref<Guest[]>([])
const categories = ref<GuestCategory[]>([])
const reminders = ref<ReminderSettings | null>(null)
const remindersOpen = ref(false)
const loading = ref(true)
const error = ref('')

const firstName = computed(() => auth.user?.firstName || '')
const active = computed(() => weddingStore.active)

const canSend = computed(() => auth.can([Perm.invitationSend]))
const canSetReminders = computed(() => auth.isSuperAdmin || auth.roles.includes('ORGANISATEUR'))

// ----- Figures -----
const sent = computed(() => dashboard.value?.invitations.sent ?? 0)
const responded = computed(() => (dashboard.value?.invitations.accepted ?? 0) + (dashboard.value?.invitations.declined ?? 0))
/** Rates are computed on sent invitations; on an older backend without `sent`, on all of them. */
const responseBase = computed(() => Math.max(sent.value, responded.value) || dashboard.value?.invitations.total || 0)
const responseRate = computed(() => percent(responded.value, responseBase.value))
const noAnswer = computed(() => Math.max(0, responseBase.value - responded.value))

const guestsHint = computed(() => {
  const d = dashboard.value
  if (!d?.has.invitations) return undefined
  if (!d.has.tracking) return plural(d.invitations.total, 'invitation créée', 'invitations créées')
  const toSend = Math.max(0, d.invitations.total - sent.value)
  const parts = [plural(sent.value, 'invitation envoyée', 'invitations envoyées')]
  if (toSend) parts.push(`${toSend} à envoyer`)
  return parts.join(' · ')
})
const confirmedHint = computed(() => {
  const d = dashboard.value
  if (!d) return undefined
  const parts: string[] = []
  if (d.has.attendance && d.has.invitations) parts.push(plural(d.invitations.accepted, 'invitation acceptée', 'invitations acceptées'))
  if (d.has.invitations) parts.push(plural(d.invitations.declined, 'refus', 'refus'))
  if (d.has.attendance && d.attendance.checkedIn > 0) parts.push(`${d.attendance.checkedIn} déjà présent${d.attendance.checkedIn > 1 ? 's' : ''}`)
  return parts.join(' · ') || undefined
})

// ----- À faire -----
const todo = computed<TodoItem[]>(() => {
  const d = dashboard.value
  const ev = active.value
  if (!d || !ev) return []
  const base = `/dashboard/events/${ev.id}`
  const items: TodoItem[] = []
  if (ev.status === 'DRAFT') {
    items.push({ id: 'draft', title: "L'événement est encore en brouillon", detail: 'Publiez-le pour que vos invités puissent répondre.', icon: Megaphone, tone: 'amber', urgent: true, action: 'Publier', to: base })
  }
  if (noAnswer.value > 0 && sent.value > 0) {
    items.push({ id: 'no-answer', title: `${plural(noAnswer.value, 'invité n\'a', 'invités n\'ont')} pas répondu`, detail: 'Une relance augmente nettement le taux de réponse.', icon: RefreshCw, tone: 'amber', urgent: true, action: 'Relancer', to: `${base}/invitations` })
  }
  const toSend = d.has.tracking ? Math.max(0, d.invitations.total - sent.value) : 0
  if (toSend > 0) {
    items.push({ id: 'to-send', title: `${plural(toSend, 'invitation', 'invitations')} pas encore ${toSend > 1 ? 'envoyées' : 'envoyée'}`, icon: Send, tone: 'primary', action: 'Envoyer', to: `${base}/invitations/send` })
  }
  const withoutInvitation = d.has.guests ? Math.max(0, d.guests.total - d.invitations.total) : 0
  if (withoutInvitation > 0) {
    items.push({ id: 'no-invitation', title: `${plural(withoutInvitation, 'invité', 'invités')} sans invitation`, icon: Mail, tone: 'primary', action: 'Créer', to: `${base}/invitations/new` })
  }
  const neverOpened = d.has.tracking ? Math.max(0, sent.value - d.invitations.opened) : 0
  if (neverOpened > 0) {
    items.push({ id: 'never-opened', title: `${plural(neverOpened, 'invitation jamais ouverte', 'invitations jamais ouvertes')}`, detail: 'Vérifiez les numéros WhatsApp.', icon: Eye, tone: 'primary', action: 'Voir', to: `${base}/invitations` })
  }
  const unassigned = d.guests.unassigned ?? 0
  if (d.has.tables && d.tables.total > 0 && unassigned > 0) {
    items.push({ id: 'unassigned', title: `${plural(unassigned, 'invité', 'invités')} sans table`, detail: `${plural(d.tables.remainingCapacity, 'place encore libre', 'places encore libres')}.`, icon: LayoutGrid, tone: 'blue', action: 'Placer', to: `${base}/tables` })
  }
  const next = nextReminder.value
  if (next && canSetReminders.value) {
    items.push({ id: 'reminder', title: `Prochain rappel : ${next}`, detail: 'Dans votre cloche de notifications.', icon: Bell, tone: 'slate', info: true, action: 'Régler', onClick: () => { remindersOpen.value = true } })
  }
  return items
})

/** Next automatic reminder from the event's settings, e.g. "samedi 6 décembre, 08h00". */
const nextReminder = computed(() => {
  const s = reminders.value
  const date = active.value?.eventDate
  if (!s || !s.enabled || !date) return null
  const hour = s.sendHour ?? 8
  const day = new Date(`${date.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(day.getTime())) return null
  const offsets: number[] = []
  if (s.firstReminderEnabled && s.firstReminderDays) offsets.push(s.firstReminderDays)
  if (s.eveEnabled) offsets.push(1)
  if (s.dayOfEnabled) offsets.push(0)
  const now = new Date()
  const candidates = offsets.map((o) => {
    const at = new Date(day)
    at.setDate(day.getDate() - o)
    at.setHours(hour, 0, 0, 0)
    return at
  }).filter((at) => at.getTime() > now.getTime()).sort((a, b) => a.getTime() - b.getTime())
  if (!candidates.length) return null
  const at = candidates[0]
  return `${at.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}, ${String(hour).padStart(2, '0')}h00`
})

// ----- Dernières réponses -----
const latestResponses = computed<LatestResponseRow[]>(() => {
  if (!rsvps.value) return []
  const byGuest = new Map(guests.value.map((g) => [g.id, g]))
  const categoryName = new Map(categories.value.map((c) => [c.id, c.name]))
  return rsvps.value
    .filter((r) => r.status === 'ACCEPTED' || r.status === 'DECLINED')
    .sort((a, b) => (b.respondedAt ?? '').localeCompare(a.respondedAt ?? ''))
    .slice(0, 5)
    .map((r) => {
      const g = byGuest.get(r.guestId)
      return {
        id: r.invitationId,
        name: g ? fullName(g.firstName, g.lastName) : `Invité n°${r.guestId}`,
        initials: g ? initialsOf(g.firstName, g.lastName) : '?',
        category: g?.categoryId != null ? categoryName.get(g.categoryId) ?? null : null,
        people: r.status === 'ACCEPTED' ? Math.max(1, r.numberOfAttendees ?? 1) : 0,
        accepted: r.status === 'ACCEPTED',
      }
    })
})

function onRemindersSaved() {
  remindersOpen.value = false
  toasts.push('Réglages des rappels enregistrés.', 'success')
  if (active.value) void loadReminders(active.value.id)
}

// ----- Loading -----
let loadSequence = 0

function clearData() {
  dashboard.value = null
  sessions.value = []
  activity.value = []
  rsvps.value = null
  guests.value = []
  categories.value = []
  reminders.value = null
}

async function loadReminders(eventId: number) {
  if (!canSetReminders.value) return
  try {
    reminders.value = effectiveReminderSettings(await getReminderSettings('event', eventId))
  } catch { reminders.value = null }
}

async function loadData(eventId: number) {
  const sequence = ++loadSequence
  loading.value = true
  error.value = ''
  clearData()
  try {
    const canRsvp = auth.can([Perm.rsvpView])
    const canGuests = auth.can([Perm.guestView])
    const results = await Promise.allSettled([
      getDashboard(eventId),
      listWeddingEvents(eventId),
      getRecentActivity(eventId, 6),
      canRsvp ? listRsvps(eventId) : Promise.resolve(null),
      canRsvp && canGuests ? listGuests(eventId) : Promise.resolve([] as Guest[]),
      canRsvp && canGuests ? listCategories(eventId) : Promise.resolve([] as GuestCategory[]),
    ])
    if (sequence !== loadSequence) return
    // Without figures, zeros would pass a network error off as an empty event. The other cards are optional.
    if (results[0].status === 'rejected') throw results[0].reason
    dashboard.value = results[0].value
    sessions.value = results[1].status === 'fulfilled' ? results[1].value : []
    activity.value = results[2].status === 'fulfilled' ? results[2].value : []
    rsvps.value = results[3].status === 'fulfilled' ? results[3].value : null
    guests.value = results[4].status === 'fulfilled' ? results[4].value : []
    categories.value = results[5].status === 'fulfilled' ? results[5].value : []
    void loadReminders(eventId)
  } catch (e: unknown) {
    if (sequence === loadSequence) error.value = apiErrorMessage(e)
  } finally {
    if (sequence === loadSequence) loading.value = false
  }
}

onMounted(() => {
  void weddingStore.load().catch((e: any) => {
    error.value = e?.message || 'Erreur de chargement'
    loading.value = false
  })
})

watch(
  () => [weddingStore.activeId, weddingStore.loaded] as const,
  ([id, loaded]) => {
    if (id) void loadData(id)
    else {
      ++loadSequence
      clearData()
      loading.value = !loaded
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  ++loadSequence
})
</script>
