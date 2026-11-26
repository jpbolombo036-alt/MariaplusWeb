<template>
  <div>
    <VenuePageHeader title="Ma salle" subtitle="Encaissements, impayés et occupation de vos salles.">
      <input v-model="month" type="month" class="v-input !w-auto" aria-label="Mois" />
      <select v-model="venueId" class="v-input !w-auto" aria-label="Salle">
        <option :value="undefined">Toutes les salles</option>
        <option v-for="v in venues" :key="v.id" :value="v.id">{{ v.name }}</option>
      </select>
      <button class="v-btn" :disabled="exporting" @click="exportXlsx">
        <span class="material-symbols-outlined text-[18px]">download</span>
        Export Excel
      </button>
      <router-link v-if="auth.can([Perm.bookingManage])" to="/dashboard/venue/bookings/new" class="v-btn-primary">
        <span class="material-symbols-outlined text-[18px]">add</span>
        Nouvelle réservation
      </router-link>
    </VenuePageHeader>

    <div v-if="loading && !dash" class="py-16 text-center text-slate-400 text-sm">Chargement…</div>

    <template v-else-if="dash">
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div class="v-card p-5">
          <p class="text-[12px] font-semibold text-slate-500">Encaissé ce mois</p>
          <p v-for="c in dash.collected" :key="c.currency" class="text-xl font-bold text-slate-900 mt-1">{{ formatMoney(c.amount, c.currency) }}</p>
          <p v-if="!dash.collected.length" class="text-xl font-bold text-slate-900 mt-1">0</p>
        </div>
        <div class="v-card p-5">
          <p class="text-[12px] font-semibold text-slate-500">Reste à encaisser (toutes dates)</p>
          <p v-for="c in dash.outstanding" :key="c.currency" class="text-xl font-bold text-error mt-1">{{ formatMoney(c.amount, c.currency) }}</p>
          <p v-if="!dash.outstanding.length" class="text-xl font-bold text-success mt-1">Aucun impayé</p>
        </div>
        <div class="v-card p-5">
          <p class="text-[12px] font-semibold text-slate-500">Réservé ce mois (confirmé)</p>
          <p v-for="c in dash.bookedValue" :key="c.currency" class="text-xl font-bold text-slate-900 mt-1">{{ formatMoney(c.amount, c.currency) }}</p>
          <p v-if="!dash.bookedValue.length" class="text-xl font-bold text-slate-900 mt-1">0</p>
        </div>
        <div class="v-card p-5">
          <p class="text-[12px] font-semibold text-slate-500">Taux d'occupation</p>
          <p class="text-xl font-bold text-slate-900 mt-1">{{ dash.occupancyRate.toLocaleString('fr-FR') }} %</p>
          <p class="text-[12px] text-slate-500 mt-1">{{ dash.occupiedVenueDays }} jour(s) occupé(s) sur {{ dash.availableVenueDays }}</p>
          <div class="h-2 rounded-full bg-slate-100 mt-3 overflow-hidden">
            <div class="h-full bg-primary rounded-full" :style="{ width: Math.min(dash.occupancyRate, 100) + '%' }" />
          </div>
        </div>
      </div>

      <div class="v-card p-5 mb-6">
        <p class="text-[13px] font-bold text-slate-900 mb-3">Réservations du mois par statut</p>
        <div class="flex flex-wrap gap-2">
          <span v-for="(count, status) in dash.bookingsByStatus" :key="status" class="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
            <BookingStatusBadge :status="status" />
            <span class="text-[14px] font-bold text-slate-900">{{ count }}</span>
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div class="v-card">
          <div class="px-5 pt-5 pb-3 flex items-center justify-between">
            <h2 class="text-[16px] font-bold text-slate-900">Impayés</h2>
            <span class="text-[12px] text-slate-500">{{ dash.unpaid.length }} réservation(s)</span>
          </div>
          <p v-if="!dash.unpaid.length" class="px-5 pb-6 text-sm text-slate-500">Toutes les réservations confirmées sont réglées.</p>
          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead><tr class="bg-slate-50/80"><th class="v-th">Date</th><th class="v-th">Client</th><th class="v-th text-right">Reste</th></tr></thead>
              <tbody>
                <tr v-for="b in dash.unpaid" :key="b.id" class="border-t border-slate-100 hover:bg-primary-light/30 cursor-pointer" @click="open(b.id)">
                  <td class="v-td">{{ formatDateTime(b.startAt) }}<div class="text-[11px] text-slate-400">{{ b.venueName }}</div></td>
                  <td class="v-td">{{ b.clientName }}<div class="text-[11px] text-slate-400">{{ b.clientPhone }}</div></td>
                  <td class="v-td text-right font-semibold text-error whitespace-nowrap">{{ formatMoney(b.balance, b.currency) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="v-card">
          <div class="px-5 pt-5 pb-3 flex items-center justify-between">
            <h2 class="text-[16px] font-bold text-slate-900">À venir (30 jours)</h2>
            <router-link to="/dashboard/venue/bookings" class="text-[12px] font-semibold text-primary">Tout voir</router-link>
          </div>
          <p v-if="!dash.upcoming.length" class="px-5 pb-6 text-sm text-slate-500">Aucune réservation dans les 30 prochains jours.</p>
          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead><tr class="bg-slate-50/80"><th class="v-th">Date</th><th class="v-th">Client</th><th class="v-th">Statut</th></tr></thead>
              <tbody>
                <tr v-for="b in dash.upcoming" :key="b.id" class="border-t border-slate-100 hover:bg-primary-light/30 cursor-pointer" @click="open(b.id)">
                  <td class="v-td">{{ formatDateTime(b.startAt) }}<div class="text-[11px] text-slate-400">{{ b.venueName }}</div></td>
                  <td class="v-td">{{ b.clientName }}<div class="text-[11px] text-slate-400">{{ b.title }}</div></td>
                  <td class="v-td"><BookingStatusBadge :status="b.status" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>

    <div v-else-if="!auth.can([Perm.venueReportView])" class="v-card py-14 text-center">
      <p class="font-semibold text-slate-900">Rapports réservés au gérant</p>
      <router-link to="/dashboard/venue/bookings" class="v-btn-primary mt-4">Voir les réservations</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import VenuePageHeader from '../../components/venue/VenuePageHeader.vue'
import BookingStatusBadge from '../../components/venue/BookingStatusBadge.vue'
import { useAuthStore } from '../../stores/auth'
import { Perm } from '../../permissions'
import {
  downloadVenueExport, formatDateTime, formatMoney, getVenueDashboard, listVenues,
  type Venue, type VenueDashboard,
} from '../../api/venues'

const auth = useAuthStore()
const router = useRouter()
const now = new Date()
const month = ref(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
const venueId = ref<number | undefined>(undefined)
const venues = ref<Venue[]>([])
const dash = ref<VenueDashboard | null>(null)
const loading = ref(false)
const exporting = ref(false)

function period() {
  const [y, m] = month.value.split('-').map(Number)
  const last = new Date(y, m, 0).getDate()
  return { from: `${month.value}-01`, to: `${month.value}-${String(last).padStart(2, '0')}` }
}

async function load() {
  if (!auth.can([Perm.venueReportView])) return
  loading.value = true
  try {
    dash.value = await getVenueDashboard({ ...period(), venueId: venueId.value })
  } finally {
    loading.value = false
  }
}

async function exportXlsx() {
  exporting.value = true
  try {
    await downloadVenueExport(period())
  } finally {
    exporting.value = false
  }
}

function open(id: number) {
  router.push(`/dashboard/venue/bookings/${id}`)
}

watch([month, venueId], load)
onMounted(async () => {
  if (auth.can([Perm.venueView])) venues.value = await listVenues().catch(() => [])
  await load()
})
</script>
