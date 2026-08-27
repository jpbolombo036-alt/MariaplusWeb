<template>
  <div>
    <!-- En-tête -->
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">
      <div>
        <h1 style="font-size:28px;font-weight:700;color:#1F2937">Mes Événements</h1>
        <p style="font-size:15px;color:#667085;margin-top:6px">Gérez et suivez tous vos événements en un seul endroit.</p>
      </div>

      <!-- Header droite : recherche + notifications + avatar -->
      <div class="flex items-center gap-5">
        <div class="relative w-full lg:w-[360px]">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa0aa]"><span class="material-symbols-outlined text-[22px]">search</span></span>
          <input
            v-model="query"
            placeholder="Rechercher un événement..."
            class="w-full h-12 pl-12 pr-4 rounded-[10px] border border-[#e8eaf0] bg-white text-sm outline-none focus:border-primary placeholder:text-[#9aa0aa]"
          />
        </div>
        <button class="relative text-on-surface-variant hover:text-primary">
          <span class="material-symbols-outlined text-[22px]">notifications</span>
          <span class="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-error text-white text-[10px] font-bold grid place-items-center">3</span>
        </button>
        <span class="w-9 h-9 rounded-full bg-surface-container grid place-items-center overflow-hidden shrink-0">
          <span class="material-symbols-outlined text-on-surface-variant">person</span>
        </span>
      </div>
    </div>

    <!-- 4 cartes statistiques -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
      <div v-for="s in statCards" :key="s.label" class="bg-white border border-[#e8eaf0] rounded-[14px] p-6 flex items-center gap-4">
        <span class="w-14 h-14 rounded-full grid place-items-center shrink-0" :style="{ background: s.bg, color: s.color }">
          <span class="material-symbols-outlined text-[26px]">{{ s.icon }}</span>
        </span>
        <div>
          <div style="font-size:13px;color:#667085">{{ s.label }}</div>
          <div style="font-size:24px;font-weight:700;color:#1F2937">{{ s.value }}</div>
          <div style="font-size:13px;color:#9aa0aa">{{ s.sub }}</div>
        </div>
      </div>
    </div>

    <p v-if="loading" class="text-on-surface-variant py-16 text-center">Chargement…</p>
    <p v-else-if="error" class="text-error py-16 text-center">{{ error }}</p>
<!-- Liste en tableau -->
    <div v-else class="bg-white border border-[#e8eaf0] rounded-[14px] overflow-hidden">
      <div class="px-6 pt-6 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 style="font-size:18px;font-weight:700;color:#1F2937">Liste de vos événements</h2>
        <div class="flex items-center gap-3">
          <button class="h-[42px] px-4 rounded-lg border border-[#e8eaf0] bg-white text-sm text-[#1F2937] inline-flex items-center gap-2">
            <span class="material-symbols-outlined text-[18px]">filter_list</span> Tous les statuts
            <span class="material-symbols-outlined text-[18px]">expand_more</span>
          </button>
          <button class="h-[42px] px-4 rounded-lg bg-[#4B24B5] text-white text-sm font-semibold inline-flex items-center gap-2">
            <span class="material-symbols-outlined text-[18px]">calendar_today</span> Trier par date
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-[#f9fafb]" style="font-size:13px;font-weight:600;color:#475467">
              <th class="px-6 py-3 text-left">Événement</th>
              <th class="px-6 py-3 text-left">Date &amp; Heure</th>
              <th class="px-6 py-3 text-left">Lieu</th>
              <th class="px-6 py-3 text-left">Statut</th>
              <th class="px-6 py-3 text-left">Invités</th>
              <th class="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#eef0f6]">
            <tr v-for="ev in paginated" :key="ev.id">
              <!-- Événement -->
              <td class="px-6 py-4">
                <div class="flex items-center gap-4">
                  <div class="w-[125px] h-[78px] rounded-lg overflow-hidden shrink-0">
                    <img v-if="ev.couplePhotoUrl" :src="ev.couplePhotoUrl" class="w-full h-full object-cover" alt="" />
                    <div v-else class="w-full h-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                      <span class="material-symbols-outlined text-2xl text-white/50">favorite</span>
                    </div>
                  </div>
                  <div>
                    <div style="font-size:16px;font-weight:600;color:#1F2937">{{ ev.displayName || 'Sans nom' }}</div>
                    <div style="font-size:12px;font-weight:600;color:#4B24B5;letter-spacing:0.04em">• WEDDING</div>
                  </div>
                </div>
              </td>
              <!-- Date & heure -->
              <td class="px-6 py-4">
                <div class="flex items-center gap-2 text-[14px] text-[#475467]"><span class="material-symbols-outlined text-[18px] text-[#98A2B3]">calendar_today</span> {{ dateLabel(ev) }}</div>
                <div class="flex items-center gap-2 text-[14px] text-[#98A2B3] mt-2"><span class="material-symbols-outlined text-[18px] text-[#98A2B3]">schedule</span> —</div>
              </td>
              <!-- Lieu -->
              <td class="px-6 py-4">
                <div class="flex items-start gap-2 text-[14px] text-[#475467]">
                  <span class="material-symbols-outlined text-[18px] text-[#98A2B3]">place</span>
                  <span>Non renseigné</span>
                </div>
              </td>
              <!-- Statut -->
              <td class="px-6 py-4"><StatusBadge :status="ev.status" /></td>
              <!-- Invités -->
              <td class="px-6 py-4">
                <div style="font-size:16px;font-weight:600;color:#1F2937">—</div>
                <div style="font-size:13px;color:#98A2B3">Invités attendus</div>
              </td>
              <!-- Actions -->
              <td class="px-6 py-4 text-right">
                <button class="text-[#98A2B3] hover:text-[#1F2937]"><span class="material-symbols-outlined">more_vert</span></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-[#eef0f6]">
        <div style="font-size:13px;color:#667085">Affichage 1 - {{ filtered.length }} sur {{ filtered.length }} événements</div>
        <div class="flex items-center gap-2">
          <button class="w-9 h-9 rounded-lg border border-[#e8eaf0] bg-white text-[#1F2937] inline-flex items-center justify-center"><span class="material-symbols-outlined text-[18px]">chevron_left</span></button>
          <button class="w-9 h-9 rounded-lg bg-[#4B24B5] text-white inline-flex items-center justify-center text-sm font-semibold">1</button>
          <button class="w-9 h-9 rounded-lg border border-[#e8eaf0] bg-white text-[#1F2937] inline-flex items-center justify-center"><span class="material-symbols-outlined text-[18px]">chevron_right</span></button>
        </div>
      </div>
    </div>

    <CreateEventDialog v-if="createOpen" @close="createOpen = false" @created="onCreated" />
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { listWeddings, type Wedding } from '../api/weddings'
import PermGuard from '../components/common/PermGuard.vue'
import StatusBadge from '../components/common/StatusBadge.vue'
import CreateEventDialog from '../components/events/CreateEventDialog.vue'

const router = useRouter()
const route = useRoute()
const events = ref<Wedding[]>([])
const loading = ref(true)
const error = ref('')
const createOpen = ref(false)
const query = ref('')
const statusFilter = ref('')

// Ouvre le dialogue si arrivé via le bouton sidebar (…?new=1).
if (route.query.new === '1') {
  createOpen.value = true
  router.replace({ query: {} })
}

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  const st = statusFilter.value
  return events.value.filter((ev) => {
    if (st && ev.status !== st) return false
    if (q && !ev.displayName.toLowerCase().includes(q)) return false
    return true
  })
})

const paginated = computed(() => filtered.value)

const statusMap: Record<string, string> = { DRAFT: 'Brouillons', PUBLISHED: 'À venir' }
const statCards = computed(() => {
  const total = events.value.length
  const upcoming = events.value.filter((e) => e.status === 'PUBLISHED').length
  const drafts = events.value.filter((e) => e.status === 'DRAFT').length
  const past = events.value.filter((e) => e.status === 'ARCHIVED').length
  return [
    { label: 'Total Événements', value: total, sub: 'Tous vos événements', icon: 'calendar_month', bg: '#F0EBFF', color: '#4B24B5' },
    { label: 'À venir', value: upcoming, sub: 'Publiés et à venir', icon: 'check_circle', bg: '#E7F6F0', color: '#176B5B' },
    { label: 'Brouillons', value: drafts, sub: 'En cours de préparation', icon: 'schedule', bg: '#FFF4E5', color: '#F4A340' },
    { label: 'Passés', value: past, sub: 'Événements terminés', icon: 'event_busy', bg: '#FFECEC', color: '#C62828' },
  ]
})

function dateLabel(ev: Wedding): string {
  return ev.createdAt || ev.updatedAt ? new Date(ev.createdAt || ev.updatedAt || '').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Non renseigné'
}

onMounted(load)
async function load() {
  loading.value = true
  error.value = ''
  try {
    events.value = await listWeddings()
  } catch (e: any) {
    error.value = e?.message || 'Erreur de chargement'
  } finally {
    loading.value = false
  }
}

function onCreated(w: Wedding) {
  createOpen.value = false
  router.push(`/dashboard/events/${w.id}`)
}
</script>

<style scoped>
/* pas de styles spécifiques nécessaires */
</style>
