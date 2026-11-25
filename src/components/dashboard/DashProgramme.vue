<template>
  <section class="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-4 min-w-0" aria-labelledby="programme-title">
    <div class="flex items-center justify-between gap-3">
      <h3 id="programme-title" class="m-0 text-[16px] font-semibold text-slate-900">Programme</h3>
      <router-link v-if="link" :to="link" class="text-[14px] font-semibold text-primary hover:underline">
        {{ items.length ? 'Modifier' : 'Ajouter' }}
      </router-link>
    </div>
    <p v-if="!items.length" class="m-0 text-[14px] text-slate-600">
      Aucun moment programmé. Ajoutez la dot, la cérémonie ou la réception pour les retrouver ici.
    </p>
    <ol v-else class="list-none m-0 p-0 flex flex-col" data-testid="programme">
      <li
        v-for="(item, i) in items"
        :key="item.id"
        class="grid grid-cols-[84px_20px_minmax(0,1fr)] gap-3"
        :class="i < items.length - 1 ? 'pb-4' : ''"
      >
        <div class="text-[13px] text-slate-600 text-right leading-snug">
          {{ item.day }}<br><strong class="text-slate-900">{{ item.time }}</strong>
        </div>
        <div class="flex flex-col items-center" aria-hidden="true">
          <span
            class="w-3 h-3 rounded-full mt-1 border-2 border-primary"
            :class="i === items.length - 1 ? 'bg-primary' : 'bg-white'"
          ></span>
          <span v-if="i < items.length - 1" class="flex-1 w-0.5 bg-slate-200 mt-1"></span>
        </div>
        <div class="min-w-0">
          <div class="text-[14px] font-semibold text-slate-900 break-words">{{ item.name }}</div>
          <div v-if="item.place" class="text-[13px] text-slate-600 break-words">{{ item.place }}</div>
        </div>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { WeddingEventItem } from '../../api/weddingEvents'

const props = defineProps<{ sessions: WeddingEventItem[]; link?: string }>()

/** Upcoming moments first; when all are past, the last ones are still shown. */
const items = computed(() => {
  const sorted = [...props.sessions].sort((a, b) =>
    `${a.eventDate ?? ''} ${a.startTime ?? ''}`.localeCompare(`${b.eventDate ?? ''} ${b.startTime ?? ''}`))
  const today = new Date().toISOString().slice(0, 10)
  const upcoming = sorted.filter((s) => (s.eventDate ?? '') >= today)
  return (upcoming.length ? upcoming : sorted.slice(-4)).slice(0, 4).map((s) => ({
    id: s.id,
    name: s.name,
    day: dayLabel(s.eventDate),
    time: (s.startTime ?? '').slice(0, 5).replace(':', 'h') || '—',
    place: [s.venueName, s.city].filter(Boolean).join(', '),
  }))
})

function dayLabel(iso?: string | null): string {
  if (!iso) return 'Date à fixer'
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(d.getTime())) return 'Date à fixer'
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}
</script>
