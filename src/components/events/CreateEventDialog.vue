<template>
  <div class="fixed inset-0 bg-black/40 z-50 grid place-items-center px-4" @click.self="$emit('close')">
    <form class="w-full max-w-lg bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant shadow-2xl max-h-[90vh] overflow-y-auto" @submit.prevent="submit">
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-lg font-bold text-on-surface">Nouvel événement</h2>
        <button type="button" class="text-on-surface-variant hover:text-on-surface" @click="$emit('close')"><span class="material-symbols-outlined">close</span></button>
      </div>
      <p class="text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wide">Marié 🎩</p>
      <div class="grid sm:grid-cols-2 gap-3 mb-4">
        <input v-model="form.groomFirstName" required placeholder="Prénom du marié" class="input" />
        <input v-model="form.groomLastName" required placeholder="Nom du marié" class="input" />
      </div>
      <p class="text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wide">Mariée 👰</p>
      <div class="grid sm:grid-cols-2 gap-3 mb-4">
        <input v-model="form.brideFirstName" required placeholder="Prénom de la mariée" class="input" />
        <input v-model="form.brideLastName" required placeholder="Nom de la mariée" class="input" />
      </div>
      <p class="text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wide">Photo du couple</p>
      <div class="flex items-center gap-4 mb-4">
        <div class="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-surface-container grid place-items-center border border-outline-variant">
          <img v-if="photoPreview" :src="photoPreview" alt="Aperçu" class="w-full h-full object-cover" />
          <span v-else class="material-symbols-outlined text-3xl text-on-surface-variant/50">image</span>
        </div>
        <div class="min-w-0">
          <button type="button" class="px-4 h-9 rounded-lg bg-primary/10 text-primary text-[13px] font-semibold inline-flex items-center gap-2 hover:bg-primary/20 transition-colors" @click="fileInput?.click()"><span class="material-symbols-outlined text-[17px]">photo_camera</span> Choisir une photo</button>
          <button v-if="photoFile" type="button" class="ml-2 text-[12px] text-error hover:bg-error/10 rounded-lg px-2 py-1 transition-colors" @click="clearPhoto">Retirer</button>
          <p class="text-[11px] text-on-surface-variant mt-1.5">Un outil de recadrage s'ouvrira automatiquement après le choix de l'image.</p>
        </div>
      </div>
      <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/gif,image/webp" class="hidden" @change="onPhotoPick" />
      <textarea v-model="form.description" rows="2" placeholder="Description (optionnel)" class="input mb-3 resize-none"></textarea>
      <textarea v-model="form.message" rows="2" placeholder="Message d'invitation (optionnel)" class="input resize-none"></textarea>
      <p v-if="error" class="text-error text-sm mt-3">{{ error }}</p>
      <div class="flex justify-end gap-2 mt-6">
        <button type="button" class="px-4 h-10 rounded-lg text-on-surface-variant" @click="$emit('close')">Annuler</button>
        <button type="submit" :disabled="loading" class="px-6 h-10 rounded-xl bg-primary text-on-primary font-semibold disabled:opacity-60 inline-flex items-center gap-2">
          <span v-if="loading" class="material-symbols-outlined text-base animate-spin">progress_activity</span> Créer
        </button>
      </div>
    </form>
    <ImageCropModal
      v-if="cropSrc"
      :src="cropSrc"
      title="Recadrer la photo du couple"
      :aspect-ratio="1"
      :max-width="900"
      @close="releaseCrop"
      @confirm="onCropped"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { createEvent, uploadEventImage, uploadEventPhoto, type Event as EventModel } from '../../api/events'
import { useAuthStore } from '../../stores/auth'
import ImageCropModal from '../common/ImageCropModal.vue'

const emit = defineEmits<{ (e: 'close'): void; (e: 'created', w: EventModel): void }>()
const auth = useAuthStore()
const form = reactive({ groomFirstName: '', groomLastName: '', brideFirstName: '', brideLastName: '', description: '', message: '' })
const loading = ref(false)
const error = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const photoFile = ref<File | null>(null)
const photoPreview = ref<string | null>(null)
const cropSrc = ref<string | null>(null)

function onPhotoPick(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!/^image\/(jpeg|png|gif|webp)$/.test(file.type)) { error.value = 'Format non supporté (JPEG, PNG, GIF ou WebP attendu).'; return }
  if (file.size > 2 * 1024 * 1024) { error.value = 'Image trop volumineuse (max 2 Mo).'; return }
  error.value = ''
  if (cropSrc.value) URL.revokeObjectURL(cropSrc.value)
  cropSrc.value = URL.createObjectURL(file)
}

function onCropped(blob: Blob) {
  photoFile.value = new File([blob], 'photo-couple.jpg', { type: 'image/jpeg' })
  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value)
  photoPreview.value = URL.createObjectURL(blob)
  releaseCrop()
}

function releaseCrop() {
  if (cropSrc.value) URL.revokeObjectURL(cropSrc.value)
  cropSrc.value = null
}

function clearPhoto() {
  photoFile.value = null
  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value)
  photoPreview.value = null
}

async function submit() {
  loading.value = true
  error.value = ''
  try {
    const w = await createEvent({
      groomFirstName: form.groomFirstName,
      groomLastName: form.groomLastName,
      brideFirstName: form.brideFirstName,
      brideLastName: form.brideLastName,
      description: form.description || null,
      message: form.message || null,
      organizationId: auth.isSuperAdmin && auth.user?.organizationId ? auth.user.organizationId : undefined,
    })
    if (photoFile.value) {
      try { await uploadEventImage(w.id, photoFile.value); await uploadEventPhoto(w.id, 'couple', photoFile.value) }
      catch { /* la création reste valide même si l'upload échoue */ }
    }
    emit('created', w)
  } catch (e: any) {
    error.value = e?.response?.data?.error || 'Création impossible'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.input {
  @apply block w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest outline-none focus:border-primary text-on-surface placeholder:text-on-surface-variant/60;
}
</style>