<template>
  <div class="bg-white border border-outline-variant/60 rounded-card p-5 shadow-card flex flex-col">
    <div class="flex items-center justify-between mb-6">
      <span class="font-semibold text-on-surface">Vue d'ensemble RSVP</span>
      <button class="flex items-center gap-0.5 text-sm text-primary font-medium hover:underline">Voir tous
        <span class="material-symbols-outlined text-base">arrow_forward</span>
      </button>
    </div>

    <!-- Barre segmentée -->
    <div class="w-full h-3 rounded-full overflow-hidden flex bg-surface-variant/50">
      <div :style="{ width: pctAccepted + '%' }" class="bg-green-600 h-full"></div>
      <div :style="{ width: pctPending + '%' }" class="bg-amber-500 h-full"></div>
      <div :style="{ width: pctDeclined + '%' }" class="bg-red-600 h-full"></div>
    </div>

    <!-- Blocs stats -->
    <div class="grid grid-cols-3 gap-4 mt-6">
      <div class="flex flex-col items-center text-center">
        <span class="w-10 h-10 rounded-full bg-green-50 grid place-items-center mb-2">
          <span class="material-symbols-outlined text-green-600 text-lg">check</span>
        </span>
        <span class="text-xl font-bold text-on-surface">{{ accepted }}</span>
        <span class="text-[11px] text-on-surface-variant">ACCEPTÉS</span>
      </div>
      <div class="flex flex-col items-center text-center">
        <span class="w-10 h-10 rounded-full bg-amber-50 grid place-items-center mb-2">
          <span class="material-symbols-outlined text-amber-500 text-lg">schedule</span>
        </span>
        <span class="text-xl font-bold text-on-surface">{{ pending }}</span>
        <span class="text-[11px] text-on-surface-variant">EN ATTENTE</span>
      </div>
      <div class="flex flex-col items-center text-center">
        <span class="w-10 h-10 rounded-full bg-red-50 grid place-items-center mb-2">
          <span class="material-symbols-outlined text-red-600 text-lg">block</span>
        </span>
        <span class="text-xl font-bold text-on-surface">{{ declined }}</span>
        <span class="text-[11px] text-on-surface-variant">REFUSÉS</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ accepted: number; pending: number; declined: number }>()

const total = computed(() => Math.max(1, props.accepted + props.pending + props.declined))
const pctAccepted = computed(() => Math.round((props.accepted / total.value) * 100))
const pctPending = computed(() => Math.round((props.pending / total.value) * 100))
const pctDeclined = computed(() => Math.max(0, 100 - pctAccepted.value - pctPending.value))
</script>
