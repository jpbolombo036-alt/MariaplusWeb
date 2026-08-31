<template>
  <div>
    <!-- En-tête style Prosoc -->
    <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-5">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 class="text-[22px] font-bold text-slate-900 tracking-tight">Réponses RSVP</h2>
          <p class="text-[13px] text-slate-500 mt-0.5 font-medium">{{ rows.length }} réponse(s)</p>
        </div>
      </div>
    </div>

    <!-- Recherche style Prosoc -->
    <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-5">
      <div class="flex items-center gap-3">
        <select v-model="statusFilter" class="h-11 px-3 rounded-lg border border-slate-200 bg-white text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-slate-700 transition-all">
          <option value="">Tous les statuts</option>
          <option value="ACCEPTED">Accepté</option>
          <option value="DECLINED">Décliné</option>
          <option value="PENDING">En attente</option>
        </select>
        <div class="flex-1 relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <span class="material-symbols-outlined text-[20px]">search</span>
          </span>
          <input v-model="query" placeholder="Rechercher…" class="h-11 pl-10 pr-4 rounded-lg border border-slate-200 bg-white text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 w-full transition-all" />
        </div>
        <button class="h-11 px-5 rounded-lg bg-primary text-white text-[13px] font-semibold inline-flex items-center gap-2 shadow-sm shadow-primary/20 hover:bg-primary-dark transition-all">
          <span class="material-symbols-outlined text-[18px]">search</span>
          <span class="hidden sm:inline">Rechercher</span>
        </button>
      </div>
    </div>

    <!-- Cartes synthèse -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Total</div>
          <div class="text-2xl font-bold text-slate-900 mt-1">{{ rows.length }}</div>
        </div>
        <div class="bg-green-50 border border-green-100 rounded-xl p-4">
          <div class="text-[11px] font-bold text-green-700 uppercase tracking-wide">Acceptés</div>
          <div class="text-2xl font-bold text-green-700 mt-1">{{ countBy('ACCEPTED') }}</div>
        </div>
        <div class="bg-red-50 border border-red-100 rounded-xl p-4">
          <div class="text-[11px] font-bold text-red-700 uppercase tracking-wide">Déclinés</div>
          <div class="text-2xl font-bold text-red-700 mt-1">{{ countBy('DECLINED') }}</div>
        </div>
        <div class="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <div class="text-[11px] font-bold text-amber-700 uppercase tracking-wide">En attente</div>
          <div class="text-2xl font-bold text-amber-600 mt-1">{{ countBy('PENDING') }}</div>
        </div>
      </div>

    <p v-if="loading" class="text-on-surface-variant">Chargement…</p>
    <div v-else-if="filtered.length === 0" class="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl p-10 text-center text-on-surface-variant">
      Aucune réponse pour l'instant.
    </div>
    <!-- Desktop : tableau -->
    <div v-else class="hidden md:block bg-surface-container-lowest border border-outline-variant/50 rounded-2xl overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-surface-container text-left text-on-surface-variant">
          <tr>
            <th class="px-5 py-3.5">Invité</th>
            <th class="px-5 py-3.5">Statut</th>
            <th class="px-5 py-3.5">Personnes</th>
            <th class="px-5 py-3.5">Répondu le</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-outline-variant text-on-surface">
          <tr v-for="r in filtered" :key="r.invitationId" class="hover:bg-surface-container/40">
            <td class="px-5 py-3.5">
              <div class="flex items-center gap-3">
                <span class="w-8 h-8 rounded-lg grid place-items-center text-xs font-bold text-white shrink-0" :style="{ background: avatarColor(r.guestId) }">{{ guestInitials(r) }}</span>
                <span>{{ guestName(r) }}</span>
              </div>
            </td>
            <td class="px-5 py-3.5"><StatusBadge :status="r.status || 'PENDING'" /></td>
            <td class="px-5 py-3.5">{{ r.numberOfAttendees ?? 0 }}</td>
            <td class="px-5 py-3.5 text-on-surface-variant">{{ r.respondedAt ? formatDate(r.respondedAt) : '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile : cartes -->
    <div v-if="!loading && filtered.length > 0" class="md:hidden space-y-3">
      <div
        v-for="r in filtered"
        :key="r.invitationId"
        class="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-4"
      >
        <!-- En-tête : avatar + nom + statut -->
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-3 min-w-0">
            <span class="w-10 h-10 rounded-lg grid place-items-center text-sm font-bold text-white shrink-0" :style="{ background: avatarColor(r.guestId) }">{{ guestInitials(r) }}</span>
            <p class="font-semibold text-on-surface truncate">{{ guestName(r) }}</p>
          </div>
          <StatusBadge :status="r.status || 'PENDING'" />
        </div>

        <!-- Infos -->
        <div class="flex items-center gap-4 text-xs text-on-surface-variant">
          <span class="inline-flex items-center gap-1">
            <span class="material-symbols-outlined text-[14px]">group</span>
            {{ r.numberOfAttendees ?? 0 }} personne(s)
          </span>
          <span class="inline-flex items-center gap-1">
            <span class="material-symbols-outlined text-[14px]">schedule</span>
            {{ r.respondedAt ? formatDate(r.respondedAt) : 'Pas encore répondu' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { listRsvps, type RsvpRow } from '../../api/rsvp'
import { listGuests, type Guest } from '../../api/guests'
import StatusBadge from '../../components/common/StatusBadge.vue'

const route = useRoute()
const id = Number(route.params.id)
const rows = ref<RsvpRow[]>([])
const guests = ref<Guest[]>([])
const loading = ref(true)
const query = ref('')
const statusFilter = ref('')

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  const st = statusFilter.value
  return rows.value.filter((r) => {
    if (st && (r.status ?? 'PENDING') !== st) return false
    if (q && !guestName(r).toLowerCase().includes(q)) return false
    return true
  })
})

const guestName = (r: RsvpRow) => {
  const g = guests.value.find((x) => x.id === r.guestId)
  return g ? `${g.firstName} ${g.lastName}` : `#${r.guestId}`
}
const guestInitials = (r: RsvpRow) => {
  const g = guests.value.find((x) => x.id === r.guestId)
  return g ? `${g.firstName.charAt(0)}${g.lastName.charAt(0)}`.toUpperCase() : '?'
}
const avatarPalette = ['#5b2ecc', '#176b5b', '#f4a340', '#1f2937', '#7c3aed', '#0e7490']
const avatarColor = (n: number) => avatarPalette[n % avatarPalette.length]

const countBy = (s: string) => rows.value.filter((r) => (r.status ?? 'PENDING') === s).length

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

onMounted(load)
async function load() {
  try {
    const [r, g] = await Promise.all([listRsvps(id), listGuests(id)])
    rows.value = r
    guests.value = g
  } finally {
    loading.value = false
  }
}
</script>
