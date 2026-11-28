<template>
  <div>
    <VenuePageHeader title="Dépenses" :subtitle="canManage ? 'Les sorties d\'argent de vos salles, par poste.' : 'Les dépenses que vous avez payées.'">
      <input v-model="month" type="month" class="v-input !w-auto" aria-label="Mois" />
      <select v-if="canManage && venues.length > 1" v-model="venueId" class="v-input !w-auto" aria-label="Salle">
        <option :value="undefined">Toutes les salles</option>
        <option v-for="v in venues" :key="v.id" :value="v.id">{{ v.name }}</option>
      </select>
      <button class="v-btn-primary" @click="openForm()">
        <span class="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
        Nouvelle dépense
      </button>
    </VenuePageHeader>

    <div v-if="loading && !data" class="py-16 text-center text-slate-400 text-sm">Chargement…</div>

    <template v-else-if="data">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div class="v-card p-5">
          <p class="text-[12px] font-semibold text-slate-500">Dépensé {{ monthLabel }}</p>
          <p v-for="t in data.total" :key="t.currency" class="text-2xl font-bold text-error mt-1">{{ formatMoney(t.amount, t.currency) }}</p>
          <p v-if="!data.total.length" class="text-2xl font-bold text-slate-900 mt-1">{{ formatMoney(0, 'USD') }}</p>
          <p class="text-[11.5px] text-slate-500 mt-1">{{ data.items.length }} dépense(s){{ category ? ' · ' + EXPENSE_CATEGORY_LABELS[category] : '' }}</p>
        </div>

        <div class="v-card p-5 lg:col-span-2">
          <div class="flex items-center justify-between mb-3">
            <p class="text-[13px] font-bold text-slate-900">Par poste</p>
            <button v-if="category" class="text-[12px] font-semibold text-primary" @click="category = undefined">Tous les postes</button>
          </div>
          <p v-if="!data.byCategory.length" class="text-sm text-slate-500">Aucune dépense sur la période.</p>
          <ul v-else class="space-y-2.5">
            <li v-for="c in data.byCategory" :key="c.category + c.currency">
              <button type="button" class="w-full text-left group" :aria-pressed="category === c.category" @click="category = category === c.category ? undefined : c.category">
                <span class="flex items-center justify-between gap-3 text-[13px]">
                  <span class="flex items-center gap-2 font-medium text-slate-700 group-hover:text-primary">
                    <span class="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">{{ EXPENSE_CATEGORY_ICONS[c.category] }}</span>
                    {{ EXPENSE_CATEGORY_LABELS[c.category] }}
                    <span class="text-[11px] text-slate-400">{{ c.count }}</span>
                  </span>
                  <span class="font-semibold text-slate-900 whitespace-nowrap">{{ formatMoney(c.amount, c.currency) }}</span>
                </span>
                <span class="mt-1 block h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <span class="block h-full rounded-full transition-all" :class="category === c.category ? 'bg-primary' : 'bg-primary/60'" :style="{ width: share(c) + '%' }" />
                </span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div class="v-card">
        <div class="px-5 pt-5 pb-3 flex items-center justify-between">
          <h2 class="text-[16px] font-bold text-slate-900">{{ canManage ? 'Toutes les dépenses' : 'Mes dépenses' }}</h2>
          <span class="text-[12px] text-slate-500">{{ data.items.length }} ligne(s)</span>
        </div>
        <div v-if="!data.items.length" class="px-5 pb-8 pt-2 text-center">
          <p class="text-sm text-slate-500">Aucune dépense sur cette période.</p>
          <button class="v-btn mt-3" @click="openForm()">Enregistrer une dépense</button>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-slate-50/80">
                <th class="v-th">Date</th><th class="v-th">Poste</th><th class="v-th">Libellé</th><th class="v-th">Mode</th>
                <th v-if="canManage" class="v-th">Saisie par</th><th class="v-th text-right">Montant</th><th v-if="canManage" class="v-th" />
              </tr>
            </thead>
            <tbody>
              <tr v-for="e in data.items" :key="e.id" class="border-t border-slate-100">
                <td class="v-td whitespace-nowrap">{{ formatDateTime(e.spentAt) }}</td>
                <td class="v-td whitespace-nowrap">
                  <span class="inline-flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[16px] text-primary" aria-hidden="true">{{ EXPENSE_CATEGORY_ICONS[e.category] }}</span>
                    {{ EXPENSE_CATEGORY_LABELS[e.category] }}
                  </span>
                </td>
                <td class="v-td">
                  <span class="font-semibold text-slate-900">{{ e.label }}</span>
                  <div class="text-[11px] text-slate-400">{{ e.venueName || 'Toutes les salles' }}<template v-if="e.note"> · {{ e.note }}</template></div>
                </td>
                <td class="v-td whitespace-nowrap">{{ PAYMENT_METHOD_LABELS[e.method] }}<div v-if="e.reference" class="text-[11px] text-slate-400">{{ e.reference }}</div></td>
                <td v-if="canManage" class="v-td whitespace-nowrap">{{ e.recordedByName || '—' }}</td>
                <td class="v-td text-right whitespace-nowrap font-semibold text-error">− {{ formatMoney(e.amount, e.currency) }}</td>
                <td v-if="canManage" class="v-td text-right whitespace-nowrap">
                  <button class="p-1 text-slate-500 hover:text-primary" :aria-label="`Modifier ${e.label}`" title="Modifier" @click="openForm(e)">
                    <span class="material-symbols-outlined text-[18px]" aria-hidden="true">edit</span>
                  </button>
                  <button class="p-1 text-slate-500 hover:text-error" :aria-label="`Annuler ${e.label}`" title="Annuler la dépense" @click="cancelDialog = { expense: e, reason: '' }">
                    <span class="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="!canManage" class="px-5 py-3 text-[11.5px] text-slate-500 border-t border-slate-100">
          Une erreur ? Demandez au gérant de corriger ou d'annuler la dépense. Les dépenses en espèces sont déduites de votre caisse.
        </p>
      </div>
    </template>

    <!-- Saisie / modification -->
    <div v-if="form" class="fixed inset-0 z-50 bg-slate-900/40 grid place-items-center p-4 overflow-y-auto" @click.self="form = null">
      <form class="v-card w-full max-w-xl p-6 space-y-4 my-8" role="dialog" aria-modal="true" :aria-label="form.id ? 'Modifier la dépense' : 'Nouvelle dépense'" @submit.prevent="save">
        <h2 class="text-[18px] font-bold text-slate-900">{{ form.id ? 'Modifier la dépense' : 'Nouvelle dépense' }}</h2>

        <fieldset>
          <legend class="v-label">Poste</legend>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <label v-for="(label, key) in EXPENSE_CATEGORY_LABELS" :key="key"
              class="cursor-pointer rounded-lg border px-2.5 py-2 flex items-center gap-2 text-[12.5px] font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/40"
              :class="form.category === key ? 'border-primary bg-primary-light text-primary' : 'border-slate-200 text-slate-700 hover:border-primary/40'">
              <input v-model="form.category" type="radio" name="expense-category" :value="key" class="sr-only" />
              <span class="material-symbols-outlined text-[18px]" aria-hidden="true">{{ EXPENSE_CATEGORY_ICONS[key] }}</span>
              {{ label }}
            </label>
          </div>
        </fieldset>

        <label class="block">
          <span class="v-label">Libellé *</span>
          <input v-model.trim="form.label" required maxlength="200" :placeholder="EXPENSE_CATEGORY_HINTS[form.category]" class="v-input" />
        </label>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label class="block">
            <span class="v-label">Montant *</span>
            <input v-model.number="form.amount" required type="number" min="0.01" step="0.01" class="v-input" />
          </label>
          <label class="block">
            <span class="v-label">Devise</span>
            <select v-model="form.currency" class="v-input"><option value="USD">USD</option><option value="CDF">CDF</option></select>
          </label>
          <label class="block">
            <span class="v-label">Payé par</span>
            <select v-model="form.method" class="v-input">
              <option v-for="(label, key) in PAYMENT_METHOD_LABELS" :key="key" :value="key">{{ label }}</option>
            </select>
          </label>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label class="block">
            <span class="v-label">Date</span>
            <input v-model="form.spentAt" type="datetime-local" class="v-input" />
          </label>
          <label class="block">
            <span class="v-label">Salle</span>
            <select v-model="form.venueId" class="v-input">
              <option :value="null">Toutes les salles</option>
              <option v-for="v in venues" :key="v.id" :value="v.id">{{ v.name }}</option>
            </select>
          </label>
          <label class="block">
            <span class="v-label">Référence</span>
            <input v-model.trim="form.reference" maxlength="100" placeholder="N° de facture ou de transaction" class="v-input" />
          </label>
          <label class="block">
            <span class="v-label">Note</span>
            <input v-model.trim="form.note" maxlength="500" class="v-input" />
          </label>
        </div>

        <p v-if="form.method === 'ESPECES' && !form.id" class="text-[12px] text-slate-500">Payée en espèces : elle sera déduite de votre caisse.</p>
        <p v-if="formError" role="alert" class="text-[13px] text-error">{{ formError }}</p>

        <div class="flex justify-end gap-2 pt-1">
          <button type="button" class="v-btn" @click="form = null">Fermer</button>
          <button class="v-btn-primary" :disabled="saving">{{ saving ? 'Enregistrement…' : form.id ? 'Enregistrer' : 'Ajouter la dépense' }}</button>
        </div>
      </form>
    </div>

    <!-- Annulation -->
    <div v-if="cancelDialog" class="fixed inset-0 z-50 bg-slate-900/40 grid place-items-center p-4" @click.self="cancelDialog = null">
      <form class="v-card w-full max-w-md p-6 space-y-4" role="dialog" aria-modal="true" aria-label="Annuler la dépense" @submit.prevent="confirmCancel">
        <h2 class="text-[18px] font-bold text-slate-900">Annuler cette dépense ?</h2>
        <p class="text-[13px] text-slate-600">
          <strong>{{ cancelDialog.expense.label }}</strong> — {{ formatMoney(cancelDialog.expense.amount, cancelDialog.expense.currency) }}.
          Elle sortira des totaux ; l'historique garde la trace de l'annulation.
        </p>
        <label class="block">
          <span class="v-label">Motif</span>
          <input v-model.trim="cancelDialog.reason" maxlength="200" placeholder="Ex. saisie en double" class="v-input" />
        </label>
        <div class="flex justify-end gap-2">
          <button type="button" class="v-btn" @click="cancelDialog = null">Garder</button>
          <button class="v-btn-danger" :disabled="saving">Annuler la dépense</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VenuePageHeader from '../../components/venue/VenuePageHeader.vue'
import { useAuthStore } from '../../stores/auth'
import { useNotificationStore } from '../../stores/notifications'
import { Perm } from '../../permissions'
import { apiErrorMessage } from '../../api/http'
import {
  EXPENSE_CATEGORY_HINTS, EXPENSE_CATEGORY_ICONS, EXPENSE_CATEGORY_LABELS, PAYMENT_METHOD_LABELS,
  cancelExpense, createExpense, formatDateTime, formatMoney, listExpenses, listVenues, toApiDateTime, toLocalInput,
  updateExpense,
  type ExpenseCategory, type ExpenseCategoryTotal, type ExpenseList, type ExpensePayload, type PaymentMethod,
  type Venue, type VenueCurrency, type VenueExpense,
} from '../../api/venues'

const auth = useAuthStore()
const notify = useNotificationStore()
const route = useRoute()
const router = useRouter()
const canManage = computed(() => auth.can([Perm.expenseManage]))

const now = new Date()
const month = ref(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
const venueId = ref<number | undefined>(undefined)
const category = ref<ExpenseCategory | undefined>(undefined)
const venues = ref<Venue[]>([])
const data = ref<ExpenseList | null>(null)
const loading = ref(false)
const saving = ref(false)

const monthLabel = computed(() => {
  const [y, m] = month.value.split('-').map(Number)
  return 'en ' + new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
})

function period() {
  const [y, m] = month.value.split('-').map(Number)
  const last = new Date(y, m, 0).getDate()
  return { from: `${month.value}-01`, to: `${month.value}-${String(last).padStart(2, '0')}` }
}

/** Part d'un poste dans le total de sa devise (barre horizontale). */
function share(c: ExpenseCategoryTotal): number {
  const total = data.value?.byCategory.filter((x) => x.currency === c.currency).reduce((s, x) => s + x.amount, 0) ?? 0
  return total > 0 ? Math.max(4, Math.round((c.amount / total) * 100)) : 0
}

async function load() {
  loading.value = true
  try {
    data.value = await listExpenses({ ...period(), venueId: venueId.value, category: category.value })
  } finally {
    loading.value = false
  }
}

/* ---------- Formulaire ---------- */
interface ExpenseForm {
  id?: number
  category: ExpenseCategory
  label: string
  amount: number | null
  currency: VenueCurrency
  method: PaymentMethod
  venueId: number | null
  spentAt: string
  reference: string
  note: string
}
const form = ref<ExpenseForm | null>(null)
const formError = ref('')

function openForm(e?: VenueExpense) {
  formError.value = ''
  form.value = e
    ? {
        id: e.id, category: e.category, label: e.label, amount: e.amount, currency: e.currency, method: e.method,
        venueId: e.venueId ?? null, spentAt: toLocalInput(e.spentAt), reference: e.reference ?? '', note: e.note ?? '',
      }
    : {
        category: 'CARBURANT', label: '', amount: null, currency: 'USD', method: 'ESPECES',
        venueId: venues.value.length === 1 ? venues.value[0].id : null, spentAt: toLocalInput(new Date().toISOString()),
        reference: '', note: '',
      }
}

async function save() {
  if (!form.value || saving.value) return
  const f = form.value
  if (!f.amount || f.amount <= 0) {
    formError.value = 'Indiquez un montant positif.'
    return
  }
  const payload: ExpensePayload = {
    category: f.category, label: f.label, amount: f.amount, currency: f.currency, method: f.method,
    venueId: f.venueId, spentAt: f.spentAt ? toApiDateTime(f.spentAt) : undefined,
    reference: f.reference || undefined, note: f.note || undefined,
  }
  saving.value = true
  formError.value = ''
  try {
    if (f.id) await updateExpense(f.id, payload)
    else await createExpense(payload)
    notify.push(f.id ? 'Dépense modifiée' : 'Dépense enregistrée', 'success')
    form.value = null
    await load()
  } catch (e) {
    formError.value = apiErrorMessage(e)
  } finally {
    saving.value = false
  }
}

/* ---------- Annulation ---------- */
const cancelDialog = ref<{ expense: VenueExpense; reason: string } | null>(null)

async function confirmCancel() {
  if (!cancelDialog.value || saving.value) return
  saving.value = true
  try {
    await cancelExpense(cancelDialog.value.expense.id, cancelDialog.value.reason)
    notify.push('Dépense annulée', 'success')
    cancelDialog.value = null
    await load()
  } catch { /* message affiché par l'intercepteur */ } finally {
    saving.value = false
  }
}

watch([month, venueId, category], load)
onMounted(async () => {
  venues.value = await listVenues().catch(() => [])
  await load()
  // Lien « Nouvelle dépense » depuis « Ma caisse ».
  if (route.query.new) {
    openForm()
    void router.replace({ query: {} })
  }
})
</script>
