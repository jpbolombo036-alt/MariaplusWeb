<template>
  <div class="min-h-full">
    <div class="max-w-3xl mx-auto">
      <div class="flex items-center gap-3 mb-6">
        <button @click="$router.back()" class="h-10 w-10 rounded-lg border border-slate-200 bg-white text-slate-600 inline-flex items-center justify-center hover:bg-slate-50 transition-colors">
          <span class="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <div>
          <h1 class="text-[22px] font-bold text-slate-900 tracking-tight">Modifier l'événement</h1>
          <p class="text-[13px] text-slate-500 mt-0.5 font-medium">Mettez à jour les informations de votre événement.</p>
        </div>
      </div>

      <p v-if="loading" class="text-slate-400 py-10 text-center text-sm">Chargement…</p>

      <div v-else class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <form @submit.prevent="submit" class="space-y-5">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <label class="block">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Nom de l'événement *</span>
              <input v-model="form.name" required placeholder="Nom de l'événement" class="input" />
            </label>
            <label class="block">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Date</span>
              <input v-model="form.eventDate" type="date" class="input" />
            </label>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <label class="block">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Heure de début</span>
              <input v-model="form.startTime" type="time" class="input" />
            </label>
            <label class="block">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Heure de fin</span>
              <input v-model="form.endTime" type="time" class="input" />
            </label>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <label class="block">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Lieu</span>
              <input v-model="form.venueName" placeholder="Ex : Salle des fêtes" class="input" />
            </label>
            <label class="block">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Adresse</span>
              <input v-model="form.venueAddress" placeholder="Adresse complète" class="input" />
            </label>
          </div>

          <label class="block">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Ville</span>
            <input v-model="form.city" placeholder="Ville" class="input" />
          </label>

          <label class="block">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Description</span>
            <textarea v-model="form.description" rows="2" placeholder="Optionnel" class="input resize-none"></textarea>
          </label>

          <label class="block">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Message aux invités</span>
            <textarea v-model="form.message" rows="3" placeholder="Message affiché sur l'invitation (optionnel)" class="input resize-none"></textarea>
          </label>

          <DressCodeField v-model="form.dressColors" :event-id="id" />

          <section class="border-t border-slate-100 pt-5 space-y-5">
            <div>
              <h2 class="text-[15px] font-bold text-slate-900">Photos de l'événement</h2>
              <p class="text-[12px] text-slate-500 mt-1">Remplacez les visuels existants. Les images sont limitées à 2 Mo.</p>
            </div>
            <div>
              <span class="field-label">Photo de couverture <span class="normal-case font-medium text-slate-400">(16:9)</span></span>
              <div class="flex items-center gap-4">
                <div class="w-32 h-20 rounded-lg overflow-hidden bg-slate-50 border border-slate-200 grid place-items-center shrink-0">
                  <img v-if="coverPreview" :src="coverPreview" alt="Couverture" class="w-full h-full object-cover" />
                  <span v-else class="material-symbols-outlined text-3xl text-slate-300">image</span>
                </div>
                <div>
                  <button type="button" class="photo-btn" @click="coverInput?.click()"><span class="material-symbols-outlined text-[17px]">photo_camera</span>{{ coverFile ? 'Remplacer' : 'Choisir une photo' }}</button>
                  <button v-if="coverPreview" type="button" class="remove-btn" @click="clearCover">Retirer</button>
                </div>
              </div>
              <input ref="coverInput" type="file" accept="image/jpeg,image/png,image/gif,image/webp" class="hidden" @change="onCoverPick" />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div v-for="photo in photoFields" :key="photo.kind">
                <span class="field-label">{{ photo.label }}</span>
                <div class="w-full aspect-[4/3] rounded-lg overflow-hidden bg-slate-50 border border-slate-200 grid place-items-center mb-2">
                  <img v-if="photoState[photo.kind].preview" :src="photoState[photo.kind].preview!" :alt="photo.label" class="w-full h-full object-cover" />
                  <span v-else class="material-symbols-outlined text-3xl text-slate-300">image</span>
                </div>
                <button type="button" class="photo-btn" @click="pickPhoto(photo.kind)"><span class="material-symbols-outlined text-[15px]">photo_camera</span>{{ photoState[photo.kind].file ? 'Remplacer' : 'Choisir' }}</button>
                <input :id="`edit-photo-input-${photo.kind}`" type="file" accept="image/jpeg,image/png,image/gif,image/webp" class="hidden" @change="onPick(photo.kind, $event)" />
              </div>
            </div>
            <p v-if="photoError" class="text-error text-[13px]">{{ photoError }}</p>
          </section>

          <div class="flex justify-end gap-3 pt-2">
            <button type="button" @click="$router.back()" class="px-4 h-10 text-slate-500 text-[13px] font-medium hover:text-slate-700 transition-colors">Annuler</button>
            <button type="submit" :disabled="saving" class="px-5 h-10 rounded-lg bg-primary text-white text-[13px] font-bold shadow-sm shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-50">{{ saving ? 'Enregistrement…' : 'Enregistrer' }}</button>
          </div>
          <p v-if="saveError" class="text-error text-[13px]">{{ saveError }}</p>
        </form>
      </div>
    </div>
    <ImageCropModal
      v-if="crop"
      :src="crop.src"
      :title="crop.target === 'cover' ? 'Recadrer la photo de couverture' : 'Recadrer la photo'"
      :aspect-ratio="crop.target === 'cover' ? 16 / 9 : 1"
      :max-width="crop.target === 'cover' ? 1600 : 900"
      @close="releaseCrop"
      @confirm="onCropped"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { absolutePhotoUrl, deleteEventImage, getEvent, loadEventImage, updateEvent, uploadEventImage, uploadEventPhoto, type EventPhotoKind } from '../../api/events'
import DressCodeField from '../../components/events/DressCodeField.vue'
import ImageCropModal from '../../components/common/ImageCropModal.vue'

const route = useRoute()
const id = Number(route.params.id)
const loading = ref(true)
const saving = ref(false)
const saveError = ref('')
const photoError = ref('')
const coverInput = ref<HTMLInputElement | null>(null)
const coverFile = ref<File | null>(null)
const coverPreview = ref<string | null>(null)
const coverRemoved = ref(false)
const crop = ref<{ src: string; target: string } | null>(null)
const photoFields: { kind: EventPhotoKind; label: string }[] = [
  { kind: 'groom', label: 'Photo du marié' },
  { kind: 'bride', label: 'Photo de la mariée' },
  { kind: 'couple', label: 'Photo du couple' },
]
const photoState = reactive<Record<EventPhotoKind, { file: File | null; preview: string | null }>>({
  groom: { file: null, preview: null },
  bride: { file: null, preview: null },
  couple: { file: null, preview: null },
})

const form = reactive({
  name: '',
  eventDate: '',
  startTime: '',
  endTime: '',
  venueName: '',
  venueAddress: '',
  city: '',
  description: '',
  message: '',
  dressColors: [] as string[],
})

onMounted(async () => {
  try {
    const ev = await getEvent(id)
    form.name = ev.name ?? ''
    form.eventDate = ev.eventDate?.slice(0, 10) ?? ''
    form.startTime = ev.startTime?.slice(0, 5) ?? ''
    form.endTime = ev.endTime?.slice(0, 5) ?? ''
    form.venueName = ev.venueName ?? ''
    form.venueAddress = ev.venueAddress ?? ''
    form.city = ev.city ?? ''
    form.description = ev.description ?? ''
    form.message = ev.message ?? ''
    form.dressColors = ev.dressColors ?? []
    coverPreview.value = await loadEventImage(id)
    for (const photo of photoFields) {
      const details = ev.weddingDetails
      const url = details?.[`${photo.kind}PhotoUrl` as keyof typeof details]
      photoState[photo.kind].preview = typeof url === 'string' && url ? absolutePhotoUrl(url) : null
    }
  } finally {
    loading.value = false
  }
})

function releaseCrop() {
  if (crop.value) URL.revokeObjectURL(crop.value.src)
  crop.value = null
}

function openCrop(target: string, file: File) {
  releaseCrop()
  crop.value = { src: URL.createObjectURL(file), target }
}

function validImage(file: File): boolean {
  if (!/^image\/(jpeg|png|gif|webp)$/.test(file.type)) {
    photoError.value = 'Format non supporté (JPEG, PNG, GIF ou WebP attendu).'
    return false
  }
  if (file.size > 2 * 1024 * 1024) {
    photoError.value = 'Image trop volumineuse (max 2 Mo).'
    return false
  }
  photoError.value = ''
  return true
}

function onCropped(blob: Blob) {
  if (!crop.value) return
  const target = crop.value.target
  const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' })
  const preview = URL.createObjectURL(blob)
  if (target === 'cover') {
    if (coverPreview.value?.startsWith('blob:')) URL.revokeObjectURL(coverPreview.value)
    coverFile.value = file
    coverPreview.value = preview
    coverRemoved.value = false
  } else {
    const state = photoState[target as EventPhotoKind]
    if (state.preview?.startsWith('blob:')) URL.revokeObjectURL(state.preview)
    state.file = file
    state.preview = preview
  }
  releaseCrop()
}

function onCoverPick(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file && validImage(file)) openCrop('cover', file)
}

function pickPhoto(kind: EventPhotoKind) {
  document.getElementById(`edit-photo-input-${kind}`)?.click()
}

function onPick(kind: EventPhotoKind, e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file && validImage(file)) openCrop(kind, file)
}

function clearCover() {
  coverFile.value = null
  coverRemoved.value = true
  if (coverPreview.value?.startsWith('blob:')) URL.revokeObjectURL(coverPreview.value)
  coverPreview.value = null
}

async function submit() {
  saving.value = true
  saveError.value = ''
  try {
    const payload: Record<string, unknown> = { name: form.name }
    if (form.eventDate) payload.eventDate = form.eventDate
    if (form.startTime) payload.startTime = form.startTime
    if (form.endTime) payload.endTime = form.endTime
    payload.venueName = form.venueName || null
    payload.venueAddress = form.venueAddress || null
    payload.city = form.city || null
    payload.description = form.description || null
    payload.message = form.message || null
    payload.dressColors = form.dressColors
    await updateEvent(id, payload)
    if (coverFile.value) await uploadEventImage(id, coverFile.value)
    else if (coverRemoved.value) await deleteEventImage(id)
    for (const photo of photoFields) {
      const file = photoState[photo.kind].file
      if (file) await uploadEventPhoto(id, photo.kind, file)
    }
    window.history.length > 1 ? window.history.back() : window.location.href = `/dashboard/events/${id}`
  } catch (e: any) {
    saveError.value = e?.response?.data?.error || e?.message || "Impossible d'enregistrer l'événement."
  } finally {
    saving.value = false
  }
}

onBeforeUnmount(() => {
  releaseCrop()
  if (coverPreview.value?.startsWith('blob:')) URL.revokeObjectURL(coverPreview.value)
  for (const photo of photoFields) {
    if (photoState[photo.kind].preview?.startsWith('blob:')) URL.revokeObjectURL(photoState[photo.kind].preview!)
  }
})
</script>

<style scoped>
.input { @apply block w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-slate-400; }
.field-label { @apply text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block; }
.photo-btn { @apply px-3 h-9 rounded-lg bg-primary/10 text-primary text-[12px] font-semibold inline-flex items-center gap-1 hover:bg-primary/20 transition-colors; }
.remove-btn { @apply ml-2 text-[12px] text-error hover:bg-error/10 rounded-lg px-2 py-1 transition-colors; }
</style>
