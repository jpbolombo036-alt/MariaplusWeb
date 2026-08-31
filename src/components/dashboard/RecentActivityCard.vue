<template>
  <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
    <div class="px-6 py-4 flex items-center justify-between border-b border-slate-100">
      <span class="font-semibold text-slate-800 text-[15px]">Activité récente</span>
      <button class="flex items-center gap-1 text-sm text-primary font-semibold hover:underline">Voir tout
        <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
      </button>
    </div>

    <div v-if="!rows.length" class="px-6 py-10 text-center text-slate-400 text-sm">
      Aucune activité pour le moment.
    </div>

    <div v-else class="divide-y divide-slate-100">
      <div v-for="r in rows" :key="r.id" class="px-6 py-3.5 flex items-start gap-3 hover:bg-slate-50/60 transition-colors">
        <span class="w-8 h-8 rounded-lg bg-slate-50 grid place-items-center shrink-0 mt-0.5">
          <span class="material-symbols-outlined text-[18px]" :class="iconColor(r.type)">{{ r.icon }}</span>
        </span>
        <div class="min-w-0 flex-1">
          <div class="text-[13px] font-medium text-slate-800 leading-snug">{{ r.title }}</div>
          <div class="text-[12px] text-slate-500 mt-0.5 truncate">{{ r.subtitle }}</div>
        </div>
        <span class="text-[11px] text-slate-400 shrink-0 mt-0.5">{{ r.time }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ActivityRow {
  id: string
  type: 'guest' | 'invitation' | 'checkin' | 'table'
  icon: string
  title: string
  subtitle: string
  time: string
}

defineProps<{ rows: ActivityRow[] }>()

function iconColor(type: string) {
  switch (type) {
    case 'guest':
      return 'text-primary'
    case 'invitation':
      return 'text-amber-500'
    case 'checkin':
      return 'text-green-600'
    case 'table':
      return 'text-slate-600'
    default:
      return 'text-slate-400'
  }
}
</script>
