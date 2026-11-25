<template>
  <section
    class="relative z-20 bg-white border border-slate-200 rounded-2xl p-6 flex flex-wrap items-center gap-6"
    aria-label="Événement sélectionné"
  >
    <div class="flex items-center gap-5 flex-[1_1_420px] min-w-0">
      <div
        class="w-[88px] h-[88px] rounded-2xl bg-primary text-white flex flex-col items-center justify-center shrink-0"
        data-testid="countdown"
        :aria-label="countdown.aria"
        role="img"
      >
        <span class="text-[11px] font-semibold tracking-wider opacity-90">{{ countdown.top }}</span>
        <span class="text-[30px] font-bold leading-none">{{ countdown.big }}</span>
        <span class="text-[12px] opacity-90">{{ countdown.bottom }}</span>
      </div>
      <div class="min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-[12px] font-semibold px-2.5 py-0.5 rounded-full" :class="statusChip">{{ statusText }}</span>
          <span class="text-[12px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">{{ typeText }}</span>
        </div>
        <h2 class="mt-2 mb-1.5 text-[24px] leading-tight font-bold tracking-tight text-slate-900 break-words">{{ title }}</h2>
        <div class="flex flex-wrap gap-x-5 gap-y-1.5 text-[14px] text-slate-600">
          <span v-if="dateText" class="inline-flex items-center gap-1.5"><CalendarDays :size="16" aria-hidden="true" />{{ dateText }}</span>
          <span v-if="event.startTime" class="inline-flex items-center gap-1.5"><Clock :size="16" aria-hidden="true" />{{ timeText }}</span>
          <span v-if="place" class="inline-flex items-center gap-1.5 min-w-0"><MapPin :size="16" aria-hidden="true" class="shrink-0" /><span class="truncate">{{ place }}</span></span>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-3 items-start sm:items-end flex-[0_1_auto]">
      <EventSelector trigger-label="Changer d'événement" />
      <div class="flex flex-wrap gap-2 sm:justify-end">
        <router-link
          v-if="canAddGuest"
          :to="`/dashboard/events/${event.id}/guests/new`"
          class="inline-flex items-center gap-2 h-11 px-4 rounded-xl border border-slate-200 bg-white text-[14px] font-semibold text-slate-800 hover:bg-slate-50"
        ><UserPlus :size="16" aria-hidden="true" />Ajouter un invité</router-link>
        <router-link
          v-if="canCheckin"
          :to="`/dashboard/events/${event.id}/checkin`"
          class="inline-flex items-center gap-2 h-11 px-4 rounded-xl border border-slate-200 bg-white text-[14px] font-semibold text-slate-800 hover:bg-slate-50"
        ><ScanLine :size="16" aria-hidden="true" />Check-in</router-link>
        <router-link
          v-if="canSend"
          :to="`/dashboard/events/${event.id}/invitations/send`"
          class="inline-flex items-center gap-2 h-11 px-4 rounded-xl bg-primary text-white text-[14px] font-semibold hover:bg-primary-dark"
        ><Send :size="16" aria-hidden="true" />Envoyer les invitations</router-link>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CalendarDays, Clock, MapPin, ScanLine, Send, UserPlus } from 'lucide-vue-next'
import EventSelector from './EventSelector.vue'
import type { Event } from '../../api/events'
import { eventTypeLabel, statusLabel } from '../../utils/eventStatus'
import { daysUntil } from './dashboardMath'

const props = defineProps<{
  event: Event
  canAddGuest: boolean
  canCheckin: boolean
  canSend: boolean
}>()

const title = computed(() => props.event.weddingDetails?.displayName || props.event.name)
const typeText = computed(() => eventTypeLabel(props.event.type))
const statusText = computed(() => statusLabel(props.event.status) || 'Brouillon')
const statusChip = computed(() => {
  switch (props.event.status) {
    case 'PUBLISHED':
    case 'ACTIVE': return 'bg-green-50 text-green-700'
    case 'CANCELLED': return 'bg-red-50 text-red-700'
    case 'DRAFT': return 'bg-amber-50 text-amber-700'
    default: return 'bg-slate-100 text-slate-600'
  }
})

const dateText = computed(() => {
  if (!props.event.eventDate) return ''
  const d = new Date(`${props.event.eventDate}T00:00:00`)
  if (Number.isNaN(d.getTime())) return ''
  const s = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
})
const timeText = computed(() => (props.event.startTime ?? '').slice(0, 5).replace(':', 'h'))
const place = computed(() => [props.event.venueName, props.event.city].filter(Boolean).join(', '))

/** "J-moins 18 jours", "Aujourd'hui", "Terminé", or "Date à fixer". */
const countdown = computed(() => {
  const days = daysUntil(props.event.eventDate)
  if (days == null) return { top: 'DATE', big: '—', bottom: 'à fixer', aria: 'Date à fixer' }
  if (days > 1) return { top: 'J-MOINS', big: String(days), bottom: 'jours', aria: `Dans ${days} jours` }
  if (days === 1) return { top: 'J-MOINS', big: '1', bottom: 'jour', aria: 'Demain' }
  if (days === 0) return { top: 'JOUR J', big: '0', bottom: "aujourd'hui", aria: "Aujourd'hui" }
  return { top: 'PASSÉ', big: String(-days), bottom: -days > 1 ? 'jours' : 'jour', aria: `Il y a ${-days} jours` }
})
</script>
