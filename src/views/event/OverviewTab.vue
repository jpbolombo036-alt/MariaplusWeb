<template>
  <div>
    <div class="relative w-full h-[320px] rounded-xl overflow-hidden mb-6 shadow-sm border border-outline-variant/30 flex items-end">
      <div
        class="absolute inset-0 bg-cover bg-center"
        :style="heroBg ? { backgroundImage: `url(${heroBg})` } : undefined"
      ></div>
      <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

      <div class="relative z-10 w-full p-6 flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-3">
            <span class="px-3 py-1 rounded-full bg-primary-container text-white text-[10px] uppercase tracking-wider font-bold">{{ eventType }}</span>
            <span class="px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-[10px] uppercase tracking-wider font-bold flex items-center gap-1">
              <span class="material-symbols-outlined text-xs">check_circle</span> {{ statusLabel }}
            </span>
          </div>
          <h2 class="text-2xl md:text-3xl font-bold text-white">{{ eventDisplayName || 'Événement' }}</h2>
          <div v-if="stats" class="flex flex-wrap items-center gap-5 text-sm text-white/90">
            <span class="flex items-center gap-1.5"><span class="material-symbols-outlined text-sm">group</span> {{ stats.guests.total }} invités</span>
            <span class="flex items-center gap-1.5"><span class="material-symbols-outlined text-sm">how_to_reg</span> {{ stats.invitations.total }} invitations</span>
            <span class="flex items-center gap-1.5"><span class="material-symbols-outlined text-sm">person_check</span> {{ stats.attendance.checkedIn }} présents</span>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <PermGuard :allow="['WEDDING_UPDATE']">
            <button class="h-11 px-6 rounded-lg bg-white text-on-surface text-sm font-semibold flex items-center gap-2 hover:bg-white/90 shadow-sm">
              <span class="material-symbols-outlined text-base">edit</span> Modifier
            </button>
          </PermGuard>
          <PermGuard :allow="['WEDDING_PUBLISH']">
            <button class="h-11 px-6 rounded-lg bg-primary text-white text-sm font-semibold flex items-center gap-2 hover:opacity-90 shadow-sm" @click="publish">
              <span class="material-symbols-outlined text-base">publish</span> Publier
            </button>
          </PermGuard>
        </div>
      </div>
    </div>


    <div v-if="stats" class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div class="flex items-center justify-between mb-5">
        <div>
          <h3 class="text-[15px] font-bold text-slate-800">Aperçu de l'événement</h3>
          <p class="text-[13px] text-slate-500 mt-0.5">Statistiques et progression</p>
        </div>
        <button class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
          <span class="material-symbols-outlined text-[16px]">refresh</span> Actualiser
        </button>
      </div>

      <div class="grid grid-cols-12 gap-4">
      <div class="col-span-12 md:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between min-h-[160px]">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2 text-slate-500 text-sm"><span class="material-symbols-outlined text-base">group</span> Participation</div>
          <span class="text-xs font-semibold text-green-700 px-2 py-1 bg-green-50 rounded-md">{{ participationTotal }} acc.</span>
        </div>
        <div>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-bold text-slate-900">{{ stats.attendance.checkedIn }}</span>
            <span class="text-sm text-slate-500">/ {{ stats.attendance.expected }} attendus</span>
          </div>
          <div class="w-full bg-slate-200 h-2 rounded-full mt-3 overflow-hidden"><div class="bg-primary h-full rounded-full" :style="{ width: pctParticipation + '%' }"></div></div>
        </div>
      </div>

      <div class="col-span-12 md:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between min-h-[160px]">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2 text-slate-500 text-sm"><span class="material-symbols-outlined text-base">mail</span> Invitations</div>
          <span class="text-xs px-2 py-1 bg-red-50 text-red-700 rounded-md">{{ stats.invitations.pending }} en attente</span>
        </div>
        <div class="space-y-1">
          <div class="flex justify-between text-sm"><span class="text-slate-500">Acceptées</span><span class="font-semibold text-slate-900">{{ stats.invitations.accepted }}</span></div>
          <div class="flex justify-between text-sm"><span class="text-slate-500">Déclinées</span><span class="font-semibold text-slate-900">{{ stats.invitations.declined }}</span></div>
        </div>
      </div>

      <div class="col-span-12 md:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between min-h-[160px]">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2 text-slate-500 text-sm"><span class="material-symbols-outlined text-base">bar_chart</span> Statistiques</div>
        </div>
        <div>
          <div class="flex items-baseline gap-2"><span class="text-2xl font-bold text-slate-900">{{ pctRsvp }}%</span><span class="text-sm text-slate-500">de réponse</span></div>
          <div class="w-full bg-slate-200 h-2 rounded-full mt-3 overflow-hidden"><div class="bg-secondary h-full rounded-full" :style="{ width: pctRsvp + '%' }"></div></div>
        </div>
      </div>

      <div class="col-span-12 lg:col-span-8 bg-slate-50 border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden h-[320px]">
        <div class="px-5 py-4 border-b border-slate-200 bg-white flex justify-between items-center">
          <h3 class="font-semibold text-slate-800">Progression & Tables</h3>
          <router-link to="tables" class="text-primary text-sm hover:underline">Voir tout</router-link>
        </div>
        <div class="p-5 flex-1 grid grid-cols-2 gap-4">
          <div class="bg-white rounded-xl p-4 border border-slate-100"><span class="material-symbols-outlined text-slate-400">grid_view</span><div class="mt-2 text-xl font-bold text-slate-900">{{ stats.tables.total }}</div><div class="text-xs text-slate-500">Tables créées</div></div>
          <div class="bg-white rounded-xl p-4 border border-slate-100"><span class="material-symbols-outlined text-slate-400">group</span><div class="mt-2 text-xl font-bold text-slate-900">{{ stats.tables.assignedGuests }}/{{ stats.tables.capacity }}</div><div class="text-xs text-slate-500">Places occupées</div></div>
          <div class="bg-white rounded-xl p-4 border border-slate-100"><span class="material-symbols-outlined text-slate-400">percent</span><div class="mt-2 text-xl font-bold text-slate-900">{{ tableFillRate }}%</div><div class="text-xs text-slate-500">Taux de remplissage</div></div>
          <div class="bg-white rounded-xl p-4 border border-slate-100"><span class="material-symbols-outlined text-slate-400">event_seat</span><div class="mt-2 text-xl font-bold text-slate-900">{{ stats.tables.capacity }}</div><div class="text-xs text-slate-500">Capacité totale</div></div>
        </div>
      </div>

      <div class="col-span-12 lg:col-span-4 bg-slate-50 border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden h-[320px]">
        <div class="px-5 py-4 border-b border-slate-200 bg-white"><h3 class="font-semibold text-slate-800">Événements programmés</h3></div>
        <div class="flex-1 flex flex-col justify-center items-center p-5">
          <div class="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center mb-4 border border-slate-200"><span class="material-symbols-outlined text-slate-400 text-3xl">event</span></div>
          <p class="text-slate-500 text-center text-sm max-w-[200px]">Les cérémonies / événements programmés seront listés ici.</p>
        </div>
      </div>
    </div>
    </div>

    <p v-else-if="loading" class="text-slate-400">Chargement…</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getEvent, updateEventStatus, loadEventImage, absolutePhotoUrl, type Event } from '../../api/events'
import { getDashboard, type Dashboard } from '../../api/dashboard'
import PermGuard from '../../components/common/PermGuard.vue'

const route = useRoute()
const id = Number(route.params.id)

const stats = ref<Dashboard | null>(null)
const event = ref<Event | null>(null)
const loading = ref(true)

const eventDisplayName = computed(() => event.value?.weddingDetails?.displayName || event.value?.name || '')
const eventType = computed(() => event.value?.type || 'ÉVÉNEMENT')
const statusLabel = computed(() => (event.value?.status || 'DRAFT').toUpperCase())

/** Fond de la carte héros : photo du couple (mariage) sinon photo de couverture
 * (chargée via l'API authentifiée). Un seul carte photo pour tous les types. */
const coverUrl = ref<string | null>(null)
const heroBg = computed(() => {
  const couple = event.value?.weddingDetails?.couplePhotoUrl
  if (couple) return absolutePhotoUrl(couple)
  return coverUrl.value
})

const pctParticipation = computed(() => {
  const e = stats.value?.attendance.expected ?? 0
  return e > 0 ? Math.round(((stats.value?.attendance.checkedIn ?? 0) / e) * 100) : 0
})
const pctRsvp = computed(() => Math.round(stats.value?.invitations.responseRate ?? 0))
const participationTotal = computed(() => stats.value?.invitations.accepted ?? 0)
const tableFillRate = computed(() => {
  const c = stats.value?.tables.capacity ?? 0
  return c > 0 ? Math.round(((stats.value?.tables.assignedGuests ?? 0) / c) * 100) : 0
})

onMounted(async () => {
  try {
    const [w, d] = await Promise.all([getEvent(id), getDashboard(id)])
    event.value = w
    stats.value = d
    // Couverture (fallback du héros quand il n'y a pas de photo du couple)
    if (w?.hasImage && !w?.weddingDetails?.couplePhotoUrl) {
      try {
        coverUrl.value = await loadEventImage(id)
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* valeurs par défaut */
  } finally {
    loading.value = false
  }
})

async function publish() {
  try {
    event.value = await updateEventStatus(id, 'PUBLISHED')
  } catch {
    /* ignoré */
  }
}
</script>

