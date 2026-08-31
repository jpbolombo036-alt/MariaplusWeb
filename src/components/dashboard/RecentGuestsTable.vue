<template>
  <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
    <div class="px-6 py-4 flex items-center justify-between border-b border-slate-100">
      <span class="font-semibold text-slate-800 text-[15px]">Invités Récents</span>
      <button class="flex items-center gap-1.5 text-slate-400 hover:text-primary transition-colors">
        <span class="material-symbols-outlined text-[20px]">filter_alt</span>
      </button>
    </div>

    <div v-if="!rows.length" class="px-6 py-12 text-center text-slate-400 text-sm">
      Aucun invité pour cet événement pour l'instant.
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 bg-slate-50/60">
            <th class="px-6 py-3 font-medium">Invité</th>
            <th class="px-6 py-3 font-medium">Groupe</th>
            <th class="px-6 py-3 font-medium">Personnes</th>
            <th class="px-6 py-3 font-medium hidden sm:table-cell">Statut</th>
            <th class="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="r in rows" :key="r.id" class="hover:bg-slate-50/80 transition-colors">
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <span class="w-9 h-9 rounded-lg bg-primary-light text-primary grid place-items-center text-xs font-bold shrink-0">
                  {{ r.initials }}
                </span>
                <span class="font-semibold text-slate-700 text-[14px] whitespace-nowrap">{{ r.name }}</span>
              </div>
            </td>
            <td class="px-6 py-4 text-slate-500 text-[13px] whitespace-nowrap">{{ r.group || '—' }}</td>
            <td class="px-6 py-4 text-slate-700 text-[13px] whitespace-nowrap">{{ r.people ?? 0 }}</td>
            <td class="px-6 py-4 hidden sm:table-cell">
              <StatusBadge :status="r.status ?? 'PENDING'" :dot="true" />
            </td>
            <td class="px-6 py-4 text-right">
              <button class="text-slate-400 hover:text-primary p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <span class="material-symbols-outlined text-[20px]">more_vert</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import StatusBadge from '../common/StatusBadge.vue'

interface GuestRow {
  id: number
  name: string
  initials: string
  group?: string | null
  people?: number | null
  status?: string | null
}

defineProps<{ rows: GuestRow[] }>()
</script>
