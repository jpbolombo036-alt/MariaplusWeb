<template>
  <div>
    <!-- En-tête style Prosoc -->
    <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 class="text-[22px] font-bold text-slate-900 tracking-tight">Mes Événements</h1>
          <p class="text-[13px] text-slate-500 mt-0.5 font-medium">Gérez et suivez tous vos événements en un seul endroit.</p>
        </div>
        <div class="flex items-center gap-3">
          <button @click="$router.push({name:'events-new'})" class="h-10 px-5 rounded-lg bg-primary text-white text-[13px] font-semibold inline-flex items-center gap-2 shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all">
            <span class="material-symbols-outlined text-[18px]">add</span> Nouvel événement
          </button>
        </div>
      </div>
    </div>

    <!-- 4 cartes statistiques -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      <div v-for="s in statCards" :key="s.label" class="bg-white border border-slate-200 rounded-2xl p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition-all">
        <span class="w-14 h-14 rounded-lg grid place-items-center shrink-0" :style="{ background: s.bg, color: s.color }">
          <span class="material-symbols-outlined text-[26px]">{{ s.icon }}</span>
        </span>
        <div>
          <div class="text-[13px] text-slate-500 font-medium">{{ s.label }}</div>
          <div class="text-[24px] font-bold text-slate-900 mt-0.5">{{ s.value }}</div>
          <div class="text-[13px] text-slate-400 mt-0.5">{{ s.sub }}</div>
        </div>
      </div>
    </div>

    <p v-if="loading" class="text-slate-400 py-16 text-center text-sm">Chargement…</p>
    <p v-else-if="error" class="text-error py-16 text-center text-sm">{{ error }}</p>
    <!-- Liste en tableau -->
    <div v-else class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div class="px-6 pt-6 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 class="text-[18px] font-bold text-slate-900">Liste de vos événements</h2>
        <div class="flex items-center gap-3">
          <button class="h-[42px] px-4 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 inline-flex items-center gap-2 hover:bg-slate-50 transition-colors">
            <span class="material-symbols-outlined text-[18px]">filter_list</span> Tous les statuts
            <span class="material-symbols-outlined text-[18px]">expand_more</span>
          </button>
          <button @click="sortDateAsc = !sortDateAsc" class="h-[42px] px-4 rounded-lg bg-primary text-white text-sm font-semibold inline-flex items-center gap-2 shadow-sm shadow-primary/20 hover:bg-primary-dark transition-all">
            <span class="material-symbols-outlined text-[18px]">{{ sortDateAsc ? 'calendar_month' : 'calendar_today' }}</span>
            {{ sortDateAsc ? 'Trier du plus ancien' : 'Trier par date' }}
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-slate-50/80 text-left text-[13px] font-semibold text-slate-500">
              <th class="px-6 py-3.5">Événement</th>
              <th class="px-6 py-3.5">Date &amp; Heure</th>
              <th class="px-6 py-3.5">Lieu</th>
              <th class="px-6 py-3.5">Statut</th>
              <th class="px-6 py-3.5">Invités</th>
              <th class="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="ev in paginated" :key="ev.id" class="hover:bg-slate-50/80 transition-colors">
              <!-- Événement -->
              <td class="px-6 py-4">
                <router-link :to="`/dashboard/events/${ev.id}`" class="flex items-center gap-4 group/ev">
                  <div class="w-[125px] h-[78px] rounded-lg overflow-hidden shrink-0">
                    <img v-if="imageUrls[ev.id] || ev.weddingDetails?.couplePhotoUrl" :src="imageUrls[ev.id] || ev.weddingDetails?.couplePhotoUrl || undefined" class="w-full h-full object-cover group-hover/ev:scale-105 transition-transform duration-300" alt="" />
                    <div v-else class="w-full h-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                      <span class="material-symbols-outlined text-2xl text-white/50">favorite</span>
                    </div>
                  </div>
                  <div>
                    <div class="text-[16px] font-semibold text-slate-700 group-hover/ev:text-primary transition-colors">{{ ev.weddingDetails?.displayName || ev.name || 'Sans nom' }}</div>
                    <div class="text-[12px] font-bold text-primary tracking-wide">• {{ ev.type }}</div>
                  </div>
                </router-link>
              </td>
              <!-- Date & heure -->
              <td class="px-6 py-4">
                <div class="flex items-center gap-2 text-[14px] text-slate-600"><span class="material-symbols-outlined text-[18px] text-slate-400">calendar_today</span> {{ dateLabel(ev) }}</div>
                <div class="flex items-center gap-2 text-[14px] text-slate-400 mt-2"><span class="material-symbols-outlined text-[18px] text-slate-400">schedule</span> —</div>
              </td>
              <!-- Lieu -->
              <td class="px-6 py-4">
                <div class="flex items-start gap-2 text-[14px] text-slate-600">
                  <span class="material-symbols-outlined text-[18px] text-slate-400">place</span>
                  <span>Non renseigné</span>
                </div>
              </td>
              <!-- Statut -->
              <td class="px-6 py-4"><StatusBadge :status="ev.status" /></td>
              <!-- Invités -->
              <td class="px-6 py-4">
                <div class="text-[16px] font-semibold text-slate-700">—</div>
                <div class="text-[13px] text-slate-400">Invités attendus</div>
              </td>
              <!-- Actions -->
              <td class="px-6 py-4 text-right">
                <router-link to="#" @click.prevent="goDetail(ev)" class="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors" title="Voir les détails"><span class="material-symbols-outlined text-[20px]">more_vert</span></router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-slate-100">
        <div class="text-[13px] text-slate-500 font-medium">Affichage 1 - {{ filtered.length }} sur {{ filtered.length }} événements</div>
        <div class="flex items-center gap-2">
          <button class="w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-700 inline-flex items-center justify-center hover:bg-slate-50 transition-colors"><span class="material-symbols-outlined text-[18px]">chevron_left</span></button>
          <button class="w-9 h-9 rounded-lg bg-primary text-white inline-flex items-center justify-center text-sm font-semibold shadow-sm shadow-primary/20">1</button>
          <button class="w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-700 inline-flex items-center justify-center hover:bg-slate-50 transition-colors"><span class="material-symbols-outlined text-[18px]">chevron_right</span></button>
        </div>
      </div>
    </div>

    <CreateEventDialog v-if="createOpen" @close="createOpen = false" @created="onCreated" />
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { listEvents, loadEventImage, type Event } from '../api/events'
import PermGuard from '../components/common/PermGuard.vue'
import StatusBadge from '../components/common/StatusBadge.vue'
import CreateEventDialog from '../components/events/CreateEventDialog.vue'

const router = useRouter()
const route = useRoute()
const events = ref<Event[]>([])
const loading = ref(true)
const error = ref('')
const createOpen = ref(false)
const query = ref('')
const statusFilter = ref('')
const imageUrls = reactive<Record<number, string>>({})

if (route.query.new === '1') {
  createOpen.value = true
  router.replace({ query: {} })
}

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  const st = statusFilter.value
  return events.value.filter((ev) => {
    if (st) {
      // Filtre spécial « passés » : tout événement passé par la date, ou déjà
      // terminé/archivé — pas seulement ceux marqués ARCHIVED.
      if (st === 'PAST') {
        if (!isPast(ev)) return false
      } else if (ev.status !== st) {
        return false
      }
    }
    if (q && !ev.name.toLowerCase().includes(q)) return false
    return true
  })
})

// Tri : par date d'événement (décroissante par défaut, bouton pour inverser)
const sortDateAsc = ref(false)
const paginated = computed(() => {
  const arr = [...filtered.value]
  arr.sort((a, b) => {
    const da = a.eventDate ? new Date(a.eventDate + 'T00:00:00').getTime() : 0
    const db = b.eventDate ? new Date(b.eventDate + 'T00:00:00').getTime() : 0
    return sortDateAsc.value ? da - db : db - da
  })
  return arr
})

/** Un événement est « passé » si terminé/archivé, ou si sa date est antérieure à aujourd'hui. */
function isPast(ev: Event): boolean {
  if (ev.status === 'ARCHIVED' || ev.status === 'COMPLETED') return true
  if (ev.status === 'CANCELLED') return false
  if (!ev.eventDate) return false
  const d = new Date(ev.eventDate + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return d.getTime() < today.getTime()
}

const statusMap: Record<string, string> = {
  DRAFT: 'Brouillons',
  PUBLISHED: 'À venir',
  ACTIVE: 'En cours',
  COMPLETED: 'Terminé',
  ARCHIVED: 'Archivé',
  CANCELLED: 'Annulé',
}
const statCards = computed(() => {
  const total = events.value.length
  const upcoming = events.value.filter((e) => (e.status === 'PUBLISHED' || e.status === 'ACTIVE') && !isPast(e)).length
  const drafts = events.value.filter((e) => e.status === 'DRAFT').length
  const past = events.value.filter((e) => isPast(e)).length
  return [
    { label: 'Total Événements', value: total, sub: 'Tous vos événements', icon: 'calendar_month', bg: '#F0EBFF', color: '#4B24B5' },
    { label: 'À venir', value: upcoming, sub: 'Publiés et en cours', icon: 'check_circle', bg: '#E7F6F0', color: '#176B5B' },
    { label: 'Brouillons', value: drafts, sub: 'En cours de préparation', icon: 'schedule', bg: '#FFF4E5', color: '#F4A340' },
    { label: 'Passés', value: past, sub: 'Événements terminés', icon: 'event_busy', bg: '#FFECEC', color: '#C62828' },
  ]
})

function dateLabel(ev: Event): string {
  // Affiche la date réelle de l'événement (et l'heure) au lieu de la date de création.
  if (ev.eventDate) {
    const dateTxt = new Date(ev.eventDate + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    return ev.startTime ? `${dateTxt} · ${String(ev.startTime).slice(0, 5)}` : dateTxt
  }
  return ev.createdAt
    ? new Date(ev.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Non renseigné'
}

onMounted(load)
async function load() {
  loading.value = true
  error.value = ''
  try {
    events.value = await listEvents()
    // Charge les photos de couverture uploadées (une requête blob par événement)
    const withImage = events.value.filter((e) => e.hasImage)
    await Promise.allSettled(withImage.map(async (e) => {
      const url = await loadEventImage(e.id)
      if (url) imageUrls[e.id] = url
    }))
  } catch (e: any) {
    error.value = e?.message || 'Erreur de chargement'
  } finally {
    loading.value = false
  }
}

function onCreated(w: Event) {
  createOpen.value = false
  router.push(`/dashboard/events/${w.id}`)
}

function goDetail(ev: Event) {
  router.push(`/dashboard/events/${ev.id}`)
}
</script>

<style scoped>
/* pas de styles spécifiques nécessaires */
</style>
