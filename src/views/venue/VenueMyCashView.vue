<template>
  <div>
    <VenuePageHeader title="Ma caisse" subtitle="Ce que vous avez encaissé et dépensé, pour rapprocher votre caisse en fin de journée.">
      <input v-model="month" type="month" class="v-input !w-auto" aria-label="Mois" />
      <router-link v-if="auth.can([Perm.expenseRecord])" to="/dashboard/venue/expenses?new=1" class="v-btn">
        <span class="material-symbols-outlined text-[18px]">remove_circle_outline</span>
        Nouvelle dépense
      </router-link>
      <router-link v-if="auth.can([Perm.bookingManage])" to="/dashboard/venue/bookings/new" class="v-btn-primary">
        <span class="material-symbols-outlined text-[18px]">add</span>
        Nouvelle réservation
      </router-link>
    </VenuePageHeader>

    <div v-if="loading && !cash" class="py-16 text-center text-slate-400 text-sm">Chargement…</div>

    <template v-else-if="cash">
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div class="v-card p-5">
          <p class="text-[12px] font-semibold text-slate-500">Encaissé aujourd'hui</p>
          <p v-for="c in cash.today" :key="c.currency" class="text-2xl font-bold text-slate-900 mt-1">{{ formatMoney(c.amount, c.currency) }}</p>
          <p v-if="!cash.today.length" class="text-2xl font-bold text-slate-900 mt-1">{{ formatMoney(0, 'USD') }}</p>
          <p class="text-[11.5px] text-slate-500 mt-1">{{ todayLabel }}</p>
        </div>
        <div class="v-card p-5">
          <p class="text-[12px] font-semibold text-slate-500">Encaissé sur le mois</p>
          <p v-for="c in cash.collected" :key="c.currency" class="text-2xl font-bold text-slate-900 mt-1">{{ formatMoney(c.amount, c.currency) }}</p>
          <p v-if="!cash.collected.length" class="text-2xl font-bold text-slate-900 mt-1">{{ formatMoney(0, 'USD') }}</p>
          <p class="text-[11.5px] text-slate-500 mt-1">
            {{ cash.paymentCount }} paiement(s)<template v-if="cash.refundCount">, <span class="text-error">{{ cash.refundCount }} remboursement(s)</span></template>
          </p>
        </div>
        <div class="v-card p-5">
          <p class="text-[12px] font-semibold text-slate-500">Dépensé sur le mois</p>
          <p v-for="c in cash.spent ?? []" :key="'s' + c.currency" class="text-2xl font-bold text-error mt-1">− {{ formatMoney(c.amount, c.currency) }}</p>
          <p v-if="!(cash.spent ?? []).length" class="text-2xl font-bold text-slate-900 mt-1">{{ formatMoney(0, 'USD') }}</p>
          <p class="text-[11.5px] text-slate-500 mt-1">{{ cash.expenseCount ?? 0 }} dépense(s) que vous avez payée(s)</p>
        </div>
        <div class="v-card p-5 border-primary/30 bg-primary-light/40">
          <p class="text-[12px] font-semibold text-primary">Solde de la période</p>
          <p v-for="c in cash.balance ?? cash.collected" :key="'b' + c.currency" class="text-2xl font-bold mt-1" :class="c.amount < 0 ? 'text-error' : 'text-slate-900'">{{ formatMoney(c.amount, c.currency) }}</p>
          <p v-if="!(cash.balance ?? cash.collected).length" class="text-2xl font-bold text-slate-900 mt-1">{{ formatMoney(0, 'USD') }}</p>
          <p class="text-[11.5px] text-slate-500 mt-1">Encaissé − dépensé, par devise</p>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div class="v-card">
          <div class="px-5 pt-5 pb-3"><h2 class="text-[16px] font-bold text-slate-900">Par mode de paiement</h2></div>
          <p v-if="!cash.byMethod.length" class="px-5 pb-6 text-sm text-slate-500">Aucun mouvement sur la période.</p>
          <table v-else class="w-full">
            <tbody>
              <tr v-for="m in cash.byMethod" :key="m.method + m.currency" class="border-t border-slate-100">
                <td class="v-td">
                  <span class="font-semibold text-slate-900">{{ PAYMENT_METHOD_LABELS[m.method] }}</span>
                  <div class="text-[11px] text-slate-400">{{ m.count }} mouvement(s)</div>
                </td>
                <td class="v-td text-right whitespace-nowrap font-semibold">{{ formatMoney(m.amount, m.currency) }}</td>
              </tr>
            </tbody>
          </table>
          <p class="px-5 py-3 text-[11.5px] text-slate-500 border-t border-slate-100">
            Encaissé moins remboursé et dépensé. Les espèces doivent être en caisse ; le Mobile Money sur le compte de la salle.
          </p>
        </div>

        <div class="v-card xl:col-span-2">
          <div class="px-5 pt-5 pb-3 flex items-center justify-between">
            <h2 class="text-[16px] font-bold text-slate-900">Mes encaissements</h2>
            <span class="text-[12px] text-slate-500">{{ cash.movements.length }} mouvement(s)</span>
          </div>
          <p v-if="!cash.movements.length" class="px-5 pb-6 text-sm text-slate-500">Vous n'avez encore rien encaissé sur cette période.</p>
          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-slate-50/80">
                  <th class="v-th">Date</th><th class="v-th">Reçu</th><th class="v-th">Réservation</th><th class="v-th">Client</th>
                  <th class="v-th">Mode</th><th class="v-th text-right">Montant</th><th class="v-th" />
                </tr>
              </thead>
              <tbody>
                <tr v-for="l in cash.movements" :key="l.paymentId" class="border-t border-slate-100">
                  <td class="v-td whitespace-nowrap">{{ formatDateTime(l.paidAt) }}</td>
                  <td class="v-td font-semibold whitespace-nowrap">
                    {{ l.receiptNumber }}
                    <div v-if="l.kind === 'REFUND'" class="text-[11px] font-bold text-error">Remboursement</div>
                  </td>
                  <td class="v-td whitespace-nowrap">
                    <router-link :to="`/dashboard/venue/bookings/${l.bookingId}`" class="text-primary font-semibold">{{ l.bookingReference }}</router-link>
                    <div class="text-[11px] text-slate-400">{{ l.venueName }}</div>
                  </td>
                  <td class="v-td">{{ l.clientName }}</td>
                  <td class="v-td">{{ PAYMENT_METHOD_LABELS[l.method] }}<div v-if="l.reference" class="text-[11px] text-slate-400">{{ l.reference }}</div></td>
                  <td class="v-td text-right whitespace-nowrap font-semibold" :class="{ 'text-error': l.kind === 'REFUND' }">
                    {{ l.kind === 'REFUND' ? '− ' : '' }}{{ formatMoney(l.amount, l.currency) }}
                  </td>
                  <td class="v-td text-right">
                    <button class="text-slate-500 hover:text-primary" :aria-label="`Reçu ${l.receiptNumber}`" title="Reçu PDF" @click="openBookingPdf(l.bookingId, l.paymentId).catch(() => null)">
                      <span class="material-symbols-outlined text-[18px]">receipt_long</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div v-if="(cash.expenses ?? []).length" class="v-card mb-6">
        <div class="px-5 pt-5 pb-3 flex items-center justify-between">
          <h2 class="text-[16px] font-bold text-slate-900">Mes dépenses</h2>
          <router-link to="/dashboard/venue/expenses" class="text-[12px] font-semibold text-primary">Tout voir</router-link>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead><tr class="bg-slate-50/80"><th class="v-th">Date</th><th class="v-th">Poste</th><th class="v-th">Libellé</th><th class="v-th">Mode</th><th class="v-th text-right">Montant</th></tr></thead>
            <tbody>
              <tr v-for="e in cash.expenses" :key="e.id" class="border-t border-slate-100">
                <td class="v-td whitespace-nowrap">{{ formatDateTime(e.spentAt) }}</td>
                <td class="v-td whitespace-nowrap">{{ EXPENSE_CATEGORY_LABELS[e.category] }}</td>
                <td class="v-td">{{ e.label }}<div class="text-[11px] text-slate-400">{{ e.venueName || 'Toutes les salles' }}</div></td>
                <td class="v-td">{{ PAYMENT_METHOD_LABELS[e.method] }}</td>
                <td class="v-td text-right whitespace-nowrap font-semibold text-error">− {{ formatMoney(e.amount, e.currency) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="v-card">
        <div class="px-5 pt-5 pb-3 flex items-center justify-between">
          <h2 class="text-[16px] font-bold text-slate-900">Réservations des 7 prochains jours</h2>
          <router-link to="/dashboard/venue/bookings" class="text-[12px] font-semibold text-primary">Tout voir</router-link>
        </div>
        <p v-if="!cash.upcoming.length" class="px-5 pb-6 text-sm text-slate-500">Aucune réservation dans les 7 prochains jours.</p>
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead><tr class="bg-slate-50/80"><th class="v-th">Date</th><th class="v-th">Client</th><th class="v-th">Statut</th><th class="v-th text-right">Reste à payer</th></tr></thead>
            <tbody>
              <tr v-for="b in cash.upcoming" :key="b.id" class="border-t border-slate-100 hover:bg-primary-light/30 cursor-pointer" @click="$router.push(`/dashboard/venue/bookings/${b.id}`)">
                <td class="v-td whitespace-nowrap">{{ formatDateTime(b.startAt) }}<div class="text-[11px] text-slate-400">{{ b.venueName }}</div></td>
                <td class="v-td">{{ b.clientName }}<div class="text-[11px] text-slate-400">{{ b.clientPhone }}</div></td>
                <td class="v-td"><BookingStatusBadge :status="b.status" /></td>
                <td class="v-td text-right whitespace-nowrap font-semibold" :class="b.balance > 0 ? 'text-error' : 'text-success'">{{ formatMoney(b.balance, b.currency) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import VenuePageHeader from '../../components/venue/VenuePageHeader.vue'
import BookingStatusBadge from '../../components/venue/BookingStatusBadge.vue'
import { useAuthStore } from '../../stores/auth'
import { Perm } from '../../permissions'
import {
  EXPENSE_CATEGORY_LABELS, PAYMENT_METHOD_LABELS, formatDateTime, formatMoney, getMyCash, openBookingPdf, type CashierSummary,
} from '../../api/venues'

const auth = useAuthStore()
const now = new Date()
const month = ref(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
const cash = ref<CashierSummary | null>(null)
const loading = ref(false)
const todayLabel = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

const period = computed(() => {
  const [y, m] = month.value.split('-').map(Number)
  const last = new Date(y, m, 0).getDate()
  return { from: `${month.value}-01`, to: `${month.value}-${String(last).padStart(2, '0')}` }
})

async function load() {
  loading.value = true
  try {
    cash.value = await getMyCash(period.value)
  } finally {
    loading.value = false
  }
}

watch(month, load)
onMounted(load)
</script>
