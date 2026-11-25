<template>
  <section class="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-5 min-w-0" aria-labelledby="funnel-title">
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <h3 id="funnel-title" class="m-0 text-[16px] font-semibold text-slate-900">Parcours des invitations</h3>
      <span class="text-[13px] text-slate-600">du premier envoi au jour J</span>
    </div>
    <ol class="list-none m-0 p-0 flex flex-col gap-3.5" data-testid="funnel">
      <li
        v-for="step in steps"
        :key="step.label"
        class="grid grid-cols-[112px_minmax(0,1fr)_56px] gap-3 items-center text-[14px]"
      >
        <span class="text-slate-700">{{ step.label }}</span>
        <div class="h-7 rounded-lg bg-slate-100 overflow-hidden" role="img" :aria-label="`${step.label} : ${step.value ?? 'pas encore'}`">
          <div
            v-if="step.value != null"
            class="h-full rounded-lg bg-primary transition-all"
            :style="{ width: `${step.width}%`, opacity: step.opacity }"
          ></div>
          <div v-else class="h-full flex items-center pl-3 text-[12px] text-slate-600">{{ step.placeholder }}</div>
        </div>
        <span class="font-semibold text-right" :class="step.value == null ? 'text-slate-500' : 'text-slate-900'">{{ step.value ?? '—' }}</span>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { percent } from './dashboardMath'

const props = defineProps<{
  created: number
  sent: number
  opened: number
  responded: number
  /** Persons checked in; null before the event day. */
  present: number | null
}>()

const steps = computed(() => {
  const base = Math.max(props.created, 1)
  const raw: { label: string; value: number | null; placeholder?: string }[] = [
    { label: 'Créées', value: props.created },
    { label: 'Envoyées', value: props.sent },
    { label: 'Ouvertes', value: props.opened },
    { label: 'Ont répondu', value: props.responded },
    { label: 'Présents', value: props.present, placeholder: 'le jour J, au check-in' },
  ]
  return raw.map((s, i) => ({
    ...s,
    width: s.value == null ? 0 : Math.max(s.value > 0 ? 2 : 0, Math.min(100, percent(s.value, base))),
    opacity: 0.35 + i * 0.16,
  }))
})
</script>
