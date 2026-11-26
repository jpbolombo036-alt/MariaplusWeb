<template>
  <div>
    <div v-if="!booking" class="py-16 text-center text-slate-400 text-sm">Chargement…</div>

    <template v-else>
      <VenuePageHeader
        :title="`${booking.reference} · ${booking.clientName ?? ''}`"
        :subtitle="`${booking.venueName} — du ${formatDateTime(booking.startAt)} au ${formatDateTime(booking.endAt)}`"
        back="/dashboard/venue/bookings"
      >
        <BookingStatusBadge :status="booking.status" />
        <button class="v-btn" :disabled="busy" @click="pdf()">
          <span class="material-symbols-outlined text-[18px]">description</span>
          Devis PDF
        </button>
        <template v-if="canManage">
          <router-link v-if="editable" :to="`/dashboard/venue/bookings/${booking.id}/edit`" class="v-btn">
            <span class="material-symbols-outlined text-[18px]">edit</span>
            Modifier
          </router-link>
          <button v-if="booking.status === 'OPTION' || booking.status === 'DEMANDE'" class="v-btn-primary" :disabled="busy" @click="act('confirm')">
            <span class="material-symbols-outlined text-[18px]">check_circle</span>
            Confirmer
          </button>
          <button v-if="booking.status === 'CONFIRMEE'" class="v-btn" :disabled="busy" @click="act('complete')">
            <span class="material-symbols-outlined text-[18px]">task_alt</span>
            Marquer réalisée
          </button>
          <button v-if="editable" class="v-btn-danger" :disabled="busy" @click="openCancel">
            <span class="material-symbols-outlined text-[18px]">cancel</span>
            Annuler
          </button>
        </template>
      </VenuePageHeader>

      <p v-if="booking.status === 'OPTION' && booking.optionExpiresAt" class="mb-4 rounded-lg bg-attention-light text-attention text-[13px] px-4 py-3">
        Option valable jusqu'au {{ formatDateTime(booking.optionExpiresAt) }}. Sans paiement d'ici là, la date sera libérée automatiquement.
      </p>
      <p v-if="booking.status === 'ANNULEE'" class="mb-4 rounded-lg bg-error-light text-error text-[13px] px-4 py-3">
        Réservation annulée{{ booking.cancelReason ? ` : ${booking.cancelReason}` : '' }}.
      </p>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <!-- Colonne gauche : montants, prestations, paiements -->
        <div class="xl:col-span-2 space-y-6">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4" :class="{ 'xl:grid-cols-4': cancelled }">
            <div class="v-card p-5">
              <p class="text-[12px] font-semibold text-slate-500">Total</p>
              <p class="text-xl font-bold text-slate-900 mt-1">{{ formatMoney(booking.totalAmount, booking.currency) }}</p>
              <p class="text-[11.5px] text-slate-500 mt-1">Salle {{ formatMoney(booking.basePrice) }} + prestations {{ formatMoney(booking.extrasTotal) }}<span v-if="booking.discount > 0"> − remise {{ formatMoney(booking.discount) }}</span></p>
            </div>
            <div class="v-card p-5">
              <p class="text-[12px] font-semibold text-slate-500">Payé</p>
              <p class="text-xl font-bold text-success mt-1">{{ formatMoney(booking.paidAmount, booking.currency) }}</p>
            </div>
            <template v-if="cancelled">
              <div class="v-card p-5">
                <p class="text-[12px] font-semibold text-slate-500">Remboursé</p>
                <p class="text-xl font-bold text-error mt-1">{{ formatMoney(booking.refundedAmount, booking.currency) }}</p>
              </div>
              <div class="v-card p-5">
                <p class="text-[12px] font-semibold text-slate-500">Retenu (frais d'annulation)</p>
                <p class="text-xl font-bold text-slate-900 mt-1">{{ formatMoney(booking.retainedAmount ?? 0, booking.currency) }}</p>
              </div>
            </template>
            <div v-else class="v-card p-5">
              <p class="text-[12px] font-semibold text-slate-500">Reste à payer</p>
              <p class="text-xl font-bold mt-1" :class="booking.balance > 0 ? 'text-error' : 'text-success'">{{ formatMoney(booking.balance, booking.currency) }}</p>
            </div>
          </div>

          <!-- Prestations -->
          <div class="v-card">
            <div class="px-5 pt-5 pb-3"><h2 class="text-[16px] font-bold text-slate-900">Prestations</h2></div>
            <table v-if="booking.extras?.length" class="w-full">
              <thead><tr class="bg-slate-50/80"><th class="v-th">Désignation</th><th class="v-th text-right">Qté</th><th class="v-th text-right">Prix unitaire</th><th class="v-th text-right">Montant</th><th class="v-th" /></tr></thead>
              <tbody>
                <tr v-for="e in booking.extras" :key="e.id" class="border-t border-slate-100">
                  <td class="v-td">{{ e.label }}</td>
                  <td class="v-td text-right">{{ e.quantity }}</td>
                  <td class="v-td text-right whitespace-nowrap">{{ formatMoney(e.unitPrice, booking.currency) }}</td>
                  <td class="v-td text-right whitespace-nowrap font-semibold">{{ formatMoney(e.lineTotal, booking.currency) }}</td>
                  <td class="v-td text-right">
                    <button v-if="canManage && editable" class="text-slate-400 hover:text-error" :aria-label="`Retirer ${e.label}`" @click="removeExtra(e.id)">
                      <span class="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <p v-else class="px-5 pb-4 text-[13px] text-slate-500">Aucune prestation (sono, décoration, nettoyage…).</p>
            <form v-if="canManage && editable" class="px-5 pb-5 pt-2 grid grid-cols-1 sm:grid-cols-[1fr_90px_140px_auto] gap-2 items-end" @submit.prevent="addExtra">
              <label><span class="v-label">Prestation</span><input v-model.trim="extra.label" required maxlength="150" placeholder="Sonorisation" class="v-input" /></label>
              <label><span class="v-label">Qté</span><input v-model.number="extra.quantity" required type="number" min="1" class="v-input" /></label>
              <label><span class="v-label">Prix ({{ booking.currency }})</span><input v-model.number="extra.unitPrice" required type="number" min="0" step="0.01" class="v-input" /></label>
              <button class="v-btn" :disabled="busy"><span class="material-symbols-outlined text-[18px]">add</span>Ajouter</button>
            </form>
          </div>

          <!-- Paiements -->
          <div class="v-card">
            <div class="px-5 pt-5 pb-3"><h2 class="text-[16px] font-bold text-slate-900">{{ booking.refundedAmount > 0 ? 'Paiements et remboursements' : 'Paiements' }}</h2></div>
            <div v-if="booking.payments?.length" class="overflow-x-auto">
              <table class="w-full">
                <thead><tr class="bg-slate-50/80"><th class="v-th">Reçu</th><th class="v-th">Date</th><th class="v-th">Mode</th><th class="v-th text-right">Montant</th><th class="v-th" /></tr></thead>
                <tbody>
                  <tr v-for="p in booking.payments" :key="p.id" class="border-t border-slate-100">
                    <td class="v-td font-semibold">
                      {{ p.receiptNumber }}
                      <div v-if="p.kind === 'REFUND'" class="text-[11px] font-bold text-error">Remboursement</div>
                    </td>
                    <td class="v-td whitespace-nowrap">{{ formatDateTime(p.paidAt) }}</td>
                    <td class="v-td">{{ PAYMENT_METHOD_LABELS[p.method] }}<div v-if="p.reference" class="text-[11px] text-slate-400">{{ p.reference }}</div></td>
                    <td class="v-td text-right whitespace-nowrap">
                      <span class="font-semibold" :class="{ 'text-error': p.kind === 'REFUND' }">{{ p.kind === 'REFUND' ? '− ' : '' }}{{ formatMoney(p.amount, p.currency) }}</span>
                      <div v-if="p.currency !== booking.currency" class="text-[11px] text-slate-400">= {{ formatMoney(p.amountInBookingCurrency, booking.currency) }} (1 USD = {{ p.exchangeRate }} CDF)</div>
                    </td>
                    <td class="v-td text-right whitespace-nowrap">
                      <button class="text-slate-500 hover:text-primary mr-2" :aria-label="`Reçu ${p.receiptNumber}`" title="Reçu PDF" @click="pdf(p.id)">
                        <span class="material-symbols-outlined text-[18px]">receipt_long</span>
                      </button>
                      <button v-if="canRefund" class="text-slate-400 hover:text-error" :aria-label="`${p.kind === 'REFUND' ? 'Annuler le remboursement' : 'Annuler le paiement'} ${p.receiptNumber}`" title="Annuler ce mouvement (saisie erronée)" @click="removePayment(p.id)">
                        <span class="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-else class="px-5 pb-4 text-[13px] text-slate-500">Aucun paiement enregistré.</p>

            <form v-if="(cancelled ? canRefund && (booking.retainedAmount ?? 0) > 0 : canPay && booking.balance > 0)" class="px-5 pb-5 pt-3 border-t border-slate-100 space-y-3" @submit.prevent="addPayment">
              <p class="text-[13px] font-bold text-slate-900">{{ cancelled ? 'Rembourser le client' : 'Enregistrer un paiement' }}</p>
              <p v-if="cancelled" class="text-[12px] text-slate-500">Encore remboursable : {{ formatMoney(booking.retainedAmount ?? 0, booking.currency) }}. Ce qui n'est pas remboursé reste retenu.</p>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label><span class="v-label">Montant *</span><input v-model.number="payment.amount" required type="number" min="0.01" step="0.01" class="v-input" /></label>
                <label>
                  <span class="v-label">Devise</span>
                  <select v-model="payment.currency" class="v-input" aria-label="Devise du paiement"><option value="USD">USD</option><option value="CDF">CDF</option></select>
                </label>
                <label v-if="payment.currency !== booking.currency">
                  <span class="v-label">Taux (CDF pour 1 USD) *</span>
                  <input v-model.number="payment.exchangeRate" required type="number" min="0.0001" step="0.0001" class="v-input" aria-label="Taux (CDF pour 1 USD)" />
                  <span v-if="dailyRate" class="text-[11px] text-slate-500 mt-1 block">Taux du jour de la salle : {{ dailyRate.cdfPerUsd }} (modifiable pour ce paiement)</span>
                  <router-link v-else to="/dashboard/venue/exchange-rate" class="text-[11px] text-primary font-semibold mt-1 block">Fixer le taux du jour</router-link>
                </label>
                <label>
                  <span class="v-label">Mode *</span>
                  <select v-model="payment.method" class="v-input">
                    <option v-for="(label, key) in PAYMENT_METHOD_LABELS" :key="key" :value="key">{{ label }}</option>
                  </select>
                </label>
                <label><span class="v-label">Référence</span><input v-model.trim="payment.reference" maxlength="100" placeholder="N° de transaction" class="v-input" /></label>
                <label><span class="v-label">Date</span><input v-model="payment.paidAt" type="datetime-local" class="v-input" /></label>
              </div>
              <p v-if="convertedPreview" class="text-[12px] text-slate-500">Équivalent : {{ convertedPreview }}</p>
              <div class="flex justify-end">
                <button class="v-btn-primary" :disabled="busy"><span class="material-symbols-outlined text-[18px]">{{ cancelled ? 'currency_exchange' : 'payments' }}</span>{{ cancelled ? 'Rembourser' : 'Encaisser' }}</button>
              </div>
            </form>
          </div>
        </div>

        <!-- Colonne droite : infos, événement, accès client -->
        <div class="space-y-6">
          <div class="v-card p-5 space-y-2 text-[13px]">
            <h2 class="text-[16px] font-bold text-slate-900 mb-2">Détails</h2>
            <p><span class="text-slate-500">Client :</span> <router-link :to="`/dashboard/venue/clients/${booking.clientId}`" class="font-semibold text-primary">{{ booking.clientName }}</router-link></p>
            <p v-if="booking.clientPhone"><span class="text-slate-500">Téléphone :</span> {{ booking.clientPhone }}</p>
            <p v-if="booking.title"><span class="text-slate-500">Titre :</span> {{ booking.title }}</p>
            <p v-if="booking.eventType"><span class="text-slate-500">Type :</span> {{ EVENT_TYPE_LABELS[booking.eventType] }}</p>
            <p v-if="booking.guestCount != null"><span class="text-slate-500">Personnes :</span> {{ booking.guestCount }}</p>
            <p v-if="booking.notes" class="whitespace-pre-line"><span class="text-slate-500">Notes :</span> {{ booking.notes }}</p>
          </div>

          <div class="v-card p-5 space-y-3">
            <h2 class="text-[16px] font-bold text-slate-900">Événement MariagePlus</h2>
            <template v-if="booking.eventId">
              <p class="text-[13px] text-slate-600">L'événement suit la date de la réservation. Personnalisez l'invitation (photos, message, tenue) depuis sa fiche.</p>
              <router-link :to="`/dashboard/events/${booking.eventId}`" class="v-btn w-full">
                <span class="material-symbols-outlined text-[18px]">open_in_new</span>
                Ouvrir l'événement
              </router-link>

              <div v-if="canGrantAccess && booking.status !== 'ANNULEE'" class="pt-3 border-t border-slate-100 space-y-2">
                <p class="text-[13px] font-semibold text-slate-900">Accès du client à ses invités</p>
                <p class="text-[12px] text-slate-500">Le client gère lui-même ses invités, invitations et réponses, uniquement pour cet événement.</p>
                <input v-model.trim="accessEmail" type="email" placeholder="Email du client" class="v-input" />
                <button class="v-btn-primary w-full" :disabled="busy || !accessEmail" @click="giveAccess">
                  <span class="material-symbols-outlined text-[18px]">key</span>
                  Donner l'accès
                </button>
                <div v-if="access" class="rounded-lg bg-success-light text-[13px] p-3 space-y-1">
                  <p class="font-semibold text-success">Accès créé pour {{ access.email }}</p>
                  <template v-if="access.temporaryPassword">
                    <p>Mot de passe temporaire (affiché une seule fois) :</p>
                    <p class="font-mono text-[15px] font-bold text-slate-900 select-all">{{ access.temporaryPassword }}</p>
                    <p class="text-[12px] text-slate-600">Le client le changera à sa première connexion.</p>
                    <a v-if="access.whatsappNumber" :href="whatsappLink" target="_blank" rel="noopener" class="v-btn w-full mt-2">Envoyer par WhatsApp</a>
                  </template>
                  <p v-else class="text-[12px] text-slate-600">Ce client avait déjà un compte : il se connecte avec son mot de passe habituel.</p>
                </div>
              </div>
            </template>
            <template v-else-if="booking.status === 'CONFIRMEE' && canManage && canCreateEvent">
              <p class="text-[13px] text-slate-600">Créez l'événement pré-rempli (date, salle, adresse) pour gérer invitations et réponses.</p>
              <div v-if="booking.eventType === 'WEDDING'" class="grid grid-cols-2 gap-2">
                <input v-model.trim="couple.groomFirstName" placeholder="Prénom du marié" class="v-input" />
                <input v-model.trim="couple.groomLastName" placeholder="Nom du marié" class="v-input" />
                <input v-model.trim="couple.brideFirstName" placeholder="Prénom de la mariée" class="v-input" />
                <input v-model.trim="couple.brideLastName" placeholder="Nom de la mariée" class="v-input" />
              </div>
              <button class="v-btn-primary w-full" :disabled="busy || !coupleReady" @click="createEvent">
                <span class="material-symbols-outlined text-[18px]">celebration</span>
                Créer l'événement MariagePlus
              </button>
            </template>
            <p v-else-if="booking.status === 'CONFIRMEE'" class="text-[13px] text-slate-500">Le gérant crée l'événement pour le client.</p>
            <p v-else class="text-[13px] text-slate-500">Disponible une fois la réservation confirmée.</p>
          </div>
        </div>
      </div>
    </template>

    <!-- Annulation : motif et remboursement du client -->
    <div v-if="cancelDialog.open && booking" class="fixed inset-0 z-50 bg-slate-900/40 grid place-items-center p-4" @click.self="cancelDialog.open = false">
      <form class="v-card w-full max-w-lg p-6 space-y-4" role="dialog" aria-modal="true" aria-label="Annuler la réservation" @submit.prevent="confirmCancel">
        <h2 class="text-[18px] font-bold text-slate-900">Annuler {{ booking.reference }}</h2>
        <p class="text-[13px] text-slate-600">La date sera libérée{{ booking.eventId ? ' et l\'événement lié annulé' : '' }}.</p>
        <label class="block">
          <span class="v-label">Motif</span>
          <input v-model.trim="cancelDialog.reason" maxlength="500" placeholder="Ex. client empêché" class="v-input" />
        </label>

        <template v-if="netPaid > 0">
          <div class="rounded-lg bg-slate-50 border border-slate-200 p-3 text-[13px]">
            Le client a déjà payé <strong>{{ formatMoney(netPaid, booking.currency) }}</strong>.<template v-if="canRefund"> Que lui rendez-vous ?</template>
          </div>
          <div v-if="canRefund" class="space-y-2 text-[13px]" role="radiogroup" aria-label="Remboursement">
            <label class="flex items-center gap-2"><input v-model="cancelDialog.refundMode" type="radio" value="all" /> Tout rembourser ({{ formatMoney(netPaid, booking.currency) }})</label>
            <label class="flex items-center gap-2"><input v-model="cancelDialog.refundMode" type="radio" value="part" /> Rembourser une partie (le reste est retenu)</label>
            <label class="flex items-center gap-2"><input v-model="cancelDialog.refundMode" type="radio" value="none" /> Ne rien rembourser pour l'instant</label>
          </div>
          <div v-if="canRefund && cancelDialog.refundMode !== 'none'" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label v-if="cancelDialog.refundMode === 'part'">
              <span class="v-label">Montant remboursé ({{ booking.currency }}) *</span>
              <input v-model.number="cancelDialog.amount" required type="number" min="0.01" :max="netPaid" step="0.01" class="v-input" aria-label="Montant remboursé" />
            </label>
            <label>
              <span class="v-label">Mode *</span>
              <select v-model="cancelDialog.method" class="v-input" aria-label="Mode de remboursement">
                <option v-for="(label, key) in PAYMENT_METHOD_LABELS" :key="key" :value="key">{{ label }}</option>
              </select>
            </label>
            <label class="sm:col-span-2">
              <span class="v-label">Référence</span>
              <input v-model.trim="cancelDialog.reference" maxlength="100" placeholder="N° de transaction" class="v-input" />
            </label>
          </div>
          <p v-if="canRefund && cancelDialog.refundMode !== 'none'" class="text-[12px] text-slate-500">
            Retenu par la salle : {{ formatMoney(retainedPreview, booking.currency) }}
          </p>
          <p v-if="!canRefund" class="text-[12px] text-slate-500">Le remboursement éventuel sera enregistré par le gérant.</p>
        </template>

        <div class="flex justify-end gap-2 pt-2">
          <button type="button" class="v-btn" @click="cancelDialog.open = false">Retour</button>
          <button class="v-btn-danger" :disabled="busy">Confirmer l'annulation</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import VenuePageHeader from '../../components/venue/VenuePageHeader.vue'
import BookingStatusBadge from '../../components/venue/BookingStatusBadge.vue'
import { useAuthStore } from '../../stores/auth'
import { useNotificationStore } from '../../stores/notifications'
import { Perm } from '../../permissions'
import {
  EVENT_TYPE_LABELS, PAYMENT_METHOD_LABELS, addBookingExtra, bookingAction, cancelBooking, createEventFromBooking,
  deletePayment, formatDateTime, formatMoney, getBooking, grantClientAccess, openBookingPdf, recordPayment,
  removeBookingExtra, toApiDateTime, getVenueClient, getExchangeRate, recordRefund,
  type Booking, type ClientAccess, type ExchangeRate, type PaymentMethod, type VenueCurrency,
} from '../../api/venues'

const route = useRoute()
const auth = useAuthStore()
const notify = useNotificationStore()
const id = Number(route.params.bookingId)

const booking = ref<Booking | null>(null)
const busy = ref(false)
const access = ref<ClientAccess | null>(null)
const accessEmail = ref('')
const extra = reactive({ label: '', quantity: 1, unitPrice: undefined as number | undefined })
const payment = reactive({
  amount: undefined as number | undefined,
  currency: 'USD' as VenueCurrency,
  exchangeRate: undefined as number | undefined,
  method: 'ESPECES' as PaymentMethod,
  reference: '',
  paidAt: '',
})
const dailyRate = ref<ExchangeRate | null>(null)
const cancelDialog = reactive({
  open: false,
  reason: '',
  refundMode: 'all' as 'all' | 'part' | 'none',
  amount: undefined as number | undefined,
  method: 'ESPECES' as PaymentMethod,
  reference: '',
})
const couple = reactive({ groomFirstName: '', groomLastName: '', brideFirstName: '', brideLastName: '' })

const canManage = computed(() => auth.can([Perm.bookingManage]))
const cancelled = computed(() => booking.value?.status === 'ANNULEE')
/** Encaissé net (payé − déjà remboursé), dans la devise de la réservation. */
const netPaid = computed(() => Math.max((booking.value?.paidAmount ?? 0) - (booking.value?.refundedAmount ?? 0), 0))
const retainedPreview = computed(() => {
  if (cancelDialog.refundMode === 'all') return 0
  if (cancelDialog.refundMode === 'part') return Math.max(netPaid.value - (cancelDialog.amount ?? 0), 0)
  return netPaid.value
})
const canPay = computed(() => auth.can([Perm.bookingPaymentRecord]))
/** Sorties d'argent (remboursement, annulation d'un paiement) : gérant uniquement. */
const canRefund = computed(() => auth.can([Perm.bookingRefund]))
const canCreateEvent = computed(() => auth.can([Perm.eventCreate]))
const canGrantAccess = computed(() => auth.can([Perm.organizationManageMembers]))
const editable = computed(() => !!booking.value && booking.value.status !== 'ANNULEE' && booking.value.status !== 'REALISEE')
const coupleReady = computed(() => booking.value?.eventType !== 'WEDDING'
  || Object.values(couple).every((v) => v.length > 0))

const convertedPreview = computed(() => {
  const b = booking.value
  if (!b || !payment.amount || payment.currency === b.currency || !payment.exchangeRate) return ''
  const value = payment.currency === 'USD' ? payment.amount * payment.exchangeRate : payment.amount / payment.exchangeRate
  return formatMoney(value, b.currency)
})

const whatsappLink = computed(() => {
  const a = access.value
  if (!a?.whatsappNumber || !a.temporaryPassword) return '#'
  const text = `Bonjour, voici votre accès pour gérer les invités de votre événement :\n${window.location.origin}/login\nEmail : ${a.email}\nMot de passe temporaire : ${a.temporaryPassword}`
  return `https://wa.me/${a.whatsappNumber}?text=${encodeURIComponent(text)}`
})

async function load() {
  booking.value = await getBooking(id)
  payment.currency = booking.value.currency
}

// Autre devise que la réservation : le taux du jour de la salle est proposé (modifiable).
watch(() => payment.currency, (currency) => {
  if (booking.value && currency !== booking.value.currency) payment.exchangeRate = dailyRate.value?.cdfPerUsd
})

async function run(task: () => Promise<unknown>, success?: string) {
  busy.value = true
  try {
    await task()
    await load()
    if (success) notify.push(success, 'success')
  } catch {
    // Le message d'erreur du serveur est déjà affiché par l'intercepteur.
  } finally {
    busy.value = false
  }
}

function act(action: 'confirm' | 'complete') {
  return run(() => bookingAction(id, action), action === 'confirm' ? 'Réservation confirmée' : 'Réservation marquée réalisée')
}

function openCancel() {
  Object.assign(cancelDialog, { open: true, reason: '', refundMode: netPaid.value > 0 && canRefund.value ? 'all' : 'none',
    amount: undefined, method: 'ESPECES', reference: '' })
}

function confirmCancel() {
  const b = booking.value
  if (!b) return
  const amount = cancelDialog.refundMode === 'all' ? netPaid.value : cancelDialog.amount ?? 0
  const refund = cancelDialog.refundMode !== 'none' && amount > 0
    ? { amount, currency: b.currency, method: cancelDialog.method, reference: cancelDialog.reference || undefined }
    : undefined
  cancelDialog.open = false
  return run(() => cancelBooking(id, cancelDialog.reason || undefined, refund),
    refund ? `Réservation annulée, ${formatMoney(amount, b.currency)} remboursés` : 'Réservation annulée, date libérée')
}

function addExtra() {
  return run(async () => {
    await addBookingExtra(id, { label: extra.label, quantity: extra.quantity, unitPrice: extra.unitPrice ?? 0 })
    Object.assign(extra, { label: '', quantity: 1, unitPrice: undefined })
  }, 'Prestation ajoutée')
}

function removeExtra(extraId: number) {
  return run(() => removeBookingExtra(id, extraId))
}

function addPayment() {
  const refund = cancelled.value
  return run(async () => {
    await (refund ? recordRefund : recordPayment)(id, {
      amount: payment.amount ?? 0,
      currency: payment.currency,
      exchangeRate: payment.currency !== booking.value?.currency ? payment.exchangeRate : undefined,
      method: payment.method,
      reference: payment.reference || undefined,
      paidAt: payment.paidAt ? toApiDateTime(payment.paidAt) : undefined,
    })
    Object.assign(payment, { amount: undefined, reference: '', paidAt: '' })
  }, refund ? 'Remboursement enregistré' : 'Paiement enregistré')
}

function removePayment(paymentId: number) {
  if (!window.confirm('Annuler ce mouvement saisi par erreur ? Il ne comptera plus dans les montants.')) return
  return run(() => deletePayment(id, paymentId), 'Mouvement annulé')
}

function createEvent() {
  const b = booking.value
  return run(() => createEventFromBooking(id, b?.eventType === 'WEDDING' ? { weddingDetails: { ...couple } } : {}),
    'Événement MariagePlus créé')
}

function giveAccess() {
  busy.value = true
  grantClientAccess(id, { email: accessEmail.value })
    .then((res) => { access.value = res })
    .catch(() => { /* message affiché par l'intercepteur */ })
    .finally(() => { busy.value = false })
}

async function pdf(paymentId?: number) {
  busy.value = true
  try {
    await openBookingPdf(id, paymentId)
  } catch {
    // Message d'erreur déjà affiché.
  } finally {
    busy.value = false
  }
}

onMounted(async () => {
  dailyRate.value = (await getExchangeRate().catch(() => null))?.current ?? null
  await load()
  if (booking.value && auth.can([Perm.venueClientManage])) {
    const client = await getVenueClient(booking.value.clientId).catch(() => null)
    accessEmail.value = client?.email ?? ''
  }
})
</script>
