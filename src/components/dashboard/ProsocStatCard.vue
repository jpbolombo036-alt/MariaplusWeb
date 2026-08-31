<template>
  <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col">
    <div class="flex items-center justify-between mb-4">
      <span class="text-[11px] font-bold uppercase tracking-widest text-slate-500">{{ section }}</span>
      <button class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
        <span class="material-symbols-outlined text-[16px]">refresh</span>
        Actualiser
      </button>
    </div>

    <div class="flex items-end justify-between gap-4">
      <div>
        <p class="text-[13px] text-slate-500 font-medium mb-1">{{ label }}</p>
        <div class="flex items-baseline gap-2">
          <span class="text-[32px] font-bold text-slate-900 leading-none">{{ value }}</span>
          <span v-if="currency" class="text-[16px] font-bold text-slate-500">{{ currency }}</span>
        </div>
        <div class="flex items-center gap-2 mt-2">
          <span v-if="devise" class="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">Devise : {{ devise }}</span>
          <span v-if="period" class="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{{ period }}</span>
          <span v-if="ops" class="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">{{ ops }}</span>
          <span v-if="variation" class="text-[11px] font-semibold px-2 py-0.5 rounded-md" :class="variationColor">{{ variation }}</span>
        </div>
        <p v-if="footer" class="text-[11px] text-slate-500 mt-2">{{ footer }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  section: string
  label: string
  value: string | number
  currency?: string
  devise?: string
  period?: string
  ops?: string
  variation?: string
  variationPositive?: boolean
  footer?: string
}>()

const variationColor = computed(() => {
  if (props.variationPositive === false) return 'text-red-700 bg-red-50'
  return 'text-green-700 bg-green-50'
})
</script>
