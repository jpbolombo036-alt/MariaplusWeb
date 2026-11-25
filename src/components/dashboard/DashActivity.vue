<template>
  <section class="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-4 min-w-0" aria-labelledby="activity-title">
    <h3 id="activity-title" class="m-0 text-[16px] font-semibold text-slate-900">Activité</h3>
    <p v-if="!items.length" class="m-0 text-[14px] text-slate-600">Aucune activité pour le moment.</p>
    <ul v-else class="list-none m-0 p-0 flex flex-col gap-4" data-testid="activity">
      <li v-for="item in items" :key="item.id" class="flex gap-3">
        <span class="w-8 h-8 rounded-lg grid place-items-center shrink-0" :class="TONE_CHIP[item.tone]">
          <component :is="item.icon" :size="16" :stroke-width="2" aria-hidden="true" />
        </span>
        <div class="flex-1 min-w-0">
          <div class="text-[14px] text-slate-900 break-words">{{ item.text }}</div>
          <div class="text-[12px] text-slate-600 mt-0.5">{{ item.time }}</div>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  CalendarDays, Check, Mail, PencilLine, ScanLine, Send, Tag, Trash2, Upload, UserPlus, Users, LayoutGrid, Wine,
} from 'lucide-vue-next'
import type { Component } from 'vue'
import type { ActivityItem } from '../../api/dashboard'
import { TONE_CHIP, type Tone } from './tones'

const props = defineProps<{ activity: ActivityItem[] }>()

/** Readable sentence, icon and tone for an audit action; details (already French) win when present. */
const LABELS: Record<string, { text: string; icon: Component; tone: Tone }> = {
  GUEST_CREATE: { text: 'Invité ajouté', icon: UserPlus, tone: 'primary' },
  GUEST_UPDATE: { text: 'Invité modifié', icon: PencilLine, tone: 'slate' },
  GUEST_IMPORT: { text: 'Invités importés', icon: Upload, tone: 'primary' },
  GUEST_CATEGORY_CREATE: { text: 'Catégorie créée', icon: Tag, tone: 'slate' },
  GUEST_CATEGORY_UPDATE: { text: 'Catégorie modifiée', icon: Tag, tone: 'slate' },
  INVITATION_CREATE: { text: 'Invitation créée', icon: Mail, tone: 'primary' },
  INVITATION_UPDATE: { text: 'Invitation modifiée', icon: Mail, tone: 'slate' },
  INVITATION_SEND: { text: 'Invitation envoyée', icon: Send, tone: 'green' },
  INVITATION_RESEND: { text: 'Invitation relancée', icon: Send, tone: 'amber' },
  INVITATION_BULK_SEND: { text: 'Envoi groupé par WhatsApp', icon: Send, tone: 'green' },
  INVITATION_CANCEL: { text: 'Invitation annulée', icon: Trash2, tone: 'red' },
  CHECKIN_CREATE: { text: 'Arrivée enregistrée', icon: ScanLine, tone: 'green' },
  CHECKIN_SYNC: { text: 'Arrivées synchronisées', icon: ScanLine, tone: 'green' },
  CHECKIN_CANCEL: { text: 'Arrivée annulée', icon: ScanLine, tone: 'red' },
  TABLE_CREATE: { text: 'Table créée', icon: LayoutGrid, tone: 'blue' },
  TABLE_UPDATE: { text: 'Table modifiée', icon: LayoutGrid, tone: 'blue' },
  TABLE_DELETE: { text: 'Table supprimée', icon: LayoutGrid, tone: 'red' },
  TABLE_ASSIGN: { text: 'Invité placé à une table', icon: LayoutGrid, tone: 'blue' },
  TABLE_UNASSIGN: { text: 'Invité retiré d\'une table', icon: LayoutGrid, tone: 'slate' },
  TABLE_MOVE: { text: 'Invité déplacé', icon: LayoutGrid, tone: 'blue' },
  EVENT_CREATE: { text: 'Événement créé', icon: CalendarDays, tone: 'primary' },
  EVENT_UPDATE: { text: 'Événement modifié', icon: CalendarDays, tone: 'slate' },
  EVENT_STATUS: { text: 'Statut de l\'événement changé', icon: Check, tone: 'green' },
  EVENT_SESSION_CREATE: { text: 'Moment ajouté au programme', icon: CalendarDays, tone: 'primary' },
  EVENT_SESSION_UPDATE: { text: 'Programme modifié', icon: CalendarDays, tone: 'slate' },
  DRINK_CREATE: { text: 'Boisson ajoutée', icon: Wine, tone: 'slate' },
  DRINK_UPDATE: { text: 'Boisson modifiée', icon: Wine, tone: 'slate' },
  MEMBER_UPDATE: { text: 'Équipe modifiée', icon: Users, tone: 'slate' },
}

const items = computed(() => props.activity.slice(0, 6).map((a) => {
  const known = LABELS[a.action] ?? { text: a.action, icon: Check, tone: 'slate' as Tone }
  return { id: a.id, text: a.details || known.text, icon: known.icon, tone: known.tone, time: relativeTime(a.performedAt) }
}))

/** "à l'instant", "il y a 12 min", "hier, 18h20", "12/09, 18h00". */
function relativeTime(iso: string): string {
  const d = new Date(iso)
  if (!iso || Number.isNaN(d.getTime())) return ''
  const minutes = Math.round((Date.now() - d.getTime()) / 60_000)
  const hhmm = `${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`
  if (minutes < 1) return 'à l\'instant'
  if (minutes < 60) return `il y a ${minutes} min`
  const today = new Date()
  const sameDay = (x: Date, y: Date) => x.toDateString() === y.toDateString()
  if (sameDay(d, today)) return `aujourd'hui, ${hhmm}`
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (sameDay(d, yesterday)) return `hier, ${hhmm}`
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}, ${hhmm}`
}
</script>
