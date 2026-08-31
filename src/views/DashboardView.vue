<template>
  <div class="min-h-full">
    <p v-if="loading" class="text-slate-400 py-20 text-center text-sm">Chargement…</p>
    <p v-else-if="error" class="text-error py-20 text-center text-sm">{{ error }}</p>

    <template v-else>
      <!-- En-tête dashboard style Prosoc -->
      <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-6">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
          <div>
            <h1 class="text-[22px] font-bold text-slate-900 tracking-tight">Bonjour, {{ firstName }} 👋</h1>
            <p class="text-[13px] text-slate-500 mt-0.5 font-medium">Voici un aperçu de vos événements et de vos activités.</p>
          </div>
        </div>

        <div class="flex justify-end">
          <EventSelector :name="active?.weddingDetails?.displayName || active?.name" :subtitle="eventSubtitle" />
        </div>
      </div>

      <div v-if="!active" class="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500 shadow-sm text-sm">
        Aucun événement actif pour le moment. Créez votre premier événement pour suivre votre activité ici.
      </div>

      <template v-else>
        <!-- Ligne cartes stats -->
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
          <StatCard label="Total Invités" :value="guestsTotal" icon="group" tone="primary" />
          <StatCard label="Invitations envoyées" :value="invitedTotal" :total="guestsTotal" icon="mail" tone="primary" :progress="inviteProgress" />
          <StatCard label="Check-ins" :value="checkedIn" :total="expectedGuests" icon="person_check" tone="success" :progress="checkinProgress" />
          <StatCard label="Taux de réponse" :value="responseRate + '%'" icon="poll" tone="attention" :progress="responseRate" />
        </div>

        <!-- RSVP + Prochain événement interne -->
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
          <div class="xl:col-span-2">
            <RsvpOverviewCard :accepted="accepted" :pending="pending" :declined="declined" :noResponse="noResponse" />
          </div>
          <div class="xl:col-span-1">
            <UpcomingInternalEventCard
              :date="upcoming?.sessionDate ?? undefined"
              :name="upcoming?.name ?? undefined"
              :time="upcoming?.startTime ?? undefined"
              :venue="[upcoming?.venueName, upcoming?.city].filter(Boolean).join(', ') || undefined"
              :guests="upcoming?.expectedAttendees ?? undefined"
            />
          </div>
        </div>

        <!-- Invités récents + Activité récente -->
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div class="xl:col-span-2">
            <RecentGuestsTable :rows="guestRows" />
          </div>
          <div class="xl:col-span-1">
            <RecentActivityCard :rows="activityRows" />
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { getDashboard, getUpcomingSession, getRecentActivity, type Dashboard, type UpcomingSession, type ActivityItem } from '../api/dashboard'
import { listGuests, type Guest } from '../api/guests'
import { useWeddingStore } from '../stores/wedding'
import EventSelector from '../components/dashboard/EventSelector.vue'
import StatCard from '../components/dashboard/StatCard.vue'
import RsvpOverviewCard from '../components/dashboard/RsvpOverviewCard.vue'
import UpcomingInternalEventCard from '../components/dashboard/UpcomingInternalEventCard.vue'
import RecentGuestsTable from '../components/dashboard/RecentGuestsTable.vue'
import RecentActivityCard from '../components/dashboard/RecentActivityCard.vue'
import { useAuthStore } from '../stores/auth'
import { initialsOf, fullName } from '../utils/initials'

interface GuestRow {
  id: number
  name: string
  initials: string
  group?: string | null
  people?: number | null
  status?: string | null
}

interface ActivityRow {
  id: string
  type: 'guest' | 'invitation' | 'checkin' | 'table'
  icon: string
  title: string
  subtitle: string
  time: string
}

const auth = useAuthStore()
const weddingStore = useWeddingStore()
const dashboard = ref<Dashboard | null>(null)
const guests = ref<Guest[]>([])
const upcoming = ref<UpcomingSession | null>(null)
const activity = ref<ActivityItem[]>([])
const loading = ref(true)
const error = ref('')

const firstName = computed(() => auth.user?.firstName || 'JP')
const active = computed(() => weddingStore.active)
const eventSubtitle = computed(() => (active.value ? `${active.value.type || 'ÉVÉNEMENT'} • ${active.value.status || 'DRAFT'}` : ''))
const notifications = computed(() => 3)

const guestsTotal = computed(() => guests.value.length)
const invitedTotal = computed(() => dashboard.value?.invitations.total ?? 0)
const accepted = computed(() => dashboard.value?.invitations.accepted ?? 0)
const pending = computed(() => dashboard.value?.invitations.pending ?? 0)
const declined = computed(() => dashboard.value?.invitations.declined ?? 0)
const noResponse = computed(() => Math.max(0, guestsTotal.value - accepted.value - pending.value - declined.value))
const checkedIn = computed(() => dashboard.value?.attendance.checkedIn ?? 0)
const expectedGuests = computed(() => dashboard.value?.attendance.expected ?? 0)
const inviteProgress = computed(() =>
  guestsTotal.value > 0 ? Math.round((invitedTotal.value / guestsTotal.value) * 100) : 0,
)
const checkinProgress = computed(() =>
  expectedGuests.value > 0 ? Math.round((checkedIn.value / expectedGuests.value) * 100) : 0,
)
const responseRate = computed(() => {
  const total = accepted.value + pending.value + declined.value + noResponse.value
  if (total === 0) return 0
  return Math.round((accepted.value / total) * 100)
})

const guestRows = computed<GuestRow[]>(() =>
  guests.value.slice(0, 5).map((g) => ({
    id: g.id,
    name: fullName(g.firstName, g.lastName),
    initials: initialsOf(g.firstName, g.lastName),
    group: null,
    people: g.allowedCompanions != null ? g.allowedCompanions + 1 : 1,
    status: 'ACCEPTED',
  })),
)

const activityRows = computed<ActivityRow[]>(() =>
  activity.value.map((a) => {
    const kind = activityKind(a.action, a.entityType)
    return {
      id: String(a.id),
      type: kind,
      icon: activityIcon(kind, a.action),
      title: a.details || a.action,
      subtitle: active.value?.name ?? '',
      time: formatActivityTime(a.performedAt),
    }
  }),
)

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const activeId = weddingStore.active?.id
    if (!activeId) return
    const results = await Promise.allSettled([
      getDashboard(activeId),
      listGuests(activeId),
      getUpcomingSession(activeId),
      getRecentActivity(activeId, 5),
    ])
    dashboard.value = results[0].status === 'fulfilled' ? results[0].value : null
    guests.value = results[1].status === 'fulfilled' ? results[1].value : []
    upcoming.value = results[2].status === 'fulfilled' ? results[2].value : null
    activity.value = results[3].status === 'fulfilled' ? results[3].value : []
  } catch (e: any) {
    error.value = e?.message || 'Erreur de chargement'
  } finally {
    loading.value = false
  }
}

/** Catégorise une trace d'audit pour l'icône / la couleur. */
function activityKind(action: string, entityType?: string | null): ActivityRow['type'] {
  const a = `${action} ${entityType ?? ''}`.toUpperCase()
  if (a.includes('CHECKIN') || a.includes('CHECK_IN')) return 'checkin'
  if (a.includes('INVITATION')) return 'invitation'
  if (a.includes('TABLE')) return 'table'
  if (a.includes('GUEST') || a.includes('RSVP')) return 'guest'
  return 'guest'
}

/** Icône Material Symbols selon le type d'activité. */
function activityIcon(kind: ActivityRow['type'], action: string): string {
  const a = action.toUpperCase()
  if (kind === 'checkin') return 'how_to_reg'
  if (kind === 'invitation') return a.includes('SEND') ? 'send' : 'mail'
  if (kind === 'table') return 'table_restaurant'
  return a.includes('CREATE') || a.includes('IMPORT') ? 'person_add' : 'person'
}

/** Formatage FR : « aujourd'hui, 14h30 » / « hier, 09h15 » / « 12/09, 18h00 ». */
function formatActivityTime(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  const hhmm = `${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`
  const today = new Date()
  const isSameDay = (x: Date, y: Date) => x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (isSameDay(d, today)) return hhmm
  if (isSameDay(d, yesterday)) return `hier, ${hhmm}`
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}, ${hhmm}`
}

onMounted(async () => {
  await weddingStore.load()
  await loadData()
})

watch(
  () => weddingStore.activeId,
  (nv, old) => {
    if (nv && nv !== old) void loadData()
  },
)
</script>
