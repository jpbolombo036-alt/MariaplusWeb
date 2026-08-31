<template>
  <div>
    <!-- En-tête style Prosoc -->
    <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-5">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 class="text-[22px] font-bold text-slate-900 tracking-tight">Événements internes</h2>
          <p class="text-[13px] text-slate-500 mt-0.5 font-medium">Cérémonies, réception et temps forts de votre événement.</p>
        </div>
        <PermGuard :allow="['EVENT_CREATE']">
          <button
            class="h-10 px-5 rounded-lg bg-primary text-white text-[13px] font-semibold inline-flex items-center gap-2 shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all"
            @click="$router.push(`/dashboard/events/${id}/internal-events/new`)"
          >
            <span class="material-symbols-outlined text-[18px]">add</span> Ajouter un événement
          </button>
        </PermGuard>
      </div>
    </div>

    <!-- Recherche style Prosoc -->
    <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-5">
      <div class="flex items-center gap-3">
        <div class="flex-1 relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <span class="material-symbols-outlined text-[20px]">search</span>
          </span>
          <input v-model="query" placeholder="Rechercher un événement..." class="h-11 pl-10 pr-4 rounded-lg border border-slate-200 bg-white text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 w-full transition-all" />
        </div>
        <button class="h-11 px-5 rounded-lg bg-primary text-white text-[13px] font-semibold inline-flex items-center gap-2 shadow-sm shadow-primary/20 hover:bg-primary-dark transition-all">
          <span class="material-symbols-outlined text-[18px]">search</span>
          <span class="hidden sm:inline">Rechercher</span>
        </button>
      </div>
    </div>

    <p v-if="loading" class="text-on-surface-variant">Chargement…</p>

    <div v-else-if="items.length === 0" class="bg-white border border-slate-200 rounded-xl p-10 text-center">
      <div class="w-16 h-16 mx-auto rounded-lg bg-slate-50 grid place-items-center mb-4 ring-1 ring-slate-100">
        <span class="material-symbols-outlined text-3xl text-slate-300">event</span>
      </div>
      <h3 class="font-semibold text-on-surface">Aucun événement programmé</h3>
      <p class="text-sm text-on-surface-variant mt-1 max-w-xs mx-auto">Ajoutez votre première cérémonie ou réception pour structurer le déroulé de la journée.</p>
    </div>

    <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="e in filtered"
        :key="e.id"
        class="group bg-surface-container-lowest border border-outline-variant/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-card hover:-translate-y-0.5 transition-all duration-300"
      >
        <div class="h-24 relative overflow-hidden" :style="{ background: typeGradient(e.type) }">
          <div class="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent"></div>
          <div class="relative flex h-full items-start justify-between p-4">
            <span class="px-2.5 py-1 rounded-md bg-white/20 backdrop-blur text-white text-[10px] uppercase tracking-wider font-bold">{{ typeLabel(e.type) }}</span>
            <PermGuard :allow="['EVENT_DELETE']">
              <button class="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/30 text-white grid place-items-center backdrop-blur transition" @click="remove(e)" :title="'Supprimer ' + e.name">
                <span class="material-symbols-outlined text-base">delete</span>
              </button>
            </PermGuard>
          </div>
          <div v-if="e.eventDate" class="absolute bottom-3 left-4 flex items-center gap-2.5 text-white">
            <span class="w-11 rounded-lg bg-white text-primary text-center py-1 shadow-md leading-none">
              <span class="block text-sm font-extrabold">{{ dayOf(e.eventDate) }}</span>
              <span class="block text-[9px] font-bold uppercase">{{ monthOf(e.eventDate) }}</span>
            </span>
            <div class="text-sm font-semibold drop-shadow">{{ e.venueName || 'Programmé' }}</div>
          </div>
        </div>

        <div class="p-5">
          <h3 class="font-bold text-on-surface text-base leading-snug">{{ e.name }}</h3>
          <p v-if="e.description" class="mt-1.5 text-sm text-on-surface-variant line-clamp-2">{{ e.description }}</p>
          <div class="mt-4 space-y-2 text-sm text-on-surface-variant">
            <div v-if="e.eventDate" class="flex items-center gap-2">
              <span class="material-symbols-outlined text-base">calendar_today</span>
              <span>{{ formatDate(e.eventDate) }}<template v-if="e.startTime"> · {{ e.startTime }}</template></span>
            </div>
            <div v-if="e.venueName" class="flex items-center gap-2">
              <span class="material-symbols-outlined text-base">place</span>
              <span>{{ [e.venueName, e.city].filter(Boolean).join(', ') }}</span>
            </div>
            <div v-if="e.endTime" class="flex items-center gap-2">
              <span class="material-symbols-outlined text-base">schedule</span>
              <span>Jusqu'à {{ e.endTime }}</span>
            </div>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { listWeddingEvents, deleteWeddingEvent, type WeddingEventItem } from '../../api/weddingEvents'
import PermGuard from '../../components/common/PermGuard.vue'

const route = useRoute()
const id = Number(route.params.id)
const items = ref<WeddingEventItem[]>([])
const loading = ref(true)
const query = ref('')

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return sorted.value
  return sorted.value.filter((e) => e.name.toLowerCase().includes(q) || (e.venueName ?? '').toLowerCase().includes(q))
})

const types = [
  { value: 'CIVIL_CEREMONY', label: 'Cérémonie civile' },
  { value: 'RELIGIOUS_CEREMONY', label: 'Cérémonie religieuse' },
  { value: 'RECEPTION', label: 'Réception' },
  { value: 'AFTER_PARTY', label: 'After party' },
  { value: 'OTHER', label: 'Autre' },
]

const typeLabel = (t: string) => types.find((x) => x.value === t)?.label ?? t
const typeGradient = (t: string) => {
  const map: Record<string, string> = {
    CIVIL_CEREMONY: 'linear-gradient(135deg,#5b2ecc,#8b5cf6)',
    RELIGIOUS_CEREMONY: 'linear-gradient(135deg,#176b5b,#2dd4a7)',
    RECEPTION: 'linear-gradient(135deg,#f4a340,#fbbf24)',
    AFTER_PARTY: 'linear-gradient(135deg,#1f2937,#4b5563)',
    OTHER: 'linear-gradient(135deg,#5b2ecc,#7c3aed)',
  }
  return map[t] ?? 'linear-gradient(135deg,#5b2ecc,#7c3aed)'
}

const sorted = computed(() =>
  [...items.value].sort((a, b) => {
    const da = a.eventDate ? new Date(a.eventDate).getTime() : 0
    const db = b.eventDate ? new Date(b.eventDate).getTime() : 0
    return da - db || (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
  }),
)

function dayOf(d: string): string {
  const dt = new Date(d)
  return String(dt.getDate()).padStart(2, '0')
}
function monthOf(d: string): string {
  return new Date(d).toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')
}
function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

onMounted(load)
async function load() {
  try {
    items.value = await listWeddingEvents(id)
  } finally {
    loading.value = false
  }
}
async function remove(e: WeddingEventItem) {
  if (!confirm(`Supprimer l'événement « ${e.name} » ?`)) return
  await deleteWeddingEvent(id, e.id)
  items.value = items.value.filter((x) => x.id !== e.id)
}
</script>

<style scoped>
.input { @apply block w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest outline-none focus:border-primary text-on-surface; }
</style>
