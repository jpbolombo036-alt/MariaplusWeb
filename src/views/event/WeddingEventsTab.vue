<template>
  <div>
    <div class="flex items-center justify-between mb-5">
      <div>
        <h2 class="text-lg font-bold text-on-surface">Événements internes</h2>
        <p class="text-sm text-on-surface-variant">Cérémonies, réception et temps forts de votre événement.</p>
      </div>
      <PermGuard :allow="['EVENT_CREATE']">
        <button
          class="h-11 px-5 rounded-xl bg-primary text-on-primary text-sm font-semibold inline-flex items-center gap-2 shadow-sm shadow-primary/20 hover:opacity-90 transition"
          @click="openCreate"
        >
          <span class="material-symbols-outlined text-lg">add</span> Ajouter un événement
        </button>
      </PermGuard>
    </div>

    <p v-if="loading" class="text-on-surface-variant">Chargement…</p>

    <div v-else-if="items.length === 0" class="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl p-10 text-center">
      <div class="w-16 h-16 mx-auto rounded-full bg-surface-container-high grid place-items-center mb-4">
        <span class="material-symbols-outlined text-3xl text-on-surface-variant">event</span>
      </div>
      <h3 class="font-semibold text-on-surface">Aucun événement programmé</h3>
      <p class="text-sm text-on-surface-variant mt-1 max-w-xs mx-auto">Ajoutez votre première cérémonie ou réception pour structurer le déroulé de la journée.</p>
    </div>

    <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="e in sorted"
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

    <!-- Modal création -->
    <div v-if="formOpen" class="fixed inset-0 bg-black/40 z-50 grid place-items-center px-4" @click.self="formOpen=false">
      <form class="w-full max-w-lg bg-surface-container-lowest rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto" @submit.prevent="create">
        <div class="flex items-center justify-between mb-5">
          <h3 class="font-bold text-on-surface text-lg">Nouvel événement</h3>
          <button type="button" class="text-on-surface-variant hover:text-on-surface" @click="formOpen=false"><span class="material-symbols-outlined">close</span></button>
        </div>

        <label class="block text-xs font-semibold text-on-surface-variant mb-1">Nom *</label>
        <input v-model="form.name" required placeholder="Ex : Cérémonie religieuse" class="input mb-3" />

        <label class="block text-xs font-semibold text-on-surface-variant mb-1">Type</label>
        <select v-model="form.type" class="input mb-3">
          <option v-for="t in types" :key="t.value" :value="t.value">{{ t.label }}</option>
        </select>

        <label class="block text-xs font-semibold text-on-surface-variant mb-1">Date</label>
        <input v-model="form.eventDate" type="date" class="input mb-3" />

        <div class="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label class="block text-xs font-semibold text-on-surface-variant mb-1">Début</label>
            <input v-model="form.startTime" type="time" class="input" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-on-surface-variant mb-1">Fin</label>
            <input v-model="form.endTime" type="time" class="input" />
          </div>
        </div>

        <label class="block text-xs font-semibold text-on-surface-variant mb-1">Lieu</label>
        <input v-model="form.venueName" placeholder="Ex : Église Saint-Roch" class="input mb-3" />
        <input v-model="form.city" placeholder="Ville" class="input mb-3" />

        <label class="block text-xs font-semibold text-on-surface-variant mb-1">Description</label>
        <textarea v-model="form.description" rows="2" placeholder="Détails (optionnel)" class="input mb-4 resize-none"></textarea>

        <div class="flex justify-end gap-2">
          <button type="button" class="px-4 h-10 text-on-surface-variant" @click="formOpen=false">Annuler</button>
          <button type="submit" class="px-5 h-10 rounded-lg bg-primary text-on-primary font-semibold">Créer</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  listWeddingEvents,
  createWeddingEvent,
  deleteWeddingEvent,
  type WeddingEventItem,
} from '../../api/weddingEvents'
import PermGuard from '../../components/common/PermGuard.vue'

const route = useRoute()
const id = Number(route.params.id)
const items = ref<WeddingEventItem[]>([])
const loading = ref(true)
const formOpen = ref(false)
const form = reactive({
  name: '',
  type: 'OTHER',
  eventDate: '',
  startTime: '',
  endTime: '',
  venueName: '',
  city: '',
  description: '',
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
function openCreate() {
  Object.assign(form, { name: '', type: 'OTHER', eventDate: '', startTime: '', endTime: '', venueName: '', city: '', description: '' })
  formOpen.value = true
}
async function create() {
  const payload: Record<string, unknown> = {
    name: form.name,
    type: form.type,
    description: form.description || null,
    eventDate: form.eventDate || null,
    startTime: form.startTime || null,
    endTime: form.endTime || null,
    venueName: form.venueName || null,
    city: form.city || null,
  }
  await createWeddingEvent(id, payload)
  formOpen.value = false
  await load()
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
