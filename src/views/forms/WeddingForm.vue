<template>
  <div class="min-h-full">
    <div class="max-w-3xl mx-auto">
      <div class="flex items-center gap-3 mb-6">
        <button @click="$router.back()" class="h-10 w-10 rounded-lg border border-slate-200 bg-white text-slate-600 inline-flex items-center justify-center hover:bg-slate-50 transition-colors">
          <span class="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <div>
          <h1 class="text-[22px] font-bold text-slate-900 tracking-tight">Nouvel événement</h1>
          <p class="text-[13px] text-slate-500 mt-0.5 font-medium">Créez un nouvel événement pour commencer.</p>
        </div>
      </div>

      <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <form @submit.prevent="submitCreate" class="space-y-5">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <label class="block">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Nom de l'événement *</span>
              <input v-model="form.name" required placeholder="Ex : Mariage de Jean et Marie" class="input" />
            </label>
            <label class="block">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Type *</span>
              <select v-model="form.type" required class="input">
                <option value="WEDDING">Mariage</option>
                <option value="COLLATION">Collation</option>
                <option value="ANNIVERSARY">Anniversaire</option>
                <option value="BAPTISM">Baptême</option>
                <option value="GRADUATION">Graduation</option>
                <option value="OTHER">Autre</option>
              </select>
            </label>
          </div>

          <!-- Photo de couverture : disponible pour TOUS les types -->
          <div>
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Photo de l'événement</span>
            <div class="flex items-center gap-4">
              <div class="w-28 h-20 rounded-lg overflow-hidden bg-slate-50 border border-slate-200 grid place-items-center shrink-0">
                <img v-if="coverPreview" :src="coverPreview" alt="Aperçu" class="w-full h-full object-cover" />
                <span v-else class="material-symbols-outlined text-3xl text-slate-300">image</span>
              </div>
              <div class="min-w-0">
                <button type="button" class="px-4 h-9 rounded-lg bg-primary/10 text-primary text-[13px] font-semibold inline-flex items-center gap-2 hover:bg-primary/20 transition-colors" @click="coverInput?.click()">
                  <span class="material-symbols-outlined text-[17px]">photo_camera</span> Choisir une photo
                </button>
                <button v-if="coverFile" type="button" class="ml-2 text-[12px] text-error hover:bg-error/10 rounded-lg px-2 py-1 transition-colors" @click="clearCover">Retirer</button>
                <p class="text-[11px] text-slate-400 mt-1.5">JPEG, PNG, GIF ou WebP — max 2 Mo</p>
              </div>
            </div>
            <input ref="coverInput" type="file" accept="image/jpeg,image/png,image/gif,image/webp" class="hidden" @change="onCoverPick" />
          </div>

          <div v-if="form.type === 'WEDDING'" class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <label class="block">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Prénom du marié *</span>
              <input v-model="form.groomFirstName" required placeholder="Ex : Jean" class="input" />
            </label>
            <label class="block">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Nom du marié *</span>
              <input v-model="form.groomLastName" required placeholder="Ex : Dupont" class="input" />
            </label>
            <label class="block">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Prénom de la mariée *</span>
              <input v-model="form.brideFirstName" required placeholder="Ex : Marie" class="input" />
            </label>
            <label class="block">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Nom de la mariée *</span>
              <input v-model="form.brideLastName" required placeholder="Ex : Martin" class="input" />
            </label>
          </div>

          <label class="block">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Description</span>
            <textarea v-model="form.description" rows="2" placeholder="Détails (optionnel)" class="input resize-none"></textarea>
          </label>

          <label class="block">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Message d'invitation</span>
            <textarea v-model="form.message" rows="2" placeholder="Petit mot personnalisé (optionnel)" class="input resize-none"></textarea>
          </label>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <label class="block">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Date de l'événement</span>
              <input v-model="form.eventDate" type="date" class="input" />
            </label>
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
              <input v-model="form.venueName" placeholder="Nom du lieu (optionnel)" class="input" />
            </label>
            <label class="block">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Ville</span>
              <input v-model="form.city" placeholder="Ville (optionnel)" class="input" />
            </label>
          </div>

          <div v-if="form.type === 'WEDDING'" class="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div v-for="p in photoFields" :key="p.kind">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">{{ p.label }}</span>
              <div class="w-full aspect-[4/3] rounded-lg overflow-hidden bg-slate-50 border border-slate-200 grid place-items-center mb-2">
                <img v-if="photoState[p.kind].preview" :src="photoState[p.kind].preview!" alt="Aperçu" class="w-full h-full object-cover" />
                <span v-else class="material-symbols-outlined text-3xl text-slate-300">image</span>
              </div>
              <div class="flex items-center gap-2">
                <button type="button" class="px-3 h-8 rounded-lg bg-primary/10 text-primary text-[12px] font-semibold inline-flex items-center gap-1 hover:bg-primary/20 transition-colors" @click="pickPhoto(p.kind)">
                  <span class="material-symbols-outlined text-[15px]">photo_camera</span> Choisir
                </button>
                <button v-if="photoState[p.kind].file" type="button" class="text-[12px] text-error hover:bg-error/10 rounded-lg px-2 py-1 transition-colors" @click="clearPhoto(p.kind)">Retirer</button>
              </div>
              <input :id="`photo-input-${p.kind}`" type="file" accept="image/jpeg,image/png,image/gif,image/webp" class="hidden" @change="onPick(p.kind, $event)" />
            </div>
          </div>

          <p v-if="photoError" class="text-error text-[13px] inline-flex items-center gap-1">
            <span class="material-symbols-outlined text-[16px]">error</span>{{ photoError }}
          </p>

          <div class="flex justify-end gap-3 pt-2">
            <button type="button" @click="$router.back()" class="px-4 h-10 text-slate-500 text-[13px] font-medium hover:text-slate-700 transition-colors">Annuler</button>
            <button type="submit" class="px-5 h-10 rounded-lg bg-primary text-white text-[13px] font-bold shadow-sm shadow-primary/20 hover:bg-primary-dark transition-all">Créer</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { createEvent, uploadEventPhoto, uploadEventImage } from '../../api/events'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const form = reactive({
  name: '',
  type: 'WEDDING',
  description: '',
  message: '',
  eventDate: '',
  startTime: '',
  endTime: '',
  venueName: '',
  venueAddress: '',
  city: '',
  commune: '',
  country: '',
  latitude: '',
  longitude: '',
  mapUrl: '',
  groomFirstName: '',
  groomLastName: '',
  brideFirstName: '',
  brideLastName: '',
  welcomeMessage: '',
})

/* --- Photos de la fiche mariage (upload, pas d'URL) --- */
const photoFields = [
  { kind: 'groom', label: 'Photo du marié' },
  { kind: 'bride', label: 'Photo de la mariée' },
  { kind: 'couple', label: 'Photo du couple' },
] as const
const photoState = reactive<Record<string, { file: File | null; preview: string | null }>>({
  groom: { file: null, preview: null },
  bride: { file: null, preview: null },
  couple: { file: null, preview: null },
})
const photoError = ref('')

/* --- Photo de couverture (tous types) --- */
const coverInput = ref<HTMLInputElement | null>(null)
const coverFile = ref<File | null>(null)
const coverPreview = ref<string | null>(null)

function onCoverPick(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!/^image\/(jpeg|png|gif|webp)$/.test(file.type)) {
    photoError.value = 'Format non supporté (JPEG, PNG, GIF ou WebP attendu).'
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    photoError.value = 'Image trop volumineuse (max 2 Mo).'
    return
  }
  photoError.value = ''
  coverFile.value = file
  if (coverPreview.value) URL.revokeObjectURL(coverPreview.value)
  coverPreview.value = URL.createObjectURL(file)
}
function clearCover() {
  coverFile.value = null
  if (coverPreview.value) URL.revokeObjectURL(coverPreview.value)
  coverPreview.value = null
}

function pickPhoto(kind: string) {
  document.getElementById(`photo-input-${kind}`)?.click()
}
function onPick(kind: string, e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!/^image\/(jpeg|png|gif|webp)$/.test(file.type)) {
    photoError.value = 'Format non supporté (JPEG, PNG, GIF ou WebP attendu).'
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    photoError.value = 'Image trop volumineuse (max 2 Mo).'
    return
  }
  photoError.value = ''
  photoState[kind].file = file
  if (photoState[kind].preview) URL.revokeObjectURL(photoState[kind].preview!)
  photoState[kind].preview = URL.createObjectURL(file)
}
function clearPhoto(kind: string) {
  photoState[kind].file = null
  if (photoState[kind].preview) URL.revokeObjectURL(photoState[kind].preview!)
  photoState[kind].preview = null
}

async function submitCreate() {
  const payload: Record<string, unknown> = {
    name: form.name,
    type: form.type,
    description: form.description || null,
    message: form.message || null,
    eventDate: form.eventDate || null,
    startTime: form.startTime || null,
    endTime: form.endTime || null,
    venueName: form.venueName || null,
    venueAddress: form.venueAddress || null,
    city: form.city || null,
    commune: form.commune || null,
    country: form.country || null,
    latitude: form.latitude ? Number(form.latitude) : null,
    longitude: form.longitude ? Number(form.longitude) : null,
    mapUrl: form.mapUrl || null,
  }
  if (form.type === 'WEDDING') {
    payload.groomFirstName = form.groomFirstName
    payload.groomLastName = form.groomLastName
    payload.brideFirstName = form.brideFirstName
    payload.brideLastName = form.brideLastName
    payload.welcomeMessage = form.welcomeMessage || null
  }
  // SUPER_ADMIN : le backend exige l'organisation ciblée
  if (auth.isSuperAdmin && auth.user?.organizationId) {
    payload.organizationId = auth.user.organizationId
  }
  const created = await createEvent(payload)
  // Upload des photos choisies (la création reste valide même si un upload échoue)
  if (coverFile.value) {
    try {
      await uploadEventImage(created.id, coverFile.value)
    } catch { /* ignore : photo non bloquante */ }
  }
  if (form.type === 'WEDDING') {
    for (const p of photoFields) {
      const file = photoState[p.kind].file
      if (file) {
        try {
          await uploadEventPhoto(created.id, p.kind, file)
        } catch { /* ignore : photo non bloquante */ }
      }
    }
  }
  router.push(`/dashboard/events/${created.id}`)
}
</script>

<style scoped>
.input { @apply block w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-slate-400; }
</style>
