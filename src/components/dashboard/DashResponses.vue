<template>
  <section class="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-5 min-w-0" aria-labelledby="responses-title">
    <div class="flex items-center justify-between gap-3">
      <h3 id="responses-title" class="m-0 text-[16px] font-semibold text-slate-900">Réponses</h3>
      <router-link v-if="link" :to="link" class="inline-flex items-center gap-1 text-[14px] font-semibold text-primary hover:underline">
        Voir les RSVP<ArrowRight :size="16" aria-hidden="true" />
      </router-link>
    </div>
    <div class="flex items-center gap-8 flex-wrap">
      <div
        role="img"
        :aria-label="`Sur ${base} invitations envoyées : ${accepted} acceptées, ${declined} refusées, ${noAnswer} sans réponse`"
        class="w-[168px] h-[168px] rounded-full grid place-items-center shrink-0"
        :style="{ background: ring }"
        data-testid="responses-donut"
      >
        <div class="w-[120px] h-[120px] rounded-full bg-white flex flex-col items-center justify-center">
          <span class="text-[28px] font-bold leading-none text-slate-900">{{ base }}</span>
          <span class="text-[12px] text-slate-600 mt-1">envoyée{{ base > 1 ? 's' : '' }}</span>
        </div>
      </div>
      <ul class="list-none m-0 p-0 flex-1 min-w-[200px] flex flex-col gap-3">
        <li v-for="row in rows" :key="row.label" class="flex items-center gap-2.5 text-[14px]">
          <span class="w-2.5 h-2.5 rounded-[3px] shrink-0" :style="{ background: row.color }" aria-hidden="true"></span>
          <span class="flex-1 text-slate-700">{{ row.label }}</span>
          <span class="font-semibold text-slate-900">{{ row.value }}</span>
          <span class="w-11 text-right text-slate-600">{{ row.pct }}%</span>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight } from 'lucide-vue-next'
import { percent } from './dashboardMath'

const props = defineProps<{ accepted: number; declined: number; noAnswer: number; link?: string }>()

// Green / red / grey also differ in lightness, so they stay distinguishable without colour vision.
const GREEN = '#15803D'
const RED = '#DC2626'
const GREY = '#CBD5E1'

const base = computed(() => props.accepted + props.declined + props.noAnswer)
const rows = computed(() => [
  { label: 'Acceptées', value: props.accepted, pct: percent(props.accepted, base.value), color: GREEN },
  { label: 'Refusées', value: props.declined, pct: percent(props.declined, base.value), color: RED },
  { label: 'Sans réponse', value: props.noAnswer, pct: percent(props.noAnswer, base.value), color: GREY },
])
const ring = computed(() => {
  if (!base.value) return `conic-gradient(${GREY} 0 100%)`
  const a = (props.accepted / base.value) * 100
  const d = a + (props.declined / base.value) * 100
  return `conic-gradient(${GREEN} 0 ${a}%, ${RED} ${a}% ${d}%, ${GREY} ${d}% 100%)`
})
</script>
