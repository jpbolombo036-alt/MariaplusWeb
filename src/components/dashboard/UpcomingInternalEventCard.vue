<template>
  <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col relative overflow-hidden">
    <span class="font-semibold text-slate-800 text-[15px] mb-4 relative">Prochain événement</span>

    <div class="flex items-center gap-4 relative">
      <div class="w-12 h-12 rounded-xl bg-primary text-white flex flex-col items-center justify-center shrink-0 shadow-sm">
        <span class="text-[9px] uppercase font-bold leading-none">{{ month }}</span>
        <span class="text-lg font-bold leading-tight">{{ day }}</span>
      </div>
      <div class="flex-1 min-w-0">
        <span class="font-semibold text-slate-800 text-[14px] block truncate">{{ name || 'Événement interne' }}</span>
        <span class="text-[12px] text-slate-500">{{ time || '—' }}</span>
      </div>
    </div>

    <div class="mt-4 space-y-2.5 text-[13px] text-slate-500 relative">
      <div class="flex items-center gap-2.5">
        <span class="material-symbols-outlined text-[18px] text-slate-400">location_on</span>
        <span class="truncate">{{ venue || '—' }}</span>
      </div>
      <div class="flex items-center gap-2.5">
        <span class="material-symbols-outlined text-[18px] text-slate-400">group</span>
        <span>{{ guestsLabel || '0 invités attendus' }}</span>
      </div>
    </div>

    <button class="mt-5 h-10 rounded-lg border border-primary text-primary text-[13px] font-semibold hover:bg-primary-light transition-colors relative w-full">
      Détails Logistiques
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ date?: string; name?: string; time?: string; venue?: string; guests?: number }>()

const month = computed(() => {
  if (!props.date) return '—'
  return new Date(props.date).toLocaleDateString('fr-FR', { month: 'short' }).slice(0, 3).toUpperCase()
})
const day = computed(() => {
  if (!props.date) return '—'
  return String(new Date(props.date).getDate()).padStart(2, '0')
})
const guestsLabel = computed(() =>
  props.guests != null ? `${props.guests} invités attendus` : '—',
)
</script>
