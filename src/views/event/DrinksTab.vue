<template>
  <div>
    <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-5">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 class="text-[22px] font-bold text-slate-900 tracking-tight">Boissons</h2>
          <p class="text-[13px] text-slate-500 mt-0.5 font-medium">{{ drinks.length }} boisson(s)</p>
        </div>
        <PermGuard :allow="['DRINK_CREATE']">
          <button class="h-10 px-5 rounded-lg bg-primary text-white text-[13px] font-semibold inline-flex items-center gap-2 shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all" @click="openCreate">
            <span class="material-symbols-outlined text-[18px]">add</span> Ajouter
          </button>
        </PermGuard>
      </div>
    </div>

    <div v-if="loading" class="text-on-surface-variant">Chargement…</div>
    <div v-else-if="drinks.length === 0" class="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl p-10 text-center">
      <div class="w-16 h-16 mx-auto rounded-full bg-surface-container-high grid place-items-center mb-4"><span class="material-symbols-outlined text-3xl text-on-surface-variant">local_bar</span></div>
      <h3 class="font-semibold text-on-surface">Aucune boisson</h3>
      <p class="text-sm text-on-surface-variant mt-1">Ajoutez des boissons pour les proposer aux invités.</p>
    </div>

    <div v-else class="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-surface-container text-left text-on-surface-variant">
          <tr>
            <th class="px-5 py-3.5">Nom</th>
            <th class="px-5 py-3.5">Description</th>
            <th class="px-5 py-3.5">Ordre</th>
            <th class="px-5 py-3.5">Actif</th>
            <th class="px-5 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-outline-variant">
          <tr v-for="d in drinks" :key="d.id" class="text-on-surface hover:bg-surface-container/40">
            <td class="px-5 py-3.5">
              <div class="flex items-center gap-3">
                <img v-if="d.imageUrl" :src="d.imageUrl" :alt="d.name" class="w-10 h-10 rounded-lg object-cover bg-surface-container-high" />
                <span v-else class="w-10 h-10 rounded-lg bg-surface-container-high grid place-items-center text-on-surface-variant"><span class="material-symbols-outlined text-base">local_bar</span></span>
                <span class="font-medium">{{ d.name }}</span>
              </div>
            </td>
            <td class="px-5 py-3.5 text-on-surface-variant">{{ d.description || '—' }}</td>
            <td class="px-5 py-3.5">{{ d.displayOrder ?? '—' }}</td>
            <td class="px-5 py-3.5"><StatusBadge :status="d.active ? 'ACTIVE' : 'INACTIVE'" /></td>
            <td class="px-5 py-3.5 text-right">
              <div class="inline-flex items-center gap-1">
                <PermGuard :allow="['DRINK_UPDATE']">
                  <button class="px-2 py-1 text-primary hover:bg-primary/10 rounded-lg" title="Photo de la boisson" @click="pickImage(d)"><span class="material-symbols-outlined text-base">image</span></button>
                </PermGuard>
                <PermGuard v-if="d.imageUrl" :allow="['DRINK_UPDATE']">
                  <button class="px-2 py-1 text-amber-500 hover:bg-amber-50 rounded-lg" title="Retirer la photo" @click="removeImage(d)"><span class="material-symbols-outlined text-base">hide_image</span></button>
                </PermGuard>
                <PermGuard :allow="['DRINK_UPDATE']">
                  <button class="px-2 py-1 text-primary hover:bg-primary/10 rounded-lg" title="Modifier" @click="openEdit(d)"><span class="material-symbols-outlined text-base">edit</span></button>
                </PermGuard>
                <PermGuard :allow="['DRINK_DELETE']">
                  <button class="px-2 py-1 text-error hover:bg-error/10 rounded-lg" title="Supprimer" @click="remove(d)"><span class="material-symbols-outlined text-base">delete</span></button>
                </PermGuard>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="formOpen" class="fixed inset-0 bg-black/40 z-50 grid place-items-center px-4" @click.self="formOpen=false">
      <div class="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-lg">
        <h3 class="text-lg font-bold text-on-surface mb-4">{{ editId ? 'Modifier' : 'Nouvelle boisson' }}</h3>
        <div class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-on-surface mb-1">Nom</label>
            <input v-model="form.name" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-on-surface mb-1">Description</label>
            <textarea v-model="form.description" class="input" rows="3"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-on-surface mb-1">Ordre d'affichage</label>
            <input type="number" v-model.number="form.displayOrder" class="input" />
          </div>
          <div v-if="editId" class="flex items-center gap-2">
            <input type="checkbox" id="active" v-model="form.active" />
            <label for="active" class="text-sm text-on-surface">Actif</label>
          </div>
        </div>
        <div class="mt-5 flex justify-end gap-2">
          <button class="px-4 py-2 rounded-lg border border-outline-variant text-sm" @click="formOpen=false">Annuler</button>
          <button class="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold" @click="save">Enregistrer</button>
        </div>
      </div>
    </div>

    <!-- Sélecteur de fichier caché pour la photo d'une boisson -->
    <input ref="imageInput" type="file" accept="image/png,image/jpeg,image/gif,image/webp" class="hidden" @change="onImagePicked" />
    <ImageCropModal
      v-if="cropSrc"
      :src="cropSrc"
      title="Recadrer la photo de la boisson"
      :aspect-ratio="1"
      :max-width="800"
      @close="releaseCrop"
      @confirm="onCropped"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { listDrinks, createDrink, updateDrink, deleteDrink, uploadDrinkImage, deleteDrinkImage, type Drink, type CreateDrinkRequest, type UpdateDrinkRequest } from '../../api/drinks'
import { useNotificationStore } from '../../stores/notifications'
import PermGuard from '../../components/common/PermGuard.vue'
import StatusBadge from '../../components/common/StatusBadge.vue'
import ImageCropModal from '../../components/common/ImageCropModal.vue'

const route = useRoute()
const notifications = useNotificationStore()
const eventId = Number(route.params.id)
const drinks = ref<Drink[]>([])
const loading = ref(false)
const formOpen = ref(false)
const editId = ref<number | null>(null)
const form = ref<CreateDrinkRequest & { active?: boolean }>({ name: '', description: '', displayOrder: 0, active: true })

/* ---------- Photo d'une boisson ---------- */
const imageInput = ref<HTMLInputElement | null>(null)
const pendingDrink = ref<Drink | null>(null)
const cropSrc = ref<string | null>(null)

function pickImage(d: Drink) {
  pendingDrink.value = d
  imageInput.value?.click()
}

function onImagePicked(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  const d = pendingDrink.value
  input.value = ''
  if (!file || !d) return
  if (file.size > 2 * 1024 * 1024) {
    notifications.push('Image trop volumineuse (max 2 Mo).', 'error')
    return
  }
  if (cropSrc.value) URL.revokeObjectURL(cropSrc.value)
  cropSrc.value = URL.createObjectURL(file)
}

async function onCropped(blob: Blob) {
  releaseCrop()
  const d = pendingDrink.value
  if (!d) return
  try {
    await uploadDrinkImage(eventId, d.id, new File([blob], 'boisson.jpg', { type: 'image/jpeg' }))
    notifications.push('Photo de la boisson enregistrée.', 'success')
    await load()
  } catch {
    // le message d'erreur est déjà notifié par l'intercepteur HTTP
  }
}

function releaseCrop() {
  if (cropSrc.value) URL.revokeObjectURL(cropSrc.value)
  cropSrc.value = null
}

async function removeImage(d: Drink) {
  if (!confirm(`Retirer la photo de "${d.name}" ?`)) return
  await deleteDrinkImage(eventId, d.id)
  notifications.push('Photo retirée.', 'success')
  await load()
}

onMounted(load)
async function load() {
  loading.value = true
  try {
    drinks.value = await listDrinks(eventId)
  } finally {
    loading.value = false
  }
}
function openCreate() {
  editId.value = null
  form.value = { name: '', description: '', displayOrder: drinks.value.length, active: true }
  formOpen.value = true
}
function openEdit(d: Drink) {
  editId.value = d.id
  form.value = { name: d.name, description: d.description || '', displayOrder: d.displayOrder || 0, active: d.active }
  formOpen.value = true
}
async function save() {
  if (!form.value.name.trim()) return
  if (editId.value) {
    const payload: UpdateDrinkRequest = {
      name: form.value.name,
      description: form.value.description,
      displayOrder: form.value.displayOrder,
      active: form.value.active,
    }
    await updateDrink(eventId, editId.value, payload)
  } else {
    const payload: CreateDrinkRequest = {
      name: form.value.name,
      description: form.value.description,
      displayOrder: form.value.displayOrder,
    }
    await createDrink(eventId, payload)
  }
  formOpen.value = false
  await load()
}
async function remove(d: Drink) {
  if (!confirm(`Supprimer la boisson "${d.name}" ?`)) return
  await deleteDrink(eventId, d.id)
  await load()
}
</script>

<style scoped>
.input { @apply block w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest outline-none focus:border-primary text-on-surface; }
</style>
