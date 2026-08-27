<template>
  <div class="bg-white border border-outline-variant/60 rounded-card p-5 shadow-card flex flex-col relative overflow-hidden">
    <!-- Déco subtile coin supérieur droit -->
    <div class="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-primary-light/60 pointer-events-none"></div>

    <span class="font-semibold text-on-surface mb-5 relative">Prochain événement interne</span>

    <div class="flex items-center gap-4 relative">
      <div class="w-14 h-14 rounded-xl bg-primary text-white flex flex-col items-center justify-center shrink-0 shadow-sm">
        <span class="text-[10px] uppercase font-semibold leading-none">{{ month }}</span>
        <span class="text-xl font-bold leading-tight">{{ day }}</span>
      </div>
      <div>
        <span class="font-semibold text-on-surface">{{ name || 'Événement interne' }}</span>
      </div>
    </div>

    <div class="mt-5 space-y-2.5 text-sm text-on-surface-variant relative">
      <div class="flex items-center gap-2">
        <span class="material-symbols-outlined text-base text-on-surface-variant">schedule</span>
        {{ time || '—' }}
      </div>
      <div class="flex items-center gap-2">
        <span class="material-symbols-outlined text-base text-on-surface-variant">location_on</span>
        {{ venue || '—' }}
      </div>
      <div class="flex items-center gap-2">
        <span class="material-symbols-outlined text-base text-on-surface-variant">group</span>
        {{ guestsLabel || '0 invités' }}
      </div>
    </div>

    <button class="mt-5 h-9 rounded-lg border border-primary text-primary text-sm font-medium hover:bg-primary-light transition-colors relative">
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
