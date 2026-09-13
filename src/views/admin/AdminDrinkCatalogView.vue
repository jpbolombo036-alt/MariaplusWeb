<template>
  <div>
    <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-[18px] font-bold text-slate-900">Catalogue des boissons</h2>
          <p class="text-[13px] text-slate-500 mt-0.5">
            Boissons globales de la plateforme. Les organisateurs choisissent ensuite celles
            disponibles pour leurs invités — ils ne peuvent pas créer de boissons.
          </p>
        </div>
        <button
          class="h-10 px-5 rounded-lg bg-primary text-white text-[13px] font-semibold inline-flex items-center gap-2 shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all"
          @click="openCreate"
        >
          <span class="material-symbols-outlined text-[18px]">add</span>
          Ajouter au catalogue
        </button>
      </div>

      <!-- Formulaire création / édition -->
      <div v-if="formOpen" class="mt-5 border border-slate-200 rounded-xl p-5 bg-slate-50/60">
        <p class="text-[13px] font-bold text-slate-800 mb-4">{{ editingId ? 'Modifier la boisson' : 'Nouvelle boisson' }}</p>
        <div class="grid sm:grid-cols-[2fr_1fr] gap-4 mb-4">
          <label class="block">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Nom *</span>
            <input v-model="form.name" type="text" placeholder="Ex. Jus Festa" class="h-10 w-full px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:border-primary" />
          </label>
          <label class="block">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Ordre d'affichage</span>
            <input v-model.number="form.displayOrder" type="number" min="0" placeholder="0" class="h-10 w-full px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:border-primary" />
          </label>
        </div>
        <label class="block mb-4">
          <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Description</span>
          <input v-model="form.description" type="text" placeholder="Optionnel" class="h-10 w-full px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:border-primary" />
        </label>
        <p v-if="formMsg" class="text-sm mb-3 inline-flex items-center gap-1" :class="formErr ? 'text-error' : 'text-success'">
          <span class="material-symbols-outlined text-[16px]">{{ formErr ? 'error' : 'check_circle' }}</span>
          {{ formMsg }}
        </p>
        <div class="flex justify-end gap-2">
          <button class="px-4 h-10 rounded-lg border border-slate-200 text-slate-600 text-[13px] font-medium hover:bg-slate-50" @click="formOpen = false">Annuler</button>
          <button :disabled="busy" class="px-5 h-10 rounded-lg bg-primary text-white text-[13px] font-bold shadow-sm shadow-primary/20 hover:bg-primary-dark disabled:opacity-50 transition-all" @click="save">
            {{ busy ? 'Enregistrement…' : 'Enregistrer' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="py-16 text-center text-slate-400 text-sm">Chargement…</div>
    <div v-else-if="loadErr" class="bg-white border border-slate-200 rounded-xl py-14 text-center shadow-sm">
      <div class="w-14 h-14 rounded-2xl bg-error-light mx-auto flex items-center justify-center mb-4">
        <span class="material-symbols-outlined text-error text-[28px]">cloud_off</span>
      </div>
      <p class="font-semibold text-slate-900">Erreur de chargement</p>
      <button class="mt-4 h-9 px-4 rounded-lg bg-primary text-white text-[13px] font-semibold hover:bg-primary-dark" @click="load">Réessayer</button>
    </div>
    <div v-else-if="items.length === 0" class="bg-white border border-slate-200 rounded-xl py-16 text-center shadow-sm">
      <div class="w-14 h-14 rounded-2xl bg-primary-light mx-auto flex items-center justify-center mb-4">
        <span class="material-symbols-outlined text-primary text-[28px]">local_bar</span>
      </div>
      <p class="font-semibold text-slate-900">Catalogue vide</p>
      <p class="text-sm text-slate-500 mt-1">Ajoutez les boissons que les organisateurs pourront déclarer disponibles.</p>
    </div>

    <!-- Grille du catalogue -->
    <div v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <div v-for="d in items" :key="d.id" class="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col">
        <div class="flex items-start gap-4">
          <div class="w-16 h-16 rounded-xl border border-slate-200 bg-slate-50 grid place-items-center overflow-hidden shrink-0">
            <img v-if="d.imageUrl" :src="absUrl(d.imageUrl)" :alt="d.name" class="w-full h-full object-cover" />
            <span v-else class="text-2xl">🍹</span>
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <p class="text-[15px] font-bold text-slate-900 truncate">{{ d.name }}</p>
              <span class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold"
                    :class="d.active ? 'bg-success-light text-success' : 'bg-slate-100 text-slate-500'">
                {{ d.active ? 'ACTIVE' : 'INACTIVE' }}
              </span>
            </div>
            <p class="text-[13px] text-slate-500 mt-0.5">{{ d.description || '—' }}</p>
            <p class="text-[11px] text-slate-400 mt-0.5">Ordre : {{ d.displayOrder ?? '—' }}</p>
          </div>
        </div>

        <div class="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-slate-100">
          <label class="inline-flex items-center gap-2 text-[12px] font-semibold text-slate-600 cursor-pointer" title="Changer la photo">
            <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" class="hidden" @change="onPickPhoto($event, d)" />
            <span class="material-symbols-outlined text-[18px] text-slate-400 hover:text-primary transition-colors">image</span>
          </label>
          <div class="flex items-center gap-2">
            <button class="h-8 w-8 rounded-lg border border-slate-200 text-slate-500 hover:text-primary hover:border-primary/30 inline-flex items-center justify-center" title="Modifier" @click="openEdit(d)">
              <span class="material-symbols-outlined text-[16px]">edit</span>
            </button>
            <button :disabled="busyId === d.id" class="h-8 px-2.5 rounded-lg border text-[11px] font-bold disabled:opacity-50"
                    :class="d.active ? 'border-error/30 text-error hover:bg-error-light' : 'border-success/30 text-success hover:bg-success-light'"
                    @click="toggleActive(d)">
              {{ d.active ? 'Désactiver' : 'Activer' }}
            </button>
            <button :disabled="busyId === d.id" class="h-8 w-8 rounded-lg border border-slate-200 text-slate-400 hover:text-error hover:border-error/30 inline-flex items-center justify-center" title="Supprimer" @click="remove(d)">
              <span class="material-symbols-outlined text-[16px]">delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import {
  listCatalog,
  createCatalogDrink,
  updateCatalogDrink,
  setCatalogDrinkActive,
  deleteCatalogDrink,
  uploadCatalogImage,
  catalogImageUrl,
  type CatalogDrink,
} from '../../api/drinkCatalog'

const items = ref<CatalogDrink[]>([])
const loading = ref(true)
const loadErr = ref(false)
const busy = ref(false)
const busyId = ref<number | null>(null)
const formOpen = ref(false)
const editingId = ref<number | null>(null)
const formMsg = ref('')
const formErr = ref(false)
const form = reactive({ name: '', description: '', displayOrder: 0 as number | '' })

async function load() {
  loading.value = true
  loadErr.value = false
  try {
    items.value = await listCatalog()
  } catch {
    loadErr.value = true
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  form.name = ''
  form.description = ''
  form.displayOrder = 0
  formMsg.value = ''
  formErr.value = false
  formOpen.value = true
}

function openEdit(d: CatalogDrink) {
  editingId.value = d.id
  form.name = d.name
  form.description = d.description ?? ''
  form.displayOrder = d.displayOrder ?? 0
  formMsg.value = ''
  formErr.value = false
  formOpen.value = true
}

async function save() {
  if (!form.name.trim()) {
    formErr.value = true
    formMsg.value = 'Le nom est requis.'
    return
  }
  busy.value = true
  formMsg.value = ''
  formErr.value = false
  try {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      displayOrder: typeof form.displayOrder === 'number' ? form.displayOrder : undefined,
    }
    if (editingId.value != null) {
      await updateCatalogDrink(editingId.value, payload)
    } else {
      await createCatalogDrink(payload)
    }
    formOpen.value = false
    await load()
  } catch {
    formErr.value = true
    formMsg.value = 'Erreur : enregistrement refusé (ce nom existe peut-être déjà).'
  } finally {
    busy.value = false
  }
}

async function toggleActive(d: CatalogDrink) {
  busyId.value = d.id
  try {
    const updated = await setCatalogDrinkActive(d.id, !d.active)
    d.active = updated.active
  } finally {
    busyId.value = null
  }
}

async function remove(d: CatalogDrink) {
  if (!window.confirm(`Supprimer « ${d.name} » du catalogue ?\nLes événements qui l'avaient déclarée disponible ne la proposeront plus.`)) return
  busyId.value = d.id
  try {
    await deleteCatalogDrink(d.id)
    await load()
  } finally {
    busyId.value = null
  }
}

async function onPickPhoto(e: Event, d: CatalogDrink) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  busyId.value = d.id
  try {
    await uploadCatalogImage(d.id, file)
    const updated = items.value.find((x) => x.id === d.id)
    if (updated) updated.imageUrl = `${catalogImageUrl(`/api/admin/drink-catalog/${d.id}/image`)}?v=${Date.now()}`
  } finally {
    busyId.value = null
  }
}

function absUrl(u: string): string {
  return catalogImageUrl(u)
}

onMounted(load)
</script>