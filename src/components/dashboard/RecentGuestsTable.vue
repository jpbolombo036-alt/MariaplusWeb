<template>
  <div class="bg-white border border-outline-variant/60 rounded-card overflow-hidden shadow-card">
    <div class="px-5 py-4 flex items-center justify-between border-b border-outline-variant/40">
      <span class="font-semibold text-on-surface">Invités Récents</span>
      <button class="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors">
        <span class="material-symbols-outlined text-base">filter_alt</span>
      </button>
    </div>

    <div v-if="!rows.length" class="px-5 py-10 text-center text-on-surface-variant text-sm">
      Aucun invité pour cet événement pour l'instant.
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-[11px] uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/40 bg-surface-container-low/50">
            <th class="px-5 py-3 font-medium">Invité</th>
            <th class="px-5 py-3 font-medium">Groupe</th>
            <th class="px-5 py-3 font-medium">Personnes</th>
            <th class="px-5 py-3 font-medium hidden sm:table-cell">Statut</th>
            <th class="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-outline-variant/40">
          <tr v-for="r in rows" :key="r.id" class="hover:bg-surface-container-low/40">
            <td class="px-5 py-3">
              <div class="flex items-center gap-3">
                <span class="w-9 h-9 rounded-full bg-primary-light text-primary grid place-items-center text-xs font-bold shrink-0">
                  {{ r.initials }}
                </span>
                <span class="font-medium text-on-surface whitespace-nowrap">{{ r.name }}</span>
              </div>
            </td>
            <td class="px-5 py-3 text-on-surface-variant whitespace-nowrap">{{ r.group || '—' }}</td>
            <td class="px-5 py-3 text-on-surface whitespace-nowrap">{{ r.people ?? 0 }}</td>
            <td class="px-5 py-3 hidden sm:table-cell">
              <StatusBadge :status="r.status ?? 'PENDING'" :dot="true" />
            </td>
            <td class="px-5 py-3 text-right">
              <button class="text-on-surface-variant hover:text-primary p-1 rounded-full hover:bg-surface-container-low">
                <span class="material-symbols-outlined text-base">more_vert</span>
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
