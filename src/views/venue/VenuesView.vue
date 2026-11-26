<template>
  <div>
    <VenuePageHeader title="Mes salles" subtitle="Capacités, équipements, photo et tarifs (USD ou CDF).">
      <button v-if="canManage" class="v-btn-primary" @click="startCreate">
        <span class="material-symbols-outlined text-[18px]">add</span>
        Nouvelle salle
      </button>
    </VenuePageHeader>

    <!-- Formulaire création / modification -->
    <form v-if="editing" class="v-card p-5 mb-6 space-y-4" @submit.prevent="save">
      <h2 class="text-[16px] font-bold text-slate-900">{{ editing.id ? 'Modifier la salle' : 'Nouvelle salle' }}</h2>
      <div class="grid sm:grid-cols-2 gap-4">
        <label class="sm:col-span-2"><span class="v-label">Nom *</span><input v-model.trim="editing.name" required maxlength="150" class="v-input" /></label>
        <label class="sm:col-span-2"><span class="v-label">Adresse</span><input v-model.trim="editing.address" maxlength="255" class="v-input" /></label>
        <label><span class="v-label">Commune</span><input v-model.trim="editing.commune" maxlength="100" placeholder="Gombe" class="v-input" /></label>
        <label><span class="v-label">Ville</span><input v-model.trim="editing.city" maxlength="100" placeholder="Kinshasa" class="v-input" /></label>
        <label><span class="v-label">Places assises</span><input v-model.number="editing.capacitySeated" type="number" min="0" class="v-input" /></label>
        <label><span class="v-label">Places debout</span><input v-model.number="editing.capacityStanding" type="number" min="0" class="v-input" /></label>
        <label><span class="v-label">Latitude</span><input v-model.number="editing.latitude" type="number" step="any" class="v-input" /></label>
        <label><span class="v-label">Longitude</span><input v-model.number="editing.longitude" type="number" step="any" class="v-input" /></label>
        <label class="sm:col-span-2"><span class="v-label">Équipements</span><input v-model.trim="editing.amenities" maxlength="1000" placeholder="Climatisation, groupe électrogène, parking…" class="v-input" /></label>
        <label class="sm:col-span-2"><span class="v-label">Description</span><textarea v-model="editing.description" rows="3" maxlength="2000" class="v-input" /></label>
        <label v-if="editing.id" class="flex items-center gap-2 text-[13px] text-slate-700">
          <input v-model="editing.active" type="checkbox" /> Salle disponible à la réservation
        </label>
      </div>
      <div class="flex justify-end gap-2">
        <button type="button" class="v-btn" @click="editing = null">Annuler</button>
        <button class="v-btn-primary" :disabled="busy">Enregistrer</button>
      </div>
    </form>

    <div v-if="loading" class="py-16 text-center text-slate-400 text-sm">Chargement…</div>
    <div v-else-if="!venues.length && !editing" class="v-card py-16 text-center">
      <span class="material-symbols-outlined text-primary text-[32px]">storefront</span>
      <p class="font-semibold text-slate-900 mt-2">Aucune salle</p>
      <p class="text-sm text-slate-500 mt-1">Ajoutez votre première salle pour commencer à prendre des réservations.</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div v-for="v in venues" :key="v.id" class="v-card overflow-hidden">
        <div class="h-40 bg-slate-100 relative">
          <img v-if="images[v.id]" :src="images[v.id]" :alt="v.name" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full grid place-items-center text-slate-300">
            <span class="material-symbols-outlined text-[48px]">storefront</span>
          </div>
          <label v-if="canManage" class="absolute bottom-2 right-2 v-btn !h-8 !px-3 cursor-pointer">
            <span class="material-symbols-outlined text-[16px]">photo_camera</span>
            Photo
            <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" class="hidden" @change="uploadImage(v, $event)" />
          </label>
        </div>
        <div class="p-5 space-y-3">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-[17px] font-bold text-slate-900 truncate">{{ v.name }}</p>
              <p class="text-[12.5px] text-slate-500">{{ [v.address, v.commune, v.city].filter(Boolean).join(', ') || 'Adresse non renseignée' }}</p>
            </div>
            <span v-if="!v.active" class="text-[11px] font-bold text-slate-500 bg-slate-100 rounded-full px-2.5 py-1">Inactive</span>
          </div>
          <p class="text-[12.5px] text-slate-600">
            <span v-if="v.capacitySeated">{{ v.capacitySeated }} places assises</span>
            <span v-if="v.capacitySeated && v.capacityStanding"> · </span>
            <span v-if="v.capacityStanding">{{ v.capacityStanding }} debout</span>
          </p>
          <p v-if="v.amenities" class="text-[12.5px] text-slate-500">{{ v.amenities }}</p>

          <div class="pt-3 border-t border-slate-100">
            <p class="text-[12px] font-bold uppercase tracking-wide text-slate-500 mb-2">Tarifs</p>
            <div v-for="r in v.rates" :key="r.id" class="flex items-center justify-between py-1 text-[13px]">
              <span>{{ r.label }}</span>
              <span class="flex items-center gap-2">
                <span class="font-semibold">{{ formatMoney(r.price, r.currency) }}</span>
                <button v-if="canManage" class="text-slate-400 hover:text-error" :aria-label="`Supprimer le tarif ${r.label}`" @click="removeRate(v, r.id)">
                  <span class="material-symbols-outlined text-[16px]">close</span>
                </button>
              </span>
            </div>
            <p v-if="!v.rates.length" class="text-[13px] text-slate-500">Aucun tarif.</p>
            <form v-if="canManage" class="mt-2 grid grid-cols-[1fr_100px_80px_auto] gap-2" @submit.prevent="addRate(v)">
              <input v-model.trim="rateDraft(v.id).label" required maxlength="100" placeholder="Journée" class="v-input" aria-label="Libellé du tarif" />
              <input v-model.number="rateDraft(v.id).price" required type="number" min="0" step="0.01" placeholder="Prix" class="v-input" aria-label="Prix" />
              <select v-model="rateDraft(v.id).currency" class="v-input" aria-label="Devise"><option>USD</option><option>CDF</option></select>
              <button class="v-btn !px-3" aria-label="Ajouter le tarif"><span class="material-symbols-outlined text-[18px]">add</span></button>
            </form>
          </div>

          <div class="flex flex-wrap gap-2 pt-2">
            <router-link :to="{ path: '/dashboard/venue/bookings', query: { venueId: v.id } }" class="v-btn">
              <span class="material-symbols-outlined text-[18px]">calendar_month</span>
              Réservations
            </router-link>
            <button v-if="canManage" class="v-btn" @click="startEdit(v)">
              <span class="material-symbols-outlined text-[18px]">edit</span>
              Modifier
            </button>
            <button v-if="canManage" class="v-btn-danger" :aria-label="`Supprimer la salle ${v.name}`" :title="`Supprimer la salle ${v.name}`" @click="remove(v)">
              <span class="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import VenuePageHeader from '../../components/venue/VenuePageHeader.vue'
import { http } from '../../api/http'
import { useAuthStore } from '../../stores/auth'
import { useNotificationStore } from '../../stores/notifications'
import { Perm } from '../../permissions'
import {
  addVenueRate, createVenue, deleteVenue, deleteVenueRate, formatMoney, listVenues, updateVenue, uploadVenueImage,
  type Venue, type VenueCurrency, type VenuePayload,
} from '../../api/venues'

const auth = useAuthStore()
const notify = useNotificationStore()
const canManage = computed(() => auth.can([Perm.venueManage]))
const venues = ref<Venue[]>([])
const images = ref<Record<number, string>>({})
const loading = ref(true)
const busy = ref(false)
const editing = ref<(VenuePayload & { id?: number }) | null>(null)
const drafts = reactive<Record<number, { label: string; price: number | undefined; currency: VenueCurrency }>>({})

function rateDraft(venueId: number) {
  if (!drafts[venueId]) drafts[venueId] = { label: '', price: undefined, currency: 'USD' }
  return drafts[venueId]
}

async function load() {
  venues.value = await listVenues()
  for (const v of venues.value) {
    if (v.imageUrl && !images.value[v.id]) void loadImage(v)
  }
}

async function loadImage(v: Venue) {
  try {
    const res = await http.get(`/api/venues/${v.id}/image`, { responseType: 'blob', silentStatuses: [404] })
    images.value[v.id] = URL.createObjectURL(res.data as Blob)
  } catch { /* pas de photo */ }
}

function startCreate() {
  editing.value = { name: '', city: 'Kinshasa', country: 'RDC' }
}

function startEdit(v: Venue) {
  const { rates: _rates, imageUrl: _image, ...rest } = v
  editing.value = { ...rest }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function save() {
  if (!editing.value) return
  busy.value = true
  try {
    const { id, ...payload } = editing.value
    if (id) await updateVenue(id, payload)
    else await createVenue(payload)
    editing.value = null
    notify.push('Salle enregistrée', 'success')
    await load()
  } catch { /* message affiché par l'intercepteur */ } finally {
    busy.value = false
  }
}

async function remove(v: Venue) {
  if (!window.confirm(`Supprimer la salle « ${v.name} » ? Ses réservations passées restent consultables.`)) return
  await deleteVenue(v.id).catch(() => null)
  await load()
}

async function addRate(v: Venue) {
  const d = rateDraft(v.id)
  try {
    await addVenueRate(v.id, { label: d.label, price: d.price ?? 0, currency: d.currency })
    drafts[v.id] = { label: '', price: undefined, currency: d.currency }
    await load()
  } catch { /* message affiché */ }
}

async function removeRate(v: Venue, rateId: number) {
  await deleteVenueRate(v.id, rateId).catch(() => null)
  await load()
}

async function uploadImage(v: Venue, e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    await uploadVenueImage(v.id, file)
    if (images.value[v.id]) URL.revokeObjectURL(images.value[v.id])
    delete images.value[v.id]
    await loadImage(v)
    notify.push('Photo mise à jour', 'success')
  } catch { /* message affiché */ }
}

onMounted(async () => {
  try {
    await load()
  } finally {
    loading.value = false
  }
})
onBeforeUnmount(() => Object.values(images.value).forEach((url) => URL.revokeObjectURL(url)))
</script>
