<template>
  <div>
    <!-- En-tête -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h2 class="text-xl font-bold text-on-surface">Catégories d'invités</h2>
        <p class="text-sm text-on-surface-variant mt-0.5">{{ cats.length }} catégorie(s)</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"><span class="material-symbols-outlined text-lg">search</span></span>
          <input v-model="query" placeholder="Rechercher…" class="h-10 pl-10 pr-4 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm outline-none focus:border-primary w-52" />
        </div>
        <PermGuard :allow="['GUEST_CREATE']">
          <button class="h-10 px-5 rounded-xl bg-primary text-on-primary text-sm font-semibold inline-flex items-center gap-2 shadow-sm shadow-primary/20 hover:opacity-90 transition" @click="openCreate">
            <span class="material-symbols-outlined text-lg">add</span> Catégorie
          </button>
        </PermGuard>
      </div>
    </div>

    <p v-if="loading" class="text-on-surface-variant py-6 text-center">Chargement…</p>

    <div v-else-if="filtered.length === 0" class="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl py-12 text-center">
      <div class="w-16 h-16 mx-auto rounded-full bg-surface-container-high grid place-items-center mb-4"><span class="material-symbols-outlined text-3xl text-on-surface-variant">category</span></div>
      <h3 class="font-semibold text-on-surface">Aucune catégorie</h3>
      <p class="text-sm text-on-surface-variant mt-1">Créez des catégories pour organiser vos invités (Famille, Amis, Collègues…).</p>
    </div>

    <div v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="c in filtered" :key="c.id" class="group bg-surface-container-lowest border border-outline-variant/50 rounded-2xl p-5 flex items-center gap-3 hover:shadow-card hover:-translate-y-0.5 transition-all duration-300">
        <span class="w-10 h-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0"><span class="material-symbols-outlined">label</span></span>
        <div class="min-w-0 flex-1">
          <div class="font-semibold text-on-surface truncate">{{ c.name }}</div>
          <div v-if="c.description" class="text-xs text-on-surface-variant truncate">{{ c.description }}</div>
        </div>
        <PermGuard :allow="['GUEST_UPDATE']">
          <button class="text-on-surface-variant hover:text-primary opacity-0 group-hover:opacity-100 transition" @click="openEdit(c)"><span class="material-symbols-outlined text-lg">edit</span></button>
        </PermGuard>
        <PermGuard :allow="['GUEST_DELETE']">
          <button class="text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition" @click="remove(c)"><span class="material-symbols-outlined text-lg">delete</span></button>
        </PermGuard>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="formOpen" class="fixed inset-0 bg-black/40 z-50 grid place-items-center px-4" @click.self="closeForm">
      <form class="w-full max-w-sm bg-surface-container-lowest rounded-2xl p-6 shadow-2xl" @submit.prevent="save">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-on-surface text-lg">{{ editing ? 'Modifier' : 'Nouvelle' }} catégorie</h3>
          <button type="button" class="text-on-surface-variant hover:text-on-surface" @click="closeForm"><span class="material-symbols-outlined">close</span></button>
        </div>
        <label class="block text-xs font-semibold text-on-surface-variant mb-1">Nom *</label>
        <input v-model="form.name" required placeholder="Ex : Famille" class="input mb-3" />
        <label class="block text-xs font-semibold text-on-surface-variant mb-1">Description</label>
        <textarea v-model="form.description" rows="2" placeholder="Optionnel" class="input mb-4 resize-none"></textarea>
        <div class="flex justify-end gap-2">
          <button type="button" class="px-4 h-10 text-on-surface-variant" @click="closeForm">Annuler</button>
          <button type="submit" class="px-5 h-10 rounded-lg bg-primary text-on-primary font-semibold">{{ editing ? 'Enregistrer' : 'Créer' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { listCategories, createCategory, updateCategory, deleteCategory, type GuestCategory } from '../../api/guests'
import PermGuard from '../../components/common/PermGuard.vue'

const route = useRoute()
const id = Number(route.params.id)
const cats = ref<GuestCategory[]>([])
const loading = ref(true)
const query = ref('')
const formOpen = ref(false)
const editing = ref<GuestCategory | null>(null)
const form = reactive({ name: '', description: '' })

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return cats.value
  return cats.value.filter((c) => c.name.toLowerCase().includes(q) || (c.description ?? '').toLowerCase().includes(q))
})

onMounted(load)
async function load() {
  try {
    cats.value = await listCategories(id)
  } finally {
    loading.value = false
  }
}
function openCreate() {
  editing.value = null
  form.name = ''
  form.description = ''
  formOpen.value = true
}
function openEdit(c: GuestCategory) {
  editing.value = c
  form.name = c.name
  form.description = c.description ?? ''
  formOpen.value = true
}
function closeForm() {
  formOpen.value = false
}
async function save() {
  if (editing.value) {
    const updated = await updateCategory(id, editing.value.id, { name: form.name, description: form.description || null })
    cats.value = cats.value.map((c) => (c.id === updated.id ? updated : c))
  } else {
    const created = await createCategory(id, form.name, form.description)
    cats.value.push(created)
  }
  closeForm()
}
async function remove(c: GuestCategory) {
  if (!confirm(`Supprimer la catégorie « ${c.name} » ?`)) return
  await deleteCategory(id, c.id)
  cats.value = cats.value.filter((x) => x.id !== c.id)
}
</script>

<style scoped>
.input { @apply block w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest outline-none focus:border-primary text-on-surface; }
</style>

