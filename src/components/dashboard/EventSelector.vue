<template>
  <div class="relative" @click.stop>
    <button
      @click="open = !open"
      class="flex items-center gap-2 h-10 px-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-primary/40 transition-all"
    >
      <span class="w-8 h-8 rounded-md bg-primary-light text-primary grid place-items-center shrink-0">
        <span class="material-symbols-outlined text-[18px]">event</span>
      </span>
      <span class="text-left leading-tight min-w-0">
        <span class="block text-[13px] font-semibold text-slate-800 truncate max-w-[180px]">{{ name || 'Sélectionner un événement' }}</span>
        <span class="block text-[11px] text-slate-500 truncate max-w-[180px]">{{ subtitle || 'Aucun événement actif' }}</span>
      </span>
      <span class="material-symbols-outlined text-slate-400 text-[18px] shrink-0 transition-transform" :class="open ? 'rotate-180' : ''">expand_more</span>
    </button>

    <div
      v-if="open"
      class="absolute right-0 top-full mt-2 w-72 z-30 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden"
    >
      <div class="max-h-[65vh] overflow-y-auto">
        <template v-for="group in groups" :key="group.label">
          <p
            class="px-3 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400"
            :class="group.divider ? 'border-t border-slate-100' : ''"
          >{{ group.label }}</p>
          <button
            v-for="w in group.items"
            :key="w.id"
            @click="pick(w.id)"
            class="w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-slate-50 transition-colors"
            :class="[w.id === weddingStore.activeId ? 'bg-primary-light/80' : '', group.muted ? 'opacity-70' : '']"
          >
            <span class="material-symbols-outlined text-[18px]" :class="w.id === weddingStore.activeId ? 'text-primary' : 'text-slate-400'">
              {{ w.id === weddingStore.activeId ? 'radio_button_checked' : 'radio_button_unchecked' }}
            </span>
            <span class="min-w-0 flex-1">
              <span class="block text-[13px] font-semibold text-slate-700 truncate">{{ w.weddingDetails?.displayName || w.name }}</span>
              <span class="block text-[11px] text-slate-500 truncate">{{ eventDateLabel(w) || 'Date non renseignée' }}</span>
            </span>
            <span class="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap" :class="chipClass(w)">{{ statusLabel(w.status) }}</span>
          </button>
        </template>
        <p v-if="!weddingStore.weddings.length" class="px-3 py-3 text-[12px] text-slate-400 text-center">
          Aucun événement — créez-en un dans « Mes Événements ».
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useWeddingStore } from '../../stores/wedding'
import { eventDateLabel, isPastEvent, sortEventsForSelector, statusLabel } from '../../utils/eventStatus'
import type { Event } from '../../api/events'

defineProps<{ name?: string; subtitle?: string }>()
const emit = defineEmits<{ (e: 'select'): void }>()

const weddingStore = useWeddingStore()
const router = useRouter()
const open = ref(false)

weddingStore.load()

const photo = computed(() => weddingStore.active?.weddingDetails?.couplePhotoUrl || null)

/**
 * Liste groupée : les événements à venir d'abord (date croissante), puis les
 * passés (date décroissante) sous leur propre en-tête. Tout reste visible.
 */
const groups = computed(() => {
  const sorted = sortEventsForSelector(weddingStore.weddings)
  const list = [
    { label: 'À venir', items: sorted.filter((e) => !isPastEvent(e)), muted: false, divider: false },
  ]
  const past = sorted.filter((e) => isPastEvent(e))
  if (past.length) {
    list.push({ label: `Passés (${past.length})`, items: past, muted: true, divider: true })
  }
  return list
})

/** Pastille de statut, lisible en mode clair comme en mode sombre. */
function chipClass(w: Event): string {
  switch (w.status) {
    case 'PUBLISHED': return 'bg-success/10 text-success'
    case 'ACTIVE': return 'bg-attention/15 text-attention-dark dark:text-attention'
    case 'DRAFT': return 'bg-slate-500/10 text-slate-600 dark:text-slate-300'
    case 'CANCELLED': return 'bg-error/10 text-error'
    default: return 'bg-slate-500/10 text-slate-500 dark:text-slate-400'
  }
}

function pick(id: number) {
  const previous = weddingStore.activeId
  weddingStore.setActive(id)
  open.value = false
  emit('select')
  if (previous && previous !== id && router.currentRoute.value.path.startsWith(`/dashboard/events/${previous}`)) {
    const base = `/dashboard/events/${previous}`
    const rest = router.currentRoute.value.path.slice(base.length)
    router.push(`/dashboard/events/${id}${rest}`)
  }
}
</script>
