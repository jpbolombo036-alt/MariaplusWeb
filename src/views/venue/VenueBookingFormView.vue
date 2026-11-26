<template>
  <div class="max-w-3xl mx-auto">
    <VenuePageHeader
      :title="isEdit ? `Modifier ${original?.reference ?? 'la réservation'}` : 'Nouvelle réservation'"
      :subtitle="isEdit ? 'Changer de créneau met aussi à jour l\'événement lié.' : 'La date est bloquée dès l\'enregistrement (option).'"
      :back="isEdit ? `/dashboard/venue/bookings/${bookingId}` : '/dashboard/venue/bookings'"
    />

    <div v-if="!venues.length && !loading" class="v-card p-6 text-center">
      <p class="font-semibold text-slate-900">Ajoutez d'abord une salle</p>
      <router-link to="/dashboard/venue/venues" class="v-btn-primary mt-4">Mes salles</router-link>
    </div>

    <form v-else class="space-y-5" @submit.prevent="submit">
      <!-- Salle & créneau -->
      <div class="v-card p-5 space-y-4">
        <h2 class="text-[15px] font-bold text-slate-900">Salle et créneau</h2>
        <div class="grid sm:grid-cols-2 gap-4">
          <label>
            <span class="v-label">Salle *</span>
            <select v-model.number="form.venueId" required class="v-input">
              <option v-for="v in venues" :key="v.id" :value="v.id">{{ v.name }}</option>
            </select>
          </label>
          <label>
            <span class="v-label">Type d'événement</span>
            <select v-model="form.eventType" class="v-input">
              <option v-for="(label, key) in EVENT_TYPE_LABELS" :key="key" :value="key">{{ label }}</option>
            </select>
          </label>
          <label>
            <span class="v-label">Début *</span>
            <input v-model="form.startAt" required type="datetime-local" class="v-input" />
          </label>
          <label>
            <span class="v-label">Fin *</span>
            <input v-model="form.endAt" required type="datetime-local" class="v-input" />
          </label>
          <label>
            <span class="v-label">Titre</span>
            <input v-model.trim="form.title" maxlength="150" placeholder="Ex. Mariage Ilunga" class="v-input" />
          </label>
          <label>
            <span class="v-label">Nombre de personnes</span>
            <input v-model.number="form.guestCount" type="number" min="0" class="v-input" />
            <span v-if="capacityWarning" class="text-[11.5px] text-attention mt-1 block">{{ capacityWarning }}</span>
          </label>
        </div>
      </div>

      <!-- Client -->
      <div class="v-card p-5 space-y-4">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-[15px] font-bold text-slate-900">Client</h2>
          <div class="inline-flex rounded-lg border border-slate-200 overflow-hidden" role="group" aria-label="Client">
            <button type="button" class="h-9 px-3 text-[12px] font-semibold" :class="clientMode === 'existing' ? 'bg-primary text-white' : 'bg-white text-slate-600'" @click="clientMode = 'existing'">Client existant</button>
            <button type="button" class="h-9 px-3 text-[12px] font-semibold" :class="clientMode === 'new' ? 'bg-primary text-white' : 'bg-white text-slate-600'" @click="clientMode = 'new'">Nouveau client</button>
          </div>
        </div>
        <template v-if="clientMode === 'existing'">
          <input v-model.trim="clientQuery" placeholder="Rechercher par nom ou téléphone…" class="v-input" @input="searchClients" />
          <div class="max-h-56 overflow-y-auto rounded-lg border border-slate-100 divide-y divide-slate-100">
            <label v-for="c in clients" :key="c.id" class="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-50">
              <input v-model.number="form.clientId" type="radio" name="client" :value="c.id" />
              <span class="text-[13px] font-semibold text-slate-900">{{ c.fullName }}</span>
              <span class="text-[12px] text-slate-500">{{ c.phone }}</span>
            </label>
            <p v-if="!clients.length" class="px-3 py-3 text-[13px] text-slate-500">Aucun client trouvé.</p>
          </div>
        </template>
        <div v-else class="grid sm:grid-cols-2 gap-4">
          <label><span class="v-label">Prénom</span><input v-model.trim="newClient.firstName" class="v-input" /></label>
          <label><span class="v-label">Nom *</span><input v-model.trim="newClient.lastName" :required="clientMode === 'new'" class="v-input" /></label>
          <label><span class="v-label">Téléphone</span><input v-model.trim="newClient.phone" type="tel" placeholder="0812 345 678" class="v-input" /></label>
          <label><span class="v-label">Email</span><input v-model.trim="newClient.email" type="email" class="v-input" /></label>
        </div>
      </div>

      <!-- Prix -->
      <div class="v-card p-5 space-y-4">
        <h2 class="text-[15px] font-bold text-slate-900">Prix</h2>
        <div class="grid sm:grid-cols-2 gap-4">
          <label>
            <span class="v-label">Tarif</span>
            <select v-model="form.rateId" class="v-input" @change="applyRate">
              <option :value="undefined">Prix libre</option>
              <option v-for="r in rates" :key="r.id" :value="r.id">{{ r.label }} — {{ formatMoney(r.price, r.currency) }}</option>
            </select>
          </label>
          <label>
            <span class="v-label">Devise</span>
            <select v-model="form.currency" class="v-input" :disabled="isEdit && hasPayments">
              <option value="USD">USD — dollar</option>
              <option value="CDF">CDF — franc congolais</option>
            </select>
          </label>
          <label>
            <span class="v-label">Prix de la salle *</span>
            <input v-model.number="form.basePrice" required type="number" min="0" step="0.01" class="v-input" />
          </label>
          <label>
            <span class="v-label">Remise</span>
            <input v-model.number="form.discount" type="number" min="0" step="0.01" class="v-input" />
          </label>
        </div>
        <div v-if="!isEdit" class="grid sm:grid-cols-2 gap-4">
          <label>
            <span class="v-label">Statut</span>
            <select v-model="form.status" class="v-input">
              <option value="OPTION">Option (en attente d'acompte)</option>
              <option value="CONFIRMEE">Confirmée</option>
            </select>
          </label>
          <label v-if="form.status === 'OPTION'">
            <span class="v-label">Option valable (jours)</span>
            <input v-model.number="form.optionDays" type="number" min="1" max="90" placeholder="7" class="v-input" />
          </label>
        </div>
        <label class="block">
          <span class="v-label">Notes</span>
          <textarea v-model="form.notes" rows="3" maxlength="2000" class="v-input" />
        </label>
      </div>

      <p v-if="error" class="rounded-lg bg-error-light text-error text-sm px-3.5 py-2.5">{{ error }}</p>
      <div class="flex justify-end gap-2">
        <button type="button" class="v-btn" @click="$router.back()">Annuler</button>
        <button type="submit" class="v-btn-primary" :disabled="saving">
          <span class="material-symbols-outlined text-[18px]">save</span>
          {{ isEdit ? 'Enregistrer' : 'Réserver' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VenuePageHeader from '../../components/venue/VenuePageHeader.vue'
import { apiErrorMessage } from '../../api/http'
import {
  EVENT_TYPE_LABELS, createBooking, formatMoney, getBooking, listVenueClients, listVenues, toApiDateTime,
  toLocalInput, updateBooking,
  type Booking, type BookingPayload, type BookingStatus, type Venue, type VenueClient, type VenueCurrency, type VenueEventType,
} from '../../api/venues'

const route = useRoute()
const router = useRouter()
const bookingId = computed(() => (route.params.bookingId ? Number(route.params.bookingId) : null))
const isEdit = computed(() => bookingId.value != null)

const venues = ref<Venue[]>([])
const clients = ref<VenueClient[]>([])
const clientQuery = ref('')
const clientMode = ref<'existing' | 'new'>('new')
const original = ref<Booking | null>(null)
const loading = ref(true)
const saving = ref(false)
const error = ref('')

const form = reactive({
  venueId: undefined as number | undefined,
  clientId: undefined as number | undefined,
  eventType: 'WEDDING' as VenueEventType,
  title: '',
  startAt: '',
  endAt: '',
  guestCount: undefined as number | undefined,
  rateId: undefined as number | undefined,
  currency: 'USD' as VenueCurrency,
  basePrice: undefined as number | undefined,
  discount: 0,
  status: 'OPTION' as BookingStatus,
  optionDays: undefined as number | undefined,
  notes: '',
})
const newClient = reactive({ firstName: '', lastName: '', phone: '', email: '' })

const selectedVenue = computed(() => venues.value.find((v) => v.id === form.venueId))
const rates = computed(() => (selectedVenue.value?.rates ?? []).filter((r) => r.active))
const hasPayments = computed(() => (original.value?.paidAmount ?? 0) > 0)
const capacityWarning = computed(() => {
  const v = selectedVenue.value
  const max = Math.max(v?.capacitySeated ?? 0, v?.capacityStanding ?? 0)
  return form.guestCount && max && form.guestCount > max ? `Au-delà de la capacité de la salle (${max} personnes).` : ''
})

function applyRate() {
  const r = rates.value.find((x) => x.id === form.rateId)
  if (r) {
    form.currency = r.currency
    form.basePrice = r.price
  }
}

let searchTimer: ReturnType<typeof setTimeout> | undefined
function searchClients() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(async () => {
    clients.value = (await listVenueClients(clientQuery.value, 0, 20)).content
  }, 250)
}

watch(() => form.venueId, (_, old) => {
  if (old !== undefined && !rates.value.some((r) => r.id === form.rateId)) form.rateId = undefined
})

async function submit() {
  error.value = ''
  if (form.endAt <= form.startAt) {
    error.value = 'La fin doit être après le début.'
    return
  }
  if (clientMode.value === 'existing' && !form.clientId) {
    error.value = 'Choisissez un client ou créez-en un nouveau.'
    return
  }
  const payload: BookingPayload = {
    venueId: form.venueId,
    eventType: form.eventType,
    title: form.title || undefined,
    startAt: toApiDateTime(form.startAt),
    endAt: toApiDateTime(form.endAt),
    guestCount: form.guestCount ?? undefined,
    rateId: form.rateId,
    currency: form.currency,
    basePrice: form.basePrice ?? 0,
    discount: form.discount || 0,
    notes: form.notes || undefined,
  }
  if (clientMode.value === 'existing') payload.clientId = form.clientId
  else payload.client = { ...newClient, firstName: newClient.firstName || undefined, phone: newClient.phone || undefined, email: newClient.email || undefined }
  if (!isEdit.value) {
    payload.status = form.status
    if (form.status === 'OPTION' && form.optionDays) payload.optionDays = form.optionDays
  }
  saving.value = true
  try {
    const saved = isEdit.value ? await updateBooking(bookingId.value!, payload) : await createBooking(payload)
    router.push(`/dashboard/venue/bookings/${saved.id}`)
  } catch (e) {
    error.value = apiErrorMessage(e)
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    venues.value = (await listVenues()).filter((v) => v.active)
    clients.value = (await listVenueClients('', 0, 20)).content
    if (isEdit.value) {
      const b = await getBooking(bookingId.value!)
      original.value = b
      Object.assign(form, {
        venueId: b.venueId, clientId: b.clientId, eventType: b.eventType ?? 'OTHER', title: b.title ?? '',
        startAt: toLocalInput(b.startAt), endAt: toLocalInput(b.endAt), guestCount: b.guestCount ?? undefined,
        rateId: b.rateId ?? undefined, currency: b.currency, basePrice: b.basePrice, discount: b.discount, notes: b.notes ?? '',
      })
      clientMode.value = 'existing'
      if (!clients.value.some((c) => c.id === b.clientId)) {
        clients.value.unshift({ id: b.clientId, lastName: b.clientName ?? '', fullName: b.clientName ?? '', phone: b.clientPhone })
      }
    } else {
      const preset = route.query.venueId ? Number(route.query.venueId) : undefined
      form.venueId = venues.value.find((v) => v.id === preset)?.id ?? venues.value[0]?.id
      if (route.query.clientId) {
        form.clientId = Number(route.query.clientId)
        clientMode.value = 'existing'
      }
    }
  } finally {
    loading.value = false
  }
})
</script>
