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

    <!-- ========== Choix des invités : base d'achat avant le jour J ========== -->
    <div class="bg-white border border-slate-200 rounded-2xl p-6 mb-5">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 class="text-[18px] font-bold text-slate-900 flex items-center gap-2">
            <span class="material-symbols-outlined text-[20px] text-primary">shopping_cart</span>
            Choix des invités
          </h2>
          <p class="text-[13px] text-slate-500 mt-0.5">
            Réponses acceptées — servez-vous pour acheter les boissons avant le jour J.
          </p>
        </div>
        <span v-if="!rsvpLoading && acceptedRsvps.length" class="text-[12px] text-slate-400 self-start sm:self-auto">
          {{ acceptedRsvps.length }} réponse(s) acceptée(s) · {{ noChoiceCount }} sans choix
        </span>
      </div>

      <p v-if="rsvpLoading" class="text-slate-400 text-sm py-6 text-center">Chargement des réponses…</p>

      <div v-else-if="!acceptedRsvps.length" class="text-center py-8">
        <div class="w-14 h-14 mx-auto rounded-full bg-slate-50 grid place-items-center mb-3">
          <span class="material-symbols-outlined text-2xl text-slate-300">how_to_reg</span>
        </div>
        <p class="text-sm text-slate-500">Aucune réponse RSVP acceptée pour le moment.</p>
        <p class="text-[12px] text-slate-400 mt-1">Les choix de boisson apparaîtront ici dès que vos invités répondront.</p>
      </div>

      <div v-else-if="!choiceStats.length" class="text-center py-8">
        <div class="w-14 h-14 mx-auto rounded-full bg-slate-50 grid place-items-center mb-3">
          <span class="material-symbols-outlined text-2xl text-slate-300">local_bar</span>
        </div>
        <p class="text-sm text-slate-500">Aucune boisson choisie pour l'instant.</p>
        <p class="text-[12px] text-slate-400 mt-1">{{ acceptedRsvps.length }} réponse(s) acceptée(s), {{ noChoiceCount }} sans choix.</p>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="s in choiceStats" :key="s.name.toLowerCase()" class="rounded-xl border border-slate-200 bg-slate-50/60 p-4 min-w-0">
          <div class="flex items-center gap-3">
            <img v-if="s.imageUrl" :src="absUrl(s.imageUrl)" :alt="s.name" class="w-11 h-11 rounded-lg object-cover bg-white border border-slate-200 shrink-0" />
            <span v-else class="w-11 h-11 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
              <span class="material-symbols-outlined text-[20px]">local_bar</span>
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-[14px] font-bold text-slate-800 truncate">{{ s.name }}</p>
              <p class="text-[11px] text-slate-500">≈ {{ s.attendees }} personne(s) à prévoir</p>
            </div>
            <span class="shrink-0 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[15px] font-bold leading-none" :title="`${s.count} réponse(s)`">
              {{ s.count }}<span class="text-[10px] font-semibold"> rép.</span>
            </span>
          </div>
          <p class="text-[12px] text-slate-500 mt-3 truncate" :title="s.guests.join(', ')">
            {{ s.guests.slice(0, 3).join(', ') }}{{ s.guests.length > 3 ? ` +${s.guests.length - 3} autre(s)` : '' }}
          </p>
          <span v-if="!s.declared" class="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">Hors catalogue déclaré</span>
        </div>
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
import { listRsvps, type RsvpRow } from '../../api/rsvp'
import { listGuests, type Guest } from '../../api/guests'
import { ApiConfig } from '../../api/config'

const route = useRoute()
const eventId = Number(route.params.id)
const drinks = ref<AvailableDrink[]>([])
const loading = ref(false)
const busyId = ref<number | null>(null)

// Réponses RSVP + invités : base du bloc « Choix des invités » (achat avant
// le jour J). Chargés en parallèle du catalogue, indépendamment de `loading`.
const rsvps = ref<RsvpRow[]>([])
const guests = ref<Guest[]>([])
const rsvpLoading = ref(false)

const availableCount = computed(() => drinks.value.filter((d) => d.available && d.active).length)

/** Réponses acceptées : seules elles comptent pour les achats du jour J. */
const acceptedRsvps = computed(() => rsvps.value.filter((r) => r.status === 'ACCEPTED'))

/** Réponses acceptées qui n'ont choisi aucune boisson. */
const noChoiceCount = computed(() =>
  acceptedRsvps.value.filter((r) => !r.drinkChoices || r.drinkChoices.length === 0).length,
)

const guestById = computed(() => new Map(guests.value.map((g) => [g.id, g])))

/** Agrégat par boisson : réponses, personnes concernées, invités, photo. */
interface ChoiceStat {
  name: string
  count: number
  attendees: number
  guests: string[]
  imageUrl: string | null
  declared: boolean
}

const choiceStats = computed<ChoiceStat[]>(() => {
  const byName = new Map<string, ChoiceStat>()
  // Index du catalogue (déclaré disponible ou non) pour la photo et le badge.
  const drinkByKey = new Map(drinks.value.map((d) => [d.name.toLowerCase(), d]))
  for (const r of acceptedRsvps.value) {
    const choices = r.drinkChoices ?? []
    if (!choices.length) continue
    const g = guestById.value.get(r.guestId)
    const personName = g ? `${g.firstName} ${g.lastName}` : `#${r.guestId}`
    for (const raw of choices) {
      const name = raw.trim()
      if (!name) continue
      const key = name.toLowerCase()
      let stat = byName.get(key)
      if (!stat) {
        const declared = drinkByKey.get(key)
        stat = {
          name,
          count: 0,
          attendees: 0,
          guests: [],
          imageUrl: declared?.imageUrl ?? null,
          declared: declared != null,
        }
        byName.set(key, stat)
      }
      stat.count += 1
      stat.attendees += r.numberOfAttendees ?? 1
      stat.guests.push(personName)
    }
  }
  // Le plus choisi d'abord (pour l'achat), puis par ordre alphabétique.
  return [...byName.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'fr'))
})

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

/** Charge les réponses RSVP et les invités pour agréger les choix de boisson. */
async function loadRsvpChoices() {
  rsvpLoading.value = true
  try {
    const [rows, g] = await Promise.all([listRsvps(eventId), listGuests(eventId)])
    rsvps.value = rows
    guests.value = g
  } catch {
    // erreurs HTTP déjà notifiées par l'intercepteur
  } finally {
    rsvpLoading.value = false
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

onMounted(() => {
  load()
  loadRsvpChoices()
})
</script>