<template>
  <div>
    <!-- En-tête -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h2 class="text-xl font-bold text-on-surface">Invités</h2>
        <p class="text-sm text-on-surface-variant mt-0.5">{{ guests.length }} invité(s) au total</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
            <span class="material-symbols-outlined text-lg">search</span>
          </span>
          <input
            v-model="query"
            placeholder="Rechercher…"
            class="h-10 pl-10 pr-4 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm outline-none focus:border-primary w-56"
          />
        </div>
        <PermGuard :allow="['GUEST_CREATE', 'GUEST_IMPORT']">
          <button class="h-10 px-5 rounded-xl bg-primary text-on-primary text-sm font-semibold inline-flex items-center gap-2 shadow-sm shadow-primary/20 hover:opacity-90 transition" @click="formOpen=true">
            <span class="material-symbols-outlined text-lg">person_add</span> Ajouter
          </button>
        </PermGuard>
      </div>
    </div>

    <p v-if="loading" class="text-on-surface-variant py-8 text-center">Chargement…</p>

    <!-- État vide -->
    <div v-else-if="filtered.length === 0" class="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl py-14 text-center">
      <div class="w-16 h-16 mx-auto rounded-full bg-surface-container-high grid place-items-center mb-4">
        <span class="material-symbols-outlined text-3xl text-on-surface-variant">group</span>
      </div>
      <h3 class="font-semibold text-on-surface">Aucun invité</h3>
      <p class="text-sm text-on-surface-variant mt-1">Ajoutez votre premier invité ou importez une liste.</p>
    </div>

    <!-- Grille d'invités -->
    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <article v-for="g in filtered" :key="g.id" class="group bg-surface-container-lowest border border-outline-variant/50 rounded-2xl p-5 shadow-sm hover:shadow-card hover:-translate-y-0.5 transition-all duration-300 flex flex-col">
        <div class="flex items-start gap-3">
          <span class="w-11 h-11 rounded-full grid place-items-center font-bold text-white text-sm shrink-0" :style="{ background: avatarColor(g.id) }">{{ initials(g) }}</span>
          <div class="min-w-0 flex-1">
            <div class="font-semibold text-on-surface truncate">{{ g.firstName }} {{ g.lastName }}</div>
            <div class="flex items-center gap-1.5 mt-1">
              <span v-if="categoryLabel(g.categoryId)" class="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-semibold">{{ categoryLabel(g.categoryId) }}</span>
            </div>
          </div>
          <PermGuard :allow="['GUEST_DELETE']">
            <button class="text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition" @click="remove(g)" title="Supprimer">
              <span class="material-symbols-outlined text-lg">delete</span>
            </button>
          </PermGuard>
        </div>

        <div class="mt-4 space-y-1.5 text-sm text-on-surface-variant">
          <div v-if="g.email" class="flex items-center gap-2 truncate">
            <span class="material-symbols-outlined text-base">mail</span>
            <span class="truncate">{{ g.email }}</span>
          </div>
          <div v-if="g.phone" class="flex items-center gap-2">
            <span class="material-symbols-outlined text-base">call</span>
            <span>{{ g.phone }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-base">group_add</span>
            <span>{{ (g.allowedCompanions ?? 0) }} accompagnant(s)</span>
          </div>
        </div>
      </article>
    </div>
    <!-- Modal ajout -->
    <div v-if="formOpen" class="fixed inset-0 bg-black/40 z-50 grid place-items-center px-4" @click.self="formOpen=false">
      <form class="w-full max-w-md bg-surface-container-lowest rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto" @submit.prevent="addGuest">
        <div class="flex items-center justify-between mb-5">
          <h3 class="font-bold text-on-surface text-lg">Nouvel invité</h3>
          <button type="button" class="text-on-surface-variant hover:text-on-surface" @click="formOpen=false"><span class="material-symbols-outlined">close</span></button>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label class="block text-xs font-semibold text-on-surface-variant mb-1">Prénom *</label>
            <input v-model="form.firstName" required placeholder="Prénom" class="input" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-on-surface-variant mb-1">Nom *</label>
            <input v-model="form.lastName" required placeholder="Nom" class="input" />
          </div>
        </div>

        <label class="block text-xs font-semibold text-on-surface-variant mb-1">Email</label>
        <input v-model="form.email" type="email" placeholder="email@exemple.com" class="input mb-3" />

        <label class="block text-xs font-semibold text-on-surface-variant mb-1">Téléphone</label>
        <input v-model="form.phone" placeholder="+33 …" class="input mb-3" />

        <div class="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label class="block text-xs font-semibold text-on-surface-variant mb-1">Catégorie</label>
            <select v-model="form.categoryId" class="input">
              <option :value="null">Aucune</option>
              <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-on-surface-variant mb-1">Accompagnants</label>
            <input v-model.number="form.allowedCompanions" type="number" min="0" placeholder="0" class="input" />
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-5">
          <button type="button" class="px-4 h-10 text-on-surface-variant" @click="formOpen=false">Annuler</button>
          <button type="submit" class="px-5 h-10 rounded-lg bg-primary text-on-primary font-semibold">Ajouter</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { listGuests, createGuest, deleteGuest, listCategories, type Guest, type GuestCategory } from '../../api/guests'
import PermGuard from '../../components/common/PermGuard.vue'

const route = useRoute()
const id = Number(route.params.id)
const guests = ref<Guest[]>([])
const categories = ref<GuestCategory[]>([])
const loading = ref(true)
const formOpen = ref(false)
const query = ref('')
const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  categoryId: null as number | null,
  allowedCompanions: 0,
})

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return guests.value
  return guests.value.filter(
    (g) => `${g.firstName} ${g.lastName}`.toLowerCase().includes(q) || (g.email ?? '').toLowerCase().includes(q),
  )
})

const initials = (g: Guest) => `${g.firstName.charAt(0)}${g.lastName.charAt(0)}`.toUpperCase()

const avatarPalette = ['#5b2ecc', '#176b5b', '#f4a340', '#1f2937', '#7c3aed', '#0e7490']
const avatarColor = (n: number) => avatarPalette[n % avatarPalette.length]

const categoryLabel = (cid?: number | null) => categories.value.find((c) => c.id === cid)?.name

onMounted(load)
async function load() {
  try {
    const [g, c] = await Promise.all([listGuests(id), listCategories(id)])
    guests.value = g
    categories.value = c
  } finally {
    loading.value = false
  }
}
async function addGuest() {
  const g = await createGuest(id, {
    firstName: form.firstName,
    lastName: form.lastName,
    email: form.email || null,
    phone: form.phone || null,
    categoryId: form.categoryId,
    allowedCompanions: form.allowedCompanions,
  })
  guests.value.push(g)
  formOpen.value = false
  Object.assign(form, { firstName: '', lastName: '', email: '', phone: '', categoryId: null, allowedCompanions: 0 })
}
async function remove(g: Guest) {
  if (!confirm(`Supprimer l'invité ${g.firstName} ${g.lastName} ?`)) return
  await deleteGuest(id, g.id)
  guests.value = guests.value.filter((x) => x.id !== g.id)
}
</script>

<style scoped>
</style>

.input { @apply block w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest outline-none focus:border-primary text-on-surface; }
