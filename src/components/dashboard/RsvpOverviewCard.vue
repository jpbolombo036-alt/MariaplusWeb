<template>
  <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col">
    <div class="flex items-center justify-between mb-4">
      <span class="font-semibold text-slate-800 text-[15px]">Vue d'ensemble RSVP</span>
      <button class="flex items-center gap-0.5 text-sm text-primary font-semibold hover:underline">Voir tous
        <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
      </button>
    </div>

    <div class="flex items-center gap-6">
      <!-- Donut -->
      <div class="relative w-32 h-32 shrink-0">
        <svg viewBox="0 0 36 36" class="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="14" fill="none" stroke="#f3f4f6" stroke-width="6"></circle>
          <circle cx="18" cy="18" r="14" fill="none" stroke="#22c55e" stroke-width="6" :stroke-dasharray="`${pctAccepted * 0.88} 88`" stroke-linecap="round"></circle>
          <circle cx="18" cy="18" r="14" fill="none" stroke="#f59e0b" stroke-width="6" :stroke-dasharray="`${pctPending * 0.88} 88`" :stroke-dashoffset="`-${pctAccepted * 0.88}`" stroke-linecap="round"></circle>
          <circle cx="18" cy="18" r="14" fill="none" stroke="#ef4444" stroke-width="6" :stroke-dasharray="`${pctDeclined * 0.88} 88`" :stroke-dashoffset="`-${(pctAccepted + pctPending) * 0.88}`" stroke-linecap="round"></circle>
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <span class="text-xl font-bold text-slate-900">{{ total }}</span>
          <span class="text-[10px] text-slate-500 uppercase tracking-wide">Invités</span>
        </div>
      </div>

      <!-- Légende + stats -->
      <div class="flex-1 space-y-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-green-600"></span>
            <span class="text-[13px] text-slate-600">Acceptés</span>
          </div>
          <div class="text-right">
            <span class="text-sm font-bold text-slate-900">{{ accepted }}</span>
            <span class="text-[11px] text-slate-500 ml-1">{{ pctAccepted }}%</span>
          </div>
        </div>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span class="text-[13px] text-slate-600">En attente</span>
          </div>
          <div class="text-right">
            <span class="text-sm font-bold text-slate-900">{{ pending }}</span>
            <span class="text-[11px] text-slate-500 ml-1">{{ pctPending }}%</span>
          </div>
        </div>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-red-600"></span>
            <span class="text-[13px] text-slate-600">Refusés</span>
          </div>
          <div class="text-right">
            <span class="text-sm font-bold text-slate-900">{{ declined }}</span>
            <span class="text-[11px] text-slate-500 ml-1">{{ pctDeclined }}%</span>
          </div>
        </div>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
            <span class="text-[13px] text-slate-600">Pas de réponse</span>
          </div>
          <div class="text-right">
            <span class="text-sm font-bold text-slate-900">{{ noResponse }}</span>
            <span class="text-[11px] text-slate-500 ml-1">{{ pctNoResponse }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ accepted: number; pending: number; declined: number; noResponse?: number }>()

const total = computed(() => Math.max(1, props.accepted + props.pending + props.declined + (props.noResponse ?? 0)))
const pctAccepted = computed(() => Math.round((props.accepted / total.value) * 100))
const pctPending = computed(() => Math.round((props.pending / total.value) * 100))
const pctDeclined = computed(() => Math.round((props.declined / total.value) * 100))
const pctNoResponse = computed(() => Math.round(((props.noResponse ?? 0) / total.value) * 100))
</script>
