<template>
  <div class="min-h-full">
    <div class="max-w-3xl mx-auto">
      <!-- En-tête -->
      <div class="flex items-center gap-3 mb-6">
        <button @click="$router.back()" class="h-10 w-10 rounded-lg border border-slate-200 bg-white text-slate-600 inline-flex items-center justify-center hover:bg-slate-50 transition-colors">
          <span class="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <div>
          <h1 class="text-[22px] font-bold text-slate-900 tracking-tight">Nouvel événement</h1>
          <p class="text-[13px] text-slate-500 mt-0.5 font-medium">Configurez votre événement en quelques étapes simples.</p>
        </div>
      </div>

      <!-- Fil d'étapes -->
      <ol class="flex items-start mb-6">
        <template v-for="(s, i) in steps" :key="s.n">
          <li class="flex flex-col items-center gap-1.5 w-20 shrink-0">
            <button
              type="button"
              :disabled="s.n > step"
              class="w-11 h-11 rounded-full grid place-items-center border-2 transition-all"
              :class="step > s.n
                ? 'bg-primary border-primary text-white cursor-pointer hover:bg-primary-dark'
                : step === s.n
                  ? 'border-primary text-primary bg-white ring-4 ring-primary/10'
                  : 'border-slate-200 text-slate-400 bg-white cursor-default'"
              @click="goTo(s.n)"
            >
              <span v-if="step > s.n" class="material-symbols-outlined text-[20px]">check</span>
              <span v-else class="material-symbols-outlined text-[20px]">{{ s.icon }}</span>
            </button>
            <span class="text-[11px] font-semibold text-center" :class="step >= s.n ? 'text-primary' : 'text-slate-400'">{{ s.label }}</span>
          </li>
          <li v-if="i < steps.length - 1" class="flex-1 h-0.5 mt-[21px] mx-1 rounded" :class="step > s.n ? 'bg-primary' : 'bg-slate-200'"></li>
        </template>
      </ol>

      <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <!-- ============ ÉTAPE 1 : INFORMATIONS ============ -->
        <div v-if="step === 1" class="space-y-5">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <label class="block">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Nom de l'événement *</span>
              <input v-model="form.name" placeholder="Ex : Mariage de Jean et Marie" class="input" />
            </label>
            <label class="block">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Type *</span>
              <select v-model="form.type" class="input">
                <option value="WEDDING">Mariage</option>
                <option value="COLLATION">Collation</option>
                <option value="ANNIVERSARY">Anniversaire</option>
                <option value="BAPTISM">Baptême</option>
                <option value="GRADUATION">Graduation</option>
                <option value="OTHER">Autre</option>
              </select>
            </label>
          </div>

          <div v-if="form.type === 'WEDDING'" class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <p class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Marié 🎩</p>
              <div class="grid grid-cols-2 gap-3">
                <input v-model="form.groomFirstName" placeholder="Prénom" class="input" />
                <input v-model="form.groomLastName" placeholder="Nom" class="input" />
              </div>
            </div>
            <div>
              <p class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Mariée 👰</p>
              <div class="grid grid-cols-2 gap-3">
                <input v-model="form.brideFirstName" placeholder="Prénom" class="input" />
                <input v-model="form.brideLastName" placeholder="Nom" class="input" />
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <label class="block">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Date</span>
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
<!-- PART2 -->

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <label class="block">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Lieu</span>
              <input v-model="form.venueName" placeholder="Nom du lieu (optionnel)" class="input" />
            </label>
            <label class="block">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Ville</span>
              <input v-model="form.city" placeholder="Ville (optionnel)" class="input" />
            </label>
            <label class="block">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Commune</span>
              <input v-model="form.commune" placeholder="Commune (optionnel)" class="input" />
            </label>
            <label class="block">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Pays</span>
              <input v-model="form.country" placeholder="Pays (optionnel)" class="input" />
            </label>
          </div>

          <label class="block">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Description (optionnel)</span>
            <textarea v-model="form.description" rows="2" placeholder="Quelques mots sur l'événement…" class="input resize-none"></textarea>
          </label>
          <label class="block">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Message d'invitation (optionnel)</span>
            <textarea v-model="form.message" rows="2" placeholder="Nous avons l'immense joie de vous inviter…" class="input resize-none"></textarea>
          </label>
        </div>

        <!-- ============ ÉTAPE 2 : VISUELS ============ -->
        <div v-else-if="step === 2" class="space-y-6">
          <div>
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Photo de couverture <span class="text-slate-400 normal-case font-medium">(16:9 — bannière, invitation, WhatsApp)</span></span>
            <div class="flex items-center gap-4">
              <div class="w-28 h-20 rounded-lg overflow-hidden bg-slate-50 border border-slate-200 grid place-items-center shrink-0">
                <img v-if="coverPreview" :src="coverPreview" alt="Aperçu" class="w-full h-full object-cover" />
                <span v-else class="material-symbols-outlined text-3xl text-slate-300">image</span>
              </div>
              <div class="min-w-0">
                <button type="button" class="px-4 h-9 rounded-lg bg-primary/10 text-primary text-[13px] font-semibold inline-flex items-center gap-2 hover:bg-primary/20 transition-colors" @click="coverInput?.click()">
                  <span class="material-symbols-outlined text-[17px]">photo_camera</span> {{ coverFile ? 'Remplacer' : 'Choisir une photo' }}
                </button>
                <button v-if="coverFile" type="button" class="ml-2 text-[12px] text-error hover:bg-error/10 rounded-lg px-2 py-1 transition-colors" @click="clearCover">Retirer</button>
                <p class="text-[11px] text-slate-400 mt-1.5">Un outil de recadrage s'ouvrira automatiquement après le choix de l'image.</p>
              </div>
            </div>
            <input ref="coverInput" type="file" accept="image/jpeg,image/png,image/gif,image/webp" class="hidden" @change="onCoverPick" />
          </div>
<!-- PART3 -->

          <div v-if="form.type === 'WEDDING'" class="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div v-for="p in photoFields" :key="p.kind">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">{{ p.label }}</span>
              <div class="w-full aspect-[4/3] rounded-lg overflow-hidden bg-slate-50 border border-slate-200 grid place-items-center mb-2">
                <img v-if="photoState[p.kind].preview" :src="photoState[p.kind].preview!" alt="Aperçu" class="w-full h-full object-cover" />
                <span v-else class="material-symbols-outlined text-3xl text-slate-300">image</span>
              </div>
              <div class="flex items-center gap-2">
                <button type="button" class="px-3 h-8 rounded-lg bg-primary/10 text-primary text-[12px] font-semibold inline-flex items-center gap-1 hover:bg-primary/20 transition-colors" @click="pickPhoto(p.kind)">
                  <span class="material-symbols-outlined text-[15px]">photo_camera</span> {{ photoState[p.kind].file ? 'Remplacer' : 'Choisir' }}
                </button>
                <button v-if="photoState[p.kind].file" type="button" class="text-[12px] text-error hover:bg-error/10 rounded-lg px-2 py-1 transition-colors" @click="clearPhoto(p.kind)">Retirer</button>
              </div>
              <input :id="`wizard-photo-input-${p.kind}`" type="file" accept="image/jpeg,image/png,image/gif,image/webp" class="hidden" @change="onPick(p.kind, $event)" />
            </div>
          </div>

          <p v-if="photoError" class="text-error text-[13px] inline-flex items-center gap-1">
            <span class="material-symbols-outlined text-[16px]">error</span>{{ photoError }}
          </p>
          <p class="text-[12px] text-slate-400">Optionnel — vous pourrez toujours ajouter les visuels plus tard depuis le tableau de bord.</p>
        </div>

        <!-- ============ ÉTAPE 3 : PROGRAMME ============ -->
        <div v-else-if="step === 3" class="space-y-5">
          <p class="text-[13px] text-slate-500">Décrivez le déroulé de la journée (cérémonie, réception, cocktail…). Il sera affiché automatiquement <strong>sur l'invitation de vos invités</strong>. Optionnel.</p>

          <div v-if="sessions.length" class="space-y-2">
            <div v-for="(s, i) in sessions" :key="i" class="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5">
              <span class="w-7 h-7 rounded-full bg-primary text-white text-[12px] font-bold grid place-items-center shrink-0">{{ i + 1 }}</span>
              <div class="min-w-0 flex-1">
                <p class="text-[13px] font-semibold text-slate-800 truncate">{{ s.name }}</p>
                <p class="text-[11.5px] text-slate-500">{{ sessionTypeLabel(s.type) }}<template v-if="s.startTime"> · {{ s.startTime }}</template><template v-if="s.endTime"> – {{ s.endTime }}</template></p>
              </div>
              <button type="button" class="text-error hover:bg-error/10 rounded-lg px-2 py-1 text-[12px]" @click="sessions.splice(i, 1)">Retirer</button>
            </div>
          </div>
          <p v-else class="rounded-lg border border-dashed border-slate-300 bg-slate-50/60 px-4 py-6 text-center text-[13px] text-slate-400">Aucune étape pour le moment.</p>

          <div class="rounded-lg border border-slate-200 p-4 space-y-3">
            <p class="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Ajouter une étape</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input v-model="sessionDraft.name" placeholder="Ex : Cérémonie religieuse" class="input" />
              <select v-model="sessionDraft.type" class="input">
                <option v-for="t in sessionTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <input v-model="sessionDraft.startTime" type="time" class="input" />
              <input v-model="sessionDraft.endTime" type="time" class="input" />
            </div>
            <p v-if="sessionError" class="text-error text-[12px]">{{ sessionError }}</p>
            <button type="button" class="w-full h-9 rounded-lg border border-primary/30 text-primary text-[13px] font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-primary/5 transition-colors" @click="addSession">
              <span class="material-symbols-outlined text-[17px]">add</span> Ajouter au programme
            </button>
          </div>
        </div>
<!-- PART4 -->

        <!-- ============ ÉTAPE 4 : PUBLICATION ============ -->
        <div v-else class="space-y-5">
          <p class="text-[13px] text-slate-500">Vérifiez les informations avant de créer l'événement.</p>
          <dl class="rounded-lg border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            <div class="px-4 py-3 grid grid-cols-3 gap-3"><dt class="text-[12px] font-bold text-slate-400 uppercase tracking-wide">Nom</dt><dd class="col-span-2 text-[13px] text-slate-800 font-medium">{{ form.name }}</dd></div>
            <div class="px-4 py-3 grid grid-cols-3 gap-3"><dt class="text-[12px] font-bold text-slate-400 uppercase tracking-wide">Type</dt><dd class="col-span-2 text-[13px] text-slate-800">{{ typeLabel }}</dd></div>
            <div v-if="form.type === 'WEDDING'" class="px-4 py-3 grid grid-cols-3 gap-3"><dt class="text-[12px] font-bold text-slate-400 uppercase tracking-wide">Mariés</dt><dd class="col-span-2 text-[13px] text-slate-800">{{ form.groomFirstName }} {{ form.groomLastName }} &amp; {{ form.brideFirstName }} {{ form.brideLastName }}</dd></div>
            <div v-if="form.eventDate" class="px-4 py-3 grid grid-cols-3 gap-3"><dt class="text-[12px] font-bold text-slate-400 uppercase tracking-wide">Date</dt><dd class="col-span-2 text-[13px] text-slate-800">{{ form.eventDate }}<template v-if="form.startTime"> · {{ form.startTime }}</template><template v-if="form.endTime"> – {{ form.endTime }}</template></dd></div>
            <div v-if="form.venueName || form.city" class="px-4 py-3 grid grid-cols-3 gap-3"><dt class="text-[12px] font-bold text-slate-400 uppercase tracking-wide">Lieu</dt><dd class="col-span-2 text-[13px] text-slate-800">{{ [form.venueName, form.commune, form.city, form.country].filter(Boolean).join(', ') }}</dd></div>
            <div class="px-4 py-3 grid grid-cols-3 gap-3"><dt class="text-[12px] font-bold text-slate-400 uppercase tracking-wide">Visuels</dt><dd class="col-span-2 text-[13px] text-slate-800">{{ visualsCount }} photo(s)</dd></div>
            <div v-if="sessions.length" class="px-4 py-3 grid grid-cols-3 gap-3"><dt class="text-[12px] font-bold text-slate-400 uppercase tracking-wide">Programme</dt><dd class="col-span-2 text-[13px] text-slate-800">{{ sessions.length }} étape(s)</dd></div>
          </dl>
          <p class="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 text-[12.5px] text-slate-600">
            <span class="material-symbols-outlined text-[15px] align-[-3px] text-primary">info</span>
            Après la création, vous serez redirigé vers le tableau de bord : <strong>invités, invitations, tables et boissons</strong> s'y gèrent en un clic.
          </p>
          <p v-if="error" class="text-error text-[13px]">{{ error }}</p>
        </div>

        <!-- Navigation -->
        <div class="flex justify-between gap-3 pt-6 mt-2 border-t border-slate-100">
          <button type="button" class="px-4 h-10 rounded-lg text-slate-500 text-[13px] font-medium inline-flex items-center gap-1.5 hover:bg-slate-50 transition-colors" @click="step === 1 ? $router.back() : back()">
            <span class="material-symbols-outlined text-[18px]">arrow_back</span> {{ step === 1 ? 'Annuler' : 'Retour' }}
          </button>
          <button
            v-if="step < 4"
            type="button"
            class="px-6 h-10 rounded-xl bg-primary text-white text-[13px] font-bold inline-flex items-center gap-2 shadow-sm shadow-primary/25 hover:bg-primary-dark transition-all"
            @click="next"
          >Continuer <span class="material-symbols-outlined text-[18px]">arrow_forward</span></button>
          <button
            v-else
            type="button"
            :disabled="loading"
            class="px-6 h-10 rounded-xl bg-primary text-white text-[13px] font-bold inline-flex items-center gap-2 shadow-sm shadow-primary/25 hover:bg-primary-dark transition-all disabled:opacity-60"
            @click="submitCreate"
          >
            <span v-if="loading" class="material-symbols-outlined text-base animate-spin">progress_activity</span>
            <span v-else class="material-symbols-outlined text-[18px]">rocket_launch</span> Créer l'événement
          </button>
        </div>
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
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { createEvent, uploadEventPhoto, uploadEventImage, type EventPhotoKind } from '../../api/events'
import { createWeddingEvent } from '../../api/weddingEvents'
import ImageCropModal from '../../components/common/ImageCropModal.vue'
import { useAuthStore } from '../../stores/auth'
import { useNotificationStore } from '../../stores/notifications'
/* ---------- Visuels (couverture 16:9 + photos 1:1, avec recadrage) ---------- */
const photoFields: { kind: EventPhotoKind; label: string }[] = [
  { kind: 'groom', label: 'Photo du marié' },
  { kind: 'bride', label: 'Photo de la mariée' },
  { kind: 'couple', label: 'Photo du couple' },
]
const photoState = reactive<Record<string, { file: File | null; preview: string | null }>>({
  groom: { file: null, preview: null },
  bride: { file: null, preview: null },
  couple: { file: null, preview: null },
})
const photoError = ref('')
const coverInput = ref<HTMLInputElement | null>(null)
const coverFile = ref<File | null>(null)
const coverPreview = ref<string | null>(null)
const crop = ref<{ src: string; target: string } | null>(null)

const visualsCount = computed(() => {
  let n = coverFile.value ? 1 : 0
  for (const p of photoFields) if (photoState[p.kind].file) n++
  return n
})

function openCrop(target: string, file: File) {
  if (crop.value) URL.revokeObjectURL(crop.value.src)
  crop.value = { src: URL.createObjectURL(file), target }
}
function onCropped(blob: Blob) {
  const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' })
  if (!crop.value) return
  if (crop.value.target === 'cover') {
    coverFile.value = file
    if (coverPreview.value) URL.revokeObjectURL(coverPreview.value)
    coverPreview.value = URL.createObjectURL(blob)
  } else {
    photoState[crop.value.target].file = file
    if (photoState[crop.value.target].preview) URL.revokeObjectURL(photoState[crop.value.target].preview!)
    photoState[crop.value.target].preview = URL.createObjectURL(blob)
  }
  releaseCrop()
}
function releaseCrop() {
  if (crop.value) URL.revokeObjectURL(crop.value.src)
  crop.value = null
}

function onCoverPick(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!/^image\/(jpeg|png|gif|webp)$/.test(file.type)) { photoError.value = 'Format non supporté (JPEG, PNG, GIF ou WebP attendu).'; return }
  if (file.size > 2 * 1024 * 1024) { photoError.value = 'Image trop volumineuse (max 2 Mo).'; return }
  photoError.value = ''
  openCrop('cover', file)
}
function clearCover() {
  coverFile.value = null
  if (coverPreview.value) URL.revokeObjectURL(coverPreview.value)
  coverPreview.value = null
}
function pickPhoto(kind: string) {
  document.getElementById(`wizard-photo-input-${kind}`)?.click()
}
function onPick(kind: string, e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!/^image\/(jpeg|png|gif|webp)$/.test(file.type)) { photoError.value = 'Format non supporté (JPEG, PNG, GIF ou WebP attendu).'; return }
  if (file.size > 2 * 1024 * 1024) { photoError.value = 'Image trop volumineuse (max 2 Mo).'; return }
  photoError.value = ''
  openCrop(kind, file)
}
function clearPhoto(kind: string) {
  photoState[kind].file = null
  if (photoState[kind].preview) URL.revokeObjectURL(photoState[kind].preview!)
  photoState[kind].preview = null
}
/* ---------- Programme (sessions) ---------- */
const sessionTypes = [
  { value: 'CIVIL_CEREMONY', label: 'Cérémonie civile' },
  { value: 'RELIGIOUS_CEREMONY', label: 'Cérémonie religieuse' },
  { value: 'RECEPTION', label: 'Réception' },
  { value: 'AFTER_PARTY', label: 'After party' },
  { value: 'OTHER', label: 'Autre' },
]
function sessionTypeLabel(t: string): string {
  return sessionTypes.find((x) => x.value === t)?.label ?? t
}
const sessions = ref<{ name: string; type: string; startTime: string; endTime: string }[]>([])
const sessionDraft = reactive({ name: '', type: 'CIVIL_CEREMONY', startTime: '', endTime: '' })
const sessionError = ref('')

function addSession() {
  sessionError.value = ''
  if (!sessionDraft.name.trim()) { sessionError.value = 'Le nom de l\u2019étape est requis.'; return }
  if (sessionDraft.startTime && sessionDraft.endTime && sessionDraft.endTime <= sessionDraft.startTime) {
    sessionError.value = 'L\u2019heure de fin doit être après l\u2019heure de début.'
    return
  }
  sessions.value.push({ ...sessionDraft, name: sessionDraft.name.trim() })
  sessionDraft.name = ''
  sessionDraft.startTime = ''
  sessionDraft.endTime = ''
}

/* ---------- Création ---------- */
async function submitCreate() {
  if (!validateInfos()) return
  loading.value = true
  error.value = ''
  try {
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
    }
    if (form.type === 'WEDDING') {
      payload.groomFirstName = form.groomFirstName
      payload.groomLastName = form.groomLastName
      payload.brideFirstName = form.brideFirstName
      payload.brideLastName = form.brideLastName
    }
    if (auth.isSuperAdmin && auth.user?.organizationId) {
      payload.organizationId = auth.user.organizationId
    }
    const created = await createEvent(payload)

    // Visuels (non bloquant)
    if (coverFile.value) {
      try { await uploadEventImage(created.id, coverFile.value) } catch { /* ignore */ }
    }
    if (form.type === 'WEDDING') {
      for (const p of photoFields) {
        const file = photoState[p.kind].file
        if (file) { try { await uploadEventPhoto(created.id, p.kind, file) } catch { /* ignore */ } }
      }
    }
    // Programme (non bloquant) — date héritée de l'événement, ordre d'affichage
    for (let i = 0; i < sessions.value.length; i++) {
      const s = sessions.value[i]
      try {
        await createWeddingEvent(created.id, {
          name: s.name,
          type: s.type,
          eventDate: form.eventDate || null,
          startTime: s.startTime || null,
          endTime: s.endTime || null,
          displayOrder: i + 1,
        })
      } catch { /* ignore : le programme n'est pas bloquant */ }
    }

    notifications.push('Événement créé 🎉 Prochaine étape : ajoutez vos invités.', 'success')
    router.push(`/dashboard/events/${created.id}`)
  } catch (e: any) {
    error.value = e?.response?.data?.error || e?.response?.data?.message || 'Création impossible'
  } finally {
    loading.value = false
  }
}

const auth = useAuthStore()
const router = useRouter()
const notifications = useNotificationStore()

/* ---------- Étapes ---------- */
const steps = [
  { n: 1, label: 'Informations', icon: 'edit' },
  { n: 2, label: 'Visuels', icon: 'image' },
  { n: 3, label: 'Programme', icon: 'event_note' },
  { n: 4, label: 'Publication', icon: 'rocket_launch' },
]
const step = ref(1)
const error = ref('')
const loading = ref(false)

function goTo(n: number) {
  if (n < step.value) step.value = n
}
function back() {
  error.value = ''
  step.value--
}
function next() {
  error.value = ''
  if (step.value === 1 && !validateInfos()) return
  step.value++
}

/* ---------- Formulaire (identique à WeddingForm) ---------- */
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
  groomFirstName: '',
  groomLastName: '',
  brideFirstName: '',
  brideLastName: '',
})

const TYPE_LABELS: Record<string, string> = {
  WEDDING: 'Mariage', COLLATION: 'Collation', ANNIVERSARY: 'Anniversaire',
  BAPTISM: 'Baptême', GRADUATION: 'Graduation', OTHER: 'Autre',
}
const typeLabel = computed(() => TYPE_LABELS[form.type] ?? form.type)

function validateInfos(): boolean {
  if (!form.name.trim()) {
    error.value = 'Le nom de l\u2019événement est requis.'
    return false
  }
  if (form.type === 'WEDDING' && (!form.groomFirstName.trim() || !form.groomLastName.trim() || !form.brideFirstName.trim() || !form.brideLastName.trim())) {
    error.value = 'Les prénoms et noms des mariés sont requis pour un mariage.'
    return false
  }
  return true
}
</script>

<style scoped>
.input { @apply block w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-slate-400; }
</style>
