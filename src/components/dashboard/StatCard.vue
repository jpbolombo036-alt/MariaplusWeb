<template>
  <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col hover:shadow-md transition-all">
    <div class="flex items-center justify-between mb-5">
      <span class="w-12 h-12 rounded-xl grid place-items-center shrink-0" :class="iconBg">
        <span class="material-symbols-outlined" :class="iconTone">{{ icon }}</span>
      </span>
      <span v-if="badge" class="px-2.5 py-1 rounded-lg text-[11px] font-bold" :class="badgeClass">{{ badge }}</span>
    </div>
    <span class="text-[13px] text-slate-500 font-medium">{{ label }}</span>
    <div class="mt-2 flex items-baseline gap-2">
      <span class="text-[28px] font-bold text-slate-900">{{ value }}</span>
      <span v-if="total" class="text-sm text-slate-500">/ {{ total }}</span>
    </div>
    <div v-if="progress !== null" class="mt-4 w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
      <div class="h-full rounded-full transition-all" :class="barClass" :style="{ width: pct + '%' }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  value: string | number
  total?: string | number
  icon: string
  tone?: 'primary' | 'success' | 'attention' | 'error'
  badge?: string
  progress?: number | null
}>()

const iconBg = computed(() => {
  switch (props.tone) {
    case 'success':
      return 'bg-green-50'
    case 'attention':
      return 'bg-amber-50'
    case 'error':
      return 'bg-red-50'
    default:
      return 'bg-primary-light'
  }
})

const iconTone = computed(() => {
  switch (props.tone) {
    case 'success':
      return 'text-green-600'
    case 'attention':
      return 'text-amber-500'
    case 'error':
      return 'text-red-600'
    default:
      return 'text-primary'
  }
})

const badgeClass = computed(() => {
  if (!props.badge) return ''
  if (props.badge.startsWith('+')) return 'bg-green-50 text-green-700'
  if (props.badge.startsWith('-')) return 'bg-red-50 text-red-700'
  return 'bg-slate-50 text-slate-700'
})

const barClass = computed(() => {
  switch (props.tone) {
    case 'success':
      return 'bg-green-600'
    case 'attention':
      return 'bg-amber-500'
    case 'error':
      return 'bg-red-600'
    default:
      return 'bg-primary'
  }
})

const pct = computed(() => Math.max(0, Math.min(100, props.progress ?? 0)))
</script>
