<template>
  <div class="max-w-4xl mx-auto">
    <VenuePageHeader title="Taux de change" subtitle="Le taux du jour USD → CDF de votre salle, fixé par vous. Il est repris sur chaque paiement en autre devise." />

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div class="v-card p-5">
        <p class="text-[12px] font-semibold text-slate-500">Taux du jour</p>
        <template v-if="overview?.current">
          <p class="text-2xl font-bold text-slate-900 mt-1">1 USD = {{ formatRate(overview.current.cdfPerUsd) }} CDF</p>
          <p class="text-[12px] text-slate-500 mt-1">
            Fixé le {{ formatDateTime(overview.current.effectiveAt) }}<span v-if="overview.current.setByName"> par {{ overview.current.setByName }}</span>
          </p>
          <p v-if="isOld" class="mt-3 rounded-lg bg-attention-light text-attention text-[12px] px-3 py-2">
            Ce taux date de plus de 24 h : pensez à le mettre à jour avant d'encaisser en francs.
          </p>
        </template>
        <template v-else-if="!loading">
          <p class="text-xl font-bold text-slate-900 mt-1">Aucun taux défini</p>
          <p class="text-[12px] text-slate-500 mt-1">Sans taux du jour, chaque paiement en autre devise doit préciser son taux.</p>
        </template>
      </div>

      <form v-if="canManage" class="v-card p-5 space-y-3" @submit.prevent="save">
        <p class="text-[13px] font-bold text-slate-900">Nouveau taux</p>
        <label class="block">
          <span class="v-label">CDF pour 1 USD *</span>
          <input v-model.number="rate" required type="number" min="1" step="0.0001" class="v-input" aria-label="CDF pour 1 USD" />
        </label>
        <label class="block">
          <span class="v-label">Note</span>
          <input v-model.trim="note" maxlength="255" placeholder="Ex. taux du marché, taux banque…" class="v-input" />
        </label>
        <p v-if="preview" class="text-[12px] text-slate-500">{{ preview }}</p>
        <div class="flex justify-end">
          <button class="v-btn-primary" :disabled="saving || !rate">
            <span class="material-symbols-outlined text-[18px]">currency_exchange</span>
            Appliquer ce taux
          </button>
        </div>
      </form>
    </div>

    <div class="v-card">
      <div class="px-5 pt-5 pb-3"><h2 class="text-[16px] font-bold text-slate-900">Historique</h2></div>
      <p v-if="!overview?.history.length" class="px-5 pb-6 text-sm text-slate-500">Aucun taux enregistré.</p>
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead><tr class="bg-slate-50/80"><th class="v-th">Date</th><th class="v-th text-right">1 USD =</th><th class="v-th">Par</th><th class="v-th">Note</th></tr></thead>
          <tbody>
            <tr v-for="r in overview.history" :key="r.id" class="border-t border-slate-100">
              <td class="v-td whitespace-nowrap">{{ formatDateTime(r.effectiveAt) }}</td>
              <td class="v-td text-right font-semibold whitespace-nowrap">{{ formatRate(r.cdfPerUsd) }} CDF</td>
              <td class="v-td">{{ r.setByName || '—' }}</td>
              <td class="v-td">{{ r.note || '' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import VenuePageHeader from '../../components/venue/VenuePageHeader.vue'
import { useAuthStore } from '../../stores/auth'
import { useNotificationStore } from '../../stores/notifications'
import { Perm } from '../../permissions'
import { formatDateTime, getExchangeRate, setExchangeRate, type ExchangeRateOverview } from '../../api/venues'

const auth = useAuthStore()
const notify = useNotificationStore()
const canManage = computed(() => auth.can([Perm.venueManage]))
const overview = ref<ExchangeRateOverview | null>(null)
const loading = ref(true)
const saving = ref(false)
const rate = ref<number | undefined>(undefined)
const note = ref('')

const isOld = computed(() => {
  const at = overview.value?.current?.effectiveAt
  return !!at && Date.now() - new Date(at).getTime() > 24 * 3600 * 1000
})

const preview = computed(() => rate.value && rate.value > 0
  ? `100 USD = ${formatRate(rate.value * 100)} CDF · 100 000 CDF = ${(100000 / rate.value).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} USD`
  : '')

function formatRate(value: number): string {
  return Number(value).toLocaleString('fr-FR', { maximumFractionDigits: 4 }).replace(/ | /g, ' ')
}

async function save() {
  if (!rate.value) return
  saving.value = true
  try {
    overview.value = await setExchangeRate(rate.value, note.value || undefined)
    notify.push('Taux du jour mis à jour', 'success')
    rate.value = undefined
    note.value = ''
  } catch { /* message affiché par l'intercepteur */ } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    overview.value = await getExchangeRate()
  } finally {
    loading.value = false
  }
})
</script>
