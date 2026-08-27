<template>
  <div class="min-h-full">
    <p v-if="loading" class="text-on-surface-variant py-20 text-center">Chargement…</p>
    <p v-else-if="error" class="text-error py-20 text-center">{{ error }}</p>

    <template v-else>
      <!-- Zone de bienvenue -->
      <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-on-surface">Bonjour, {{ firstName }} 👋</h1>
          <p class="text-on-surface-variant mt-1">Voici un aperçu de votre événement et de vos activités.</p>
        </div>
        <EventSelector :name="active?.displayName" :subtitle="eventSubtitle" />
      </div>

      <div v-if="!active" class="bg-white border border-outline-variant/60 rounded-card p-10 text-center text-on-surface-variant shadow-card">
        Aucun événement actif pour le moment. Créez votre premier mariage pour suivre votre activité ici.
      </div>

      <template v-else>
        <!-- Ligne cartes stats -->
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
          <StatCard label="Total Invités" :value="guestsTotal" icon="group" badge="+12" tone="primary" />
          <StatCard label="Invitations envoyées" :value="invitedTotal" :total="guestsTotal" icon="mail" tone="primary"
            :progress="inviteProgress" />
          <StatCard label="Check-ins" :value="checkedIn" :total="expectedGuests" icon="person_check" tone="success"
            :progress="checkinProgress" />
          <QuickActionCard />
        </div>

        <!-- RSVP + Prochain événement interne -->
        <div class="grid grid-cols-1 xl:grid-cols-5 gap-5 mb-6">
          <div class="xl:col-span-3">
            <RsvpOverviewCard :accepted="accepted" :pending="pending" :declined="declined" />
          </div>
          <div class="xl:col-span-2">
            <UpcomingInternalEventCard />
          </div>
        </div>

        <!-- Invités récents -->
        <RecentGuestsTable :rows="guestRows" />
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { listWeddings, type Wedding } from '../api/weddings'
import { getDashboard, type Dashboard } from '../api/dashboard'
import { listGuests, type Guest } from '../api/guests'
import EventSelector from '../components/dashboard/EventSelector.vue'
import StatCard from '../components/dashboard/StatCard.vue'
import QuickActionCard from '../components/dashboard/QuickActionCard.vue'
import RsvpOverviewCard from '../components/dashboard/RsvpOverviewCard.vue'
import UpcomingInternalEventCard from '../components/dashboard/UpcomingInternalEventCard.vue'
import RecentGuestsTable from '../components/dashboard/RecentGuestsTable.vue'
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

const auth = useAuthStore()
const weddings = ref<Wedding[]>([])
const dashboard = ref<Dashboard | null>(null)
const guests = ref<Guest[]>([])
const loading = ref(true)
const error = ref('')

const firstName = computed(() => auth.user?.firstName || 'JP')
const active = computed(() => weddings.value[0] ?? null)
const eventSubtitle = computed(() => (active.value ? `MARIAGE • ${active.value.status}` : ''))
const guestsTotal = computed(() => guests.value.length)
const invitedTotal = computed(() => dashboard.value?.invitations.total ?? 0)
const accepted = computed(() => dashboard.value?.invitations.accepted ?? 0)
const pending = computed(() => dashboard.value?.invitations.pending ?? 0)
const declined = computed(() => dashboard.value?.invitations.declined ?? 0)
const checkedIn = computed(() => dashboard.value?.attendance.checkedIn ?? 0)
const expectedGuests = computed(() => dashboard.value?.attendance.expected ?? 0)
const inviteProgress = computed(() =>
  guestsTotal.value > 0 ? Math.round((invitedTotal.value / guestsTotal.value) * 100) : 0,
)
const checkinProgress = computed(() =>
  expectedGuests.value > 0 ? Math.round((checkedIn.value / expectedGuests.value) * 100) : 0,
)

const guestRows = computed<GuestRow[]>(() =>
  guests.value.slice(0, 6).map((g) => ({
    id: g.id,
    name: fullName(g.firstName, g.lastName),
    initials: initialsOf(g.firstName, g.lastName),
    group: null,
    people: g.allowedCompanions != null ? g.allowedCompanions + 1 : 1,
    status: 'ACCEPTED',
  })),
)

onMounted(async () => {
  try {
    weddings.value = await listWeddings()
    if (active.value) {
      const results = await Promise.allSettled([
        getDashboard(active.value.id),
        listGuests(active.value.id),
      ])
      dashboard.value = results[0].status === 'fulfilled' ? results[0].value : null
      guests.value = results[1].status === 'fulfilled' ? results[1].value : []
    }
  } catch (e: any) {
    error.value = e?.message || 'Erreur de chargement'
  } finally {
    loading.value = false
  }
})
</script>
