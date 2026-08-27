<template>
  <div>
    <div class="relative w-full h-[320px] rounded-xl overflow-hidden mb-6 shadow-sm border border-outline-variant/30 flex items-end">
      <div
        class="absolute inset-0 bg-cover bg-center"
        :style="event?.couplePhotoUrl ? { backgroundImage: `url(${event.couplePhotoUrl})` } : undefined"
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


    <div v-if="stats" class="grid grid-cols-12 gap-6">
      <div class="col-span-12 md:col-span-4 bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-5 shadow-sm flex flex-col justify-between min-h-[160px]">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2 text-on-surface-variant text-sm"><span class="material-symbols-outlined text-base">group</span> Participation</div>
          <span class="text-xs font-semibold text-secondary px-2 py-1 bg-secondary-container/20 rounded-md">{{ participationTotal }} acc.</span>
        </div>
        <div>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-bold text-on-surface">{{ stats.attendance.checkedIn }}</span>
            <span class="text-sm text-on-surface-variant">/ {{ stats.attendance.expected }} attendus</span>
          </div>
          <div class="w-full bg-surface-variant h-2 rounded-full mt-3 overflow-hidden"><div class="bg-primary h-full rounded-full" :style="{ width: pctParticipation + '%' }"></div></div>
        </div>
      </div>

      <div class="col-span-12 md:col-span-4 bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-5 shadow-sm flex flex-col justify-between min-h-[160px]">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2 text-on-surface-variant text-sm"><span class="material-symbols-outlined text-base">mail</span> Invitations</div>
          <span class="text-xs px-2 py-1 bg-error/10 text-error rounded-md">{{ stats.invitations.pending }} en attente</span>
        </div>
        <div class="space-y-1">
          <div class="flex justify-between text-sm"><span class="text-on-surface-variant">Acceptées</span><span class="font-semibold text-on-surface">{{ stats.invitations.accepted }}</span></div>
          <div class="flex justify-between text-sm"><span class="text-on-surface-variant">Déclinées</span><span class="font-semibold text-on-surface">{{ stats.invitations.declined }}</span></div>
        </div>
      </div>

      <div class="col-span-12 md:col-span-4 bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-5 shadow-sm flex flex-col justify-between min-h-[160px]">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2 text-on-surface-variant text-sm"><span class="material-symbols-outlined text-base">bar_chart</span> Statistiques</div>
        </div>
        <div>
          <div class="flex items-baseline gap-2"><span class="text-2xl font-bold text-on-surface">{{ pctRsvp }}%</span><span class="text-sm text-on-surface-variant">de réponse</span></div>
          <div class="w-full bg-surface-variant h-2 rounded-full mt-3 overflow-hidden"><div class="bg-secondary h-full rounded-full" :style="{ width: pctRsvp + '%' }"></div></div>
        </div>
      </div>

      <div class="col-span-12 lg:col-span-8 bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-sm flex flex-col overflow-hidden h-[320px]">
        <div class="px-5 py-4 border-b border-outline-variant/20 bg-surface flex justify-between items-center">
          <h3 class="font-semibold text-on-surface">Progression & Tables</h3>
          <router-link to="tables" class="text-primary text-sm hover:underline">Voir tout</router-link>
        </div>
        <div class="p-5 flex-1 grid grid-cols-2 gap-4">
          <div class="bg-surface-container-low rounded-xl p-4"><span class="material-symbols-outlined text-on-surface-variant">grid_view</span><div class="mt-2 text-xl font-bold text-on-surface">{{ stats.tables.total }}</div><div class="text-xs text-on-surface-variant">Tables créées</div></div>
          <div class="bg-surface-container-low rounded-xl p-4"><span class="material-symbols-outlined text-on-surface-variant">group</span><div class="mt-2 text-xl font-bold text-on-surface">{{ stats.tables.assignedGuests }}/{{ stats.tables.capacity }}</div><div class="text-xs text-on-surface-variant">Places occupées</div></div>
          <div class="bg-surface-container-low rounded-xl p-4"><span class="material-symbols-outlined text-on-surface-variant">percent</span><div class="mt-2 text-xl font-bold text-on-surface">{{ tableFillRate }}%</div><div class="text-xs text-on-surface-variant">Taux de remplissage</div></div>
          <div class="bg-surface-container-low rounded-xl p-4"><span class="material-symbols-outlined text-on-surface-variant">event_seat</span><div class="mt-2 text-xl font-bold text-on-surface">{{ stats.tables.capacity }}</div><div class="text-xs text-on-surface-variant">Capacité totale</div></div>
        </div>
      </div>

      <div class="col-span-12 lg:col-span-4 bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-sm flex flex-col overflow-hidden h-[320px]">
        <div class="px-5 py-4 border-b border-outline-variant/20 bg-surface"><h3 class="font-semibold text-on-surface">Événements programmés</h3></div>
        <div class="flex-1 flex flex-col justify-center items-center p-5">
          <div class="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center mb-4 border border-outline-variant/30"><span class="material-symbols-outlined text-outline text-3xl">event</span></div>
          <p class="text-on-surface-variant text-center text-sm max-w-[200px]">Les cérémonies / événements programmés seront listés ici.</p>
        </div>
      </div>
    </div>

    <p v-else-if="loading" class="text-on-surface-variant">Chargement…</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getWedding, updateWeddingStatus, type Wedding } from '../../api/weddings'
import { getDashboard, type Dashboard } from '../../api/dashboard'
import PermGuard from '../../components/common/PermGuard.vue'

const route = useRoute()
const id = Number(route.params.id)

const stats = ref<Dashboard | null>(null)
const event = ref<Wedding | null>(null)
const loading = ref(true)

const eventDisplayName = computed(() => event.value?.displayName || '')
const eventType = computed(() => (event.value ? 'Mariage' : 'Événement'))
const statusLabel = computed(() => (event.value?.status || 'DRAFT').toUpperCase())

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
    const [w, d] = await Promise.all([getWedding(id), getDashboard(id)])
    event.value = w
    stats.value = d
  } catch {
    /* valeurs par défaut */
  } finally {
    loading.value = false
  }
})

async function publish() {
  try {
    event.value = await updateWeddingStatus(id, 'PUBLISHED')
  } catch {
    /* ignoré */
  }
}
</script>

