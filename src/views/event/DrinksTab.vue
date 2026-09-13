<template>
  <div>
    <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-5">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 class="text-[22px] font-bold text-slate-900 tracking-tight">Boissons disponibles</h2>
          <p class="text-[13px] text-slate-500 mt-0.5 font-medium">
            {{ availableCount }} disponible(s) sur {{ drinks.length }} du catalogue — vos invités ne verront que les boissons déclarées disponibles.
          </p>
        </div>
        <span class="inline-flex items-center gap-1.5 text-[12px] text-slate-400 self-start md:self-auto">
          <span class="material-symbols-outlined text-[16px]">info</span>
          Le catalogue est géré par le SUPER_ADMIN
        </span>
      </div>
    </div>

    <div v-if="loading" class="text-on-surface-variant">Chargement…</div>

    <div v-else-if="drinks.length === 0" class="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl p-10 text-center">
      <div class="w-16 h-16 mx-auto rounded-full bg-surface-container-high grid place-items-center mb-4"><span class="material-symbols-outlined text-3xl text-on-surface-variant">local_bar</span></div>
      <h3 class="font-semibold text-on-surface">Catalogue vide</h3>
      <p class="text-sm text-on-surface-variant mt-1">Aucune boisson n'a encore été créée dans le catalogue de la plateforme (SUPER_ADMIN).</p>
    </div>

    <div v-else class="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-surface-container text-left text-on-surface-variant">
          <tr>
            <th class="px-5 py-3.5">Boisson du catalogue</th>
            <th class="px-5 py-3.5">Statut catalogue</th>
            <th class="px-5 py-3.5 text-right">Disponible pour les invités</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-outline-variant">
          <tr v-for="d in drinks" :key="d.catalogItemId" class="text-on-surface hover:bg-surface-container/40" :class="{ 'opacity-60': !d.active }">
            <td class="px-5 py-3.5">
              <div class="flex items-center gap-3">
                <img v-if="d.imageUrl" :src="absUrl(d.imageUrl)" :alt="d.name" class="w-10 h-10 rounded-lg object-cover bg-surface-container-high" />
                <span v-else class="w-10 h-10 rounded-lg bg-surface-container-high grid place-items-center text-on-surface-variant"><span class="material-symbols-outlined text-base">local_bar</span></span>
                <div class="min-w-0">
                  <span class="font-medium">{{ d.name }}</span>
                  <p class="text-[12px] text-on-surface-variant truncate">{{ d.description || '—' }}</p>
                </div>
              </div>
            </td>
            <td class="px-5 py-3.5"><StatusBadge :status="d.active ? 'ACTIVE' : 'INACTIVE'" /></td>
            <td class="px-5 py-3.5 text-right">
              <button
                :disabled="busyId === d.catalogItemId || !d.active"
                class="h-9 px-4 rounded-lg border text-[12px] font-bold transition-colors disabled:opacity-40"
                :class="d.available
                  ? 'bg-success text-white border-success shadow-sm shadow-success/20'
                  : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'"
                @click="toggle(d)"
              >
                <span class="material-symbols-outlined text-[15px] align-[-3px]">{{ d.available ? 'check_circle' : 'add_circle' }}</span>
                {{ d.available ? 'Disponible' : 'Rendre disponible' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import StatusBadge from '../../components/common/StatusBadge.vue'
import { listAvailableDrinks, toggleAvailableDrink, type AvailableDrink } from '../../api/availableDrinks'
import { ApiConfig } from '../../api/config'

const route = useRoute()
const eventId = Number(route.params.id)
const drinks = ref<AvailableDrink[]>([])
const loading = ref(false)
const busyId = ref<number | null>(null)

const availableCount = computed(() => drinks.value.filter((d) => d.available && d.active).length)

function absUrl(u: string): string {
  if (/^https?:\/\//i.test(u) || u.startsWith('blob:')) return u
  return u.startsWith('/') ? `${ApiConfig.baseUrl}${u}` : u
}

async function load() {
  loading.value = true
  try {
    drinks.value = await listAvailableDrinks(eventId)
  } finally {
    loading.value = false
  }
}

async function toggle(d: AvailableDrink) {
  busyId.value = d.catalogItemId
  try {
    const updated = await toggleAvailableDrink(eventId, d.catalogItemId, !d.available)
    d.available = updated.available
  } finally {
    busyId.value = null
  }
}

onMounted(load)
</script>