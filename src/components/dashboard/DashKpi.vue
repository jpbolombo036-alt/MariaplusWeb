<template>
  <div class="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-3.5 min-w-0" :data-testid="testId">
    <div class="flex items-center justify-between gap-3">
      <span class="text-[14px] font-medium text-slate-600">{{ label }}</span>
      <span class="w-10 h-10 rounded-xl grid place-items-center shrink-0" :class="TONE_CHIP[tone]">
        <component :is="icon" :size="20" :stroke-width="1.75" aria-hidden="true" />
      </span>
    </div>
    <div class="flex items-baseline gap-2 min-w-0">
      <span class="text-[32px] leading-none font-bold tracking-tight text-slate-900">{{ value }}</span>
      <span v-if="suffix" class="text-[13px] text-slate-600 truncate">{{ suffix }}</span>
    </div>
    <div
      v-if="progress != null"
      role="img"
      :aria-label="progressLabel || `${progress} %`"
      class="h-1.5 rounded-full bg-slate-100 overflow-hidden"
    >
      <div class="h-full rounded-full transition-all" :class="TONE_BAR[tone]" :style="{ width: `${clamped}%` }"></div>
    </div>
    <p v-if="hint" class="text-[13px] text-slate-600 m-0 break-words">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import { TONE_BAR, TONE_CHIP, type Tone } from './tones'

const props = defineProps<{
  label: string
  value: string | number
  icon: Component
  tone: Tone
  suffix?: string
  hint?: string
  progress?: number | null
  progressLabel?: string
  testId?: string
}>()

const clamped = computed(() => Math.max(0, Math.min(100, props.progress ?? 0)))
</script>
