<template>
  <div>
    <!-- En-tête + synthèse -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h2 class="text-xl font-bold text-on-surface">Réponses RSVP</h2>
        <p class="text-sm text-on-surface-variant mt-0.5">{{ rows.length }} réponse(s)</p>
      </div>
      <div class="flex items-center gap-2">
        <select v-model="statusFilter" class="h-10 px-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm outline-none focus:border-primary">
          <option value="">Tous les statuts</option>
          <option value="ACCEPTED">Accepté</option>
          <option value="DECLINED">Décliné</option>
          <option value="PENDING">En attente</option>
        </select>
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"><span class="material-symbols-outlined text-lg">search</span></span>
          <input v-model="query" placeholder="Rechercher…" class="h-10 pl-10 pr-4 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm outline-none focus:border-primary w-52" />
        </div>
      </div>
    </div>

    <!-- Cartes synthèse -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl p-4">
        <div class="text-xs text-on-surface-variant">Total</div>
        <div class="text-2xl font-bold text-on-surface mt-1">{{ rows.length }}</div>
      </div>
      <div class="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl p-4">
        <div class="text-xs text-on-surface-variant">Acceptés</div>
        <div class="text-2xl font-bold text-secondary mt-1">{{ countBy('ACCEPTED') }}</div>
      </div>
      <div class="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl p-4">
        <div class="text-xs text-on-surface-variant">Déclinés</div>
        <div class="text-2xl font-bold text-error mt-1">{{ countBy('DECLINED') }}</div>
      </div>
      <div class="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl p-4">
        <div class="text-xs text-on-surface-variant">En attente</div>
        <div class="text-2xl font-bold text-amber-500 mt-1">{{ countBy('PENDING') }}</div>
      </div>
    </div>

    <p v-if="loading" class="text-on-surface-variant">Chargement…</p>
    <div v-else-if="filtered.length === 0" class="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl p-10 text-center text-on-surface-variant">
      Aucune réponse pour l'instant.
    </div>
    <div v-else class="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl overflow-hidden">
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
                <span class="w-8 h-8 rounded-full grid place-items-center text-xs font-bold text-white shrink-0" :style="{ background: avatarColor(r.guestId) }">{{ guestInitials(r) }}</span>
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
