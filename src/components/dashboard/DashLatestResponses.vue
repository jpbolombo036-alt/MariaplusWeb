<template>
  <section class="bg-white border border-slate-200 rounded-2xl py-2 flex flex-col min-w-0" aria-labelledby="latest-title">
    <div class="flex items-center justify-between gap-3 px-6 pt-4 pb-3">
      <h3 id="latest-title" class="m-0 text-[16px] font-semibold text-slate-900">Dernières réponses</h3>
      <router-link v-if="link" :to="link" class="text-[14px] font-semibold text-primary hover:underline">Tous les invités</router-link>
    </div>
    <p v-if="!rows.length" class="m-0 px-6 pb-5 text-[14px] text-slate-600">
      Aucune réponse pour le moment. Elles apparaîtront ici dès que vos invités répondront.
    </p>
    <div v-else class="overflow-x-auto">
      <table class="w-full border-collapse text-[14px]" data-testid="latest-responses">
        <thead>
          <tr class="text-left text-[12px] uppercase tracking-wider text-slate-600">
            <th scope="col" class="py-2.5 px-6 font-semibold">Invité</th>
            <th scope="col" class="py-2.5 px-3 font-semibold">Catégorie</th>
            <th scope="col" class="py-2.5 px-3 font-semibold">Pers.</th>
            <th scope="col" class="py-2.5 px-6 font-semibold">Réponse</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id" class="border-t border-slate-100">
            <td class="py-3 px-6">
              <div class="flex items-center gap-2.5 min-w-0">
                <span class="w-8 h-8 rounded-full grid place-items-center text-[12px] font-semibold shrink-0 bg-primary-light text-primary">{{ row.initials }}</span>
                <span class="font-medium text-slate-900 truncate">{{ row.name }}</span>
              </div>
            </td>
            <td class="py-3 px-3 text-slate-600">{{ row.category || '—' }}</td>
            <td class="py-3 px-3 text-slate-900">{{ row.accepted ? row.people : '—' }}</td>
            <td class="py-3 px-6">
              <span
                class="inline-flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-full"
                :class="row.accepted ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'"
              >
                <component :is="row.accepted ? Check : X" :size="12" :stroke-width="2.5" aria-hidden="true" />
                {{ row.accepted ? 'Acceptée' : 'Refusée' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Check, X } from 'lucide-vue-next'

export interface LatestResponseRow {
  id: number
  name: string
  initials: string
  category?: string | null
  people: number
  accepted: boolean
}

defineProps<{ rows: LatestResponseRow[]; link?: string }>()
</script>
