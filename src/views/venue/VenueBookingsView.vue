<template>
  <div>
    <VenuePageHeader title="Réservations" subtitle="Options, confirmations et calendrier de vos salles.">
      <router-link v-if="auth.can([Perm.bookingManage])" to="/dashboard/venue/bookings/new" class="v-btn-primary">
        <span class="material-symbols-outlined text-[18px]">add</span>
        Nouvelle réservation
      </router-link>
    </VenuePageHeader>

    <div class="v-card p-4 mb-4 flex flex-wrap items-end gap-3">
      <label class="min-w-[180px]">
        <span class="v-label">Salle</span>
        <select v-model="venueId" class="v-input">
          <option :value="undefined">Toutes les salles</option>
          <option v-for="v in venues" :key="v.id" :value="v.id">{{ v.name }}</option>
        </select>
      </label>
      <label class="min-w-[160px]">
        <span class="v-label">Statut</span>
        <select v-model="status" class="v-input">
          <option :value="undefined">Tous</option>
          <option v-for="(label, key) in BOOKING_STATUS_LABELS" :key="key" :value="key">{{ label }}</option>
        </select>
      </label>
      <label>
        <span class="v-label">Mois</span>
        <input v-model="month" type="month" class="v-input" />
      </label>
      <div class="ml-auto inline-flex rounded-lg border border-slate-200 overflow-hidden" role="group" aria-label="Affichage">
        <button class="h-10 px-4 text-[13px] font-semibold" :class="view === 'list' ? 'bg-primary text-white' : 'bg-white text-slate-600'" @click="view = 'list'">Liste</button>
        <button class="h-10 px-4 text-[13px] font-semibold" :class="view === 'calendar' ? 'bg-primary text-white' : 'bg-white text-slate-600'" @click="view = 'calendar'">Calendrier</button>
      </div>
    </div>

    <div v-if="loading" class="py-16 text-center text-slate-400 text-sm">Chargement…</div>

    <!-- Liste -->
    <div v-else-if="view === 'list'" class="v-card">
      <div v-if="!bookings.length" class="py-16 text-center">
        <span class="material-symbols-outlined text-primary text-[32px]">event_available</span>
        <p class="font-semibold text-slate-900 mt-2">Aucune réservation sur cette période</p>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-slate-50/80">
              <th class="v-th">Réf.</th><th class="v-th">Date</th><th class="v-th">Salle</th><th class="v-th">Client</th>
              <th class="v-th">Statut</th><th class="v-th text-right">Total</th><th class="v-th text-right">Reste</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in bookings" :key="b.id" class="border-t border-slate-100 hover:bg-primary-light/30 cursor-pointer" @click="open(b.id)">
              <td class="v-td font-semibold text-slate-900 whitespace-nowrap">{{ b.reference }}</td>
              <td class="v-td whitespace-nowrap">{{ formatDateTime(b.startAt) }}<div class="text-[11px] text-slate-400">→ {{ formatDateTime(b.endAt) }}</div></td>
              <td class="v-td">{{ b.venueName }}</td>
              <td class="v-td">{{ b.clientName }}<div class="text-[11px] text-slate-400">{{ b.title }}</div></td>
              <td class="v-td"><BookingStatusBadge :status="b.status" /></td>
              <td class="v-td text-right whitespace-nowrap">{{ formatMoney(b.totalAmount, b.currency) }}</td>
              <td v-if="b.status === 'ANNULEE'" class="v-td text-right whitespace-nowrap">
                <span class="text-slate-400">—</span>
                <div v-if="b.refundedAmount > 0" class="text-[11px] font-semibold text-error">Remboursé {{ formatMoney(b.refundedAmount, b.currency) }}</div>
                <div v-if="(b.retainedAmount ?? 0) > 0" class="text-[11px] text-slate-500">Retenu {{ formatMoney(b.retainedAmount, b.currency) }}</div>
              </td>
              <td v-else class="v-td text-right whitespace-nowrap font-semibold" :class="b.balance > 0 ? 'text-error' : 'text-success'">{{ formatMoney(b.balance, b.currency) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Calendrier mensuel -->
    <div v-else class="v-card p-4">
      <p v-if="!venueId" class="text-[12px] text-slate-500 mb-3">Toutes les salles sont affichées ; choisissez une salle pour voir ses seules disponibilités.</p>
      <div class="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-500 uppercase mb-1">
        <span v-for="d in ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']" :key="d">{{ d }}</span>
      </div>
      <div class="grid grid-cols-7 gap-1">
        <div
          v-for="(cell, i) in calendar"
          :key="i"
          class="min-h-[92px] rounded-lg border p-1.5 text-left"
          :class="cell.day ? (cell.bookings.length ? 'border-primary/30 bg-primary-light/20' : 'border-slate-100 bg-white') : 'border-transparent'"
        >
          <template v-if="cell.day">
            <div class="text-[12px] font-semibold" :class="cell.today ? 'text-primary' : 'text-slate-500'">{{ cell.day }}</div>
            <button
              v-for="b in cell.bookings"
              :key="b.id"
              class="mt-1 block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-semibold"
              :class="chipTone(b.status)"
              :title="`${b.reference} · ${b.clientName} · ${b.venueName}`"
              @click="open(b.id)"
            >
              {{ b.startAt.slice(11, 16) }} {{ b.clientName }}
            </button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VenuePageHeader from '../../components/venue/VenuePageHeader.vue'
import BookingStatusBadge from '../../components/venue/BookingStatusBadge.vue'
import { useAuthStore } from '../../stores/auth'
import { Perm } from '../../permissions'
import {
  BOOKING_STATUS_LABELS, formatDateTime, formatMoney, listBookings, listVenues,
  type Booking, type BookingStatus, type Venue,
} from '../../api/venues'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const now = new Date()
const month = ref(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
const venueId = ref<number | undefined>(route.query.venueId ? Number(route.query.venueId) : undefined)
const status = ref<BookingStatus | undefined>(undefined)
const view = ref<'list' | 'calendar'>('list')
const venues = ref<Venue[]>([])
const bookings = ref<Booking[]>([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const [y, m] = month.value.split('-').map(Number)
    const last = new Date(y, m, 0).getDate()
    const page = await listBookings({
      venueId: venueId.value,
      status: status.value,
      from: `${month.value}-01`,
      to: `${month.value}-${String(last).padStart(2, '0')}`,
      size: 200,
    })
    bookings.value = page.content
  } finally {
    loading.value = false
  }
}

/** Grille du mois (lundi en premier) avec les réservations qui touchent chaque jour. */
const calendar = computed(() => {
  const [y, m] = month.value.split('-').map(Number)
  const first = new Date(y, m - 1, 1)
  const days = new Date(y, m, 0).getDate()
  const offset = (first.getDay() + 6) % 7
  const todayKey = localDay(new Date())
  const cells: Array<{ day: number | null; today: boolean; bookings: Booking[] }> = []
  for (let i = 0; i < offset; i++) cells.push({ day: null, today: false, bookings: [] })
  for (let d = 1; d <= days; d++) {
    const key = `${month.value}-${String(d).padStart(2, '0')}`
    const dayBookings = bookings.value.filter((b) =>
      b.status !== 'ANNULEE' && b.startAt.slice(0, 10) <= key && endDay(b) >= key)
    cells.push({ day: d, today: key === todayKey, bookings: dayBookings })
  }
  return cells
})

/** Dernier jour occupé (une fin à minuit pile n'occupe pas le jour suivant). */
function endDay(b: Booking): string {
  return b.endAt.slice(11, 16) === '00:00' && b.endAt.slice(0, 10) > b.startAt.slice(0, 10)
    ? localDay(new Date(new Date(b.endAt).getTime() - 1000))
    : b.endAt.slice(0, 10)
}

/** AAAA-MM-JJ dans le fuseau du navigateur (toISOString serait en UTC). */
function localDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function chipTone(s: BookingStatus): string {
  return { OPTION: 'bg-attention-light text-attention', CONFIRMEE: 'bg-success-light text-success', REALISEE: 'bg-primary-light text-primary', DEMANDE: 'bg-slate-100 text-slate-600', ANNULEE: 'bg-error-light text-error' }[s]
}

function open(id: number) {
  router.push(`/dashboard/venue/bookings/${id}`)
}

watch([month, venueId, status], load)
onMounted(async () => {
  venues.value = await listVenues().catch(() => [])
  await load()
})
</script>
