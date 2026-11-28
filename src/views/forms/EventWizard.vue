<template>
  <div ref="wizardTop" class="min-h-full pb-10 scroll-mt-20">
    <div class="max-w-3xl mx-auto">
      <!-- En-tête -->
      <div class="flex items-start gap-3">
        <button type="button" class="h-10 w-10 shrink-0 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface-variant grid place-items-center hover:text-primary hover:border-primary/40 transition-colors" aria-label="Retour" @click="$router.back()">
          <span class="material-symbols-outlined text-[20px]" aria-hidden="true">arrow_back</span>
        </button>
        <div class="min-w-0">
          <h1 class="text-[24px] font-extrabold tracking-tight text-on-surface">Nouvel événement</h1>
          <p class="text-[14px] text-on-surface-variant mt-0.5">Quelques minutes suffisent ; tout reste modifiable ensuite.</p>
        </div>
      </div>

      <!-- Progression -->
      <nav class="mt-6" aria-label="Étapes de création">
        <div class="flex items-center justify-between text-[13px]">
          <span class="font-semibold text-primary">Étape {{ step }} sur {{ steps.length }} · {{ current.label }}</span>
          <span class="text-on-surface-variant">{{ Math.round((step / steps.length) * 100) }} %</span>
        </div>
        <ol class="mt-2.5 grid gap-1.5" :style="{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }">
          <li v-for="s in steps" :key="s.n">
            <button
              type="button"
              class="w-full text-left group"
              :disabled="s.n >= step"
              :aria-current="s.n === step ? 'step' : undefined"
              :aria-label="`Étape ${s.n} : ${s.label}`"
              @click="goTo(s.n)"
            >
              <span class="block h-1.5 rounded-full transition-colors" :class="s.n <= step ? 'bg-primary' : 'bg-surface-container-high'"></span>
              <span class="hidden sm:flex items-center gap-1.5 mt-2 text-[12.5px] font-medium transition-colors"
                :class="s.n === step ? 'text-on-surface' : s.n < step ? 'text-primary group-hover:underline' : 'text-on-surface-variant'">
                <span class="material-symbols-outlined text-[16px]" aria-hidden="true">{{ s.n < step ? 'check_circle' : s.icon }}</span>
                {{ s.label }}
              </span>
            </button>
          </li>
        </ol>
      </nav>

      <div class="mt-6 rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm">
        <div class="px-5 sm:px-8 pt-6 sm:pt-7">
          <h2 class="text-[19px] font-bold text-on-surface">{{ current.title }}</h2>
          <p class="mt-1 text-[14px] text-on-surface-variant">{{ current.hint }}</p>
        </div>

        <div class="px-5 sm:px-8 py-6">
          <!-- ============ ÉTAPE 1 : L'ESSENTIEL ============ -->
          <div v-if="step === 1" class="space-y-7">
            <fieldset>
              <legend class="field-label">Type d'événement</legend>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <label v-for="t in typeOptions" :key="t.value"
                  class="cursor-pointer rounded-xl border px-3.5 py-3 flex items-center gap-2.5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/40"
                  :class="form.type === t.value ? 'border-primary bg-primary-light text-primary' : 'border-outline-variant text-on-surface hover:border-primary/40'">
                  <input v-model="form.type" type="radio" name="event-type" :value="t.value" class="sr-only" />
                  <span class="material-symbols-outlined text-[20px]" aria-hidden="true">{{ t.icon }}</span>
                  <span class="text-[14px] font-semibold">{{ t.label }}</span>
                </label>
              </div>
            </fieldset>

            <div v-if="form.type === 'WEDDING'" class="grid sm:grid-cols-2 gap-4">
              <div class="rounded-xl border border-outline-variant bg-surface-container-low p-4">
                <p class="text-[14px] font-semibold text-on-surface mb-3">Le marié</p>
                <div class="grid grid-cols-2 gap-3">
                  <label class="block"><span class="field-label">Prénom</span><input v-model="form.groomFirstName" autocomplete="off" placeholder="Jean" class="input" /></label>
                  <label class="block"><span class="field-label">Nom</span><input v-model="form.groomLastName" autocomplete="off" placeholder="Kabongo" class="input" /></label>
                </div>
              </div>
              <div class="rounded-xl border border-outline-variant bg-surface-container-low p-4">
                <p class="text-[14px] font-semibold text-on-surface mb-3">La mariée</p>
                <div class="grid grid-cols-2 gap-3">
                  <label class="block"><span class="field-label">Prénom</span><input v-model="form.brideFirstName" autocomplete="off" placeholder="Marie" class="input" /></label>
                  <label class="block"><span class="field-label">Nom</span><input v-model="form.brideLastName" autocomplete="off" placeholder="Mukendi" class="input" /></label>
                </div>
              </div>
            </div>

            <label class="block">
              <span class="field-label">Nom de l'événement</span>
              <input v-model="form.name" placeholder="Mariage de Jean et Marie" class="input" @input="nameTouched = true" />
              <span v-if="form.type === 'WEDDING' && !nameTouched" class="mt-1.5 block text-[12.5px] text-on-surface-variant">Rempli à partir des prénoms ; vous pouvez le changer.</span>
            </label>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <label class="block col-span-2 sm:col-span-1"><span class="field-label">Date</span><input v-model="form.eventDate" type="date" class="input" /></label>
              <label class="block"><span class="field-label">Début</span><input v-model="form.startTime" type="time" class="input" /></label>
              <label class="block"><span class="field-label">Fin</span><input v-model="form.endTime" type="time" class="input" /></label>
            </div>
          </div>

          <!-- ============ ÉTAPE 2 : LIEU ET DÉTAILS ============ -->
          <div v-else-if="step === 2" class="space-y-8">
            <section class="space-y-4">
              <h3 class="section-title"><span class="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">location_on</span>Lieu</h3>
              <div class="grid sm:grid-cols-2 gap-4">
                <label class="block"><span class="field-label">Nom du lieu</span><input v-model="form.venueName" placeholder="Salle Exodus, église Saint-Roch…" class="input" /></label>
                <label class="block"><span class="field-label">Ville</span><input v-model="form.city" placeholder="Kinshasa" class="input" /></label>
                <label class="block sm:col-span-2"><span class="field-label">Adresse</span><input v-model="form.venueAddress" placeholder="Avenue, numéro, point de repère" class="input" /></label>
                <label class="block"><span class="field-label">Commune</span><input v-model="form.commune" placeholder="Gombe" class="input" /></label>
                <label class="block"><span class="field-label">Pays</span><input v-model="form.country" placeholder="RD Congo" class="input" /></label>
                <label class="block sm:col-span-2">
                  <span class="field-label">Lien Google Maps</span>
                  <input v-model="form.mapUrl" type="url" placeholder="Collez le lien de partage Google Maps" class="input" />
                  <span class="mt-1.5 block text-[12.5px] text-on-surface-variant">Vos invités pourront ouvrir l'itinéraire depuis leur invitation.</span>
                </label>
              </div>
              <details class="group rounded-xl border border-outline-variant" :open="!!(form.latitude || form.longitude)">
                <summary class="cursor-pointer list-none px-4 py-3 flex items-center justify-between text-[13.5px] font-medium text-on-surface-variant hover:text-on-surface">
                  Coordonnées GPS (avancé)
                  <span class="material-symbols-outlined text-[20px] transition-transform group-open:rotate-180" aria-hidden="true">expand_more</span>
                </summary>
                <div class="px-4 pb-4 grid grid-cols-2 gap-4">
                  <label class="block"><span class="field-label">Latitude</span><input v-model="form.latitude" inputmode="decimal" placeholder="-4.3250" class="input" /></label>
                  <label class="block"><span class="field-label">Longitude</span><input v-model="form.longitude" inputmode="decimal" placeholder="15.3222" class="input" /></label>
                </div>
              </details>
            </section>

            <section class="space-y-4 border-t border-outline-variant pt-7">
              <h3 class="section-title"><span class="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">chat_bubble</span>Message aux invités</h3>
              <label class="block">
                <span class="field-label">Message d'invitation</span>
                <textarea v-model="form.message" rows="3" placeholder="Nous avons l'immense joie de vous inviter…" class="input resize-y"></textarea>
              </label>
              <label class="block">
                <span class="field-label">Description</span>
                <textarea v-model="form.description" rows="2" placeholder="Quelques mots sur l'événement" class="input resize-y"></textarea>
              </label>
            </section>

            <section class="space-y-4 border-t border-outline-variant pt-7">
              <h3 class="section-title"><span class="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">checkroom</span>Tenue demandée</h3>
              <DressCodeField v-model="form.dressColors" @pending-file="dressFile = $event" />
            </section>
          </div>

          <!-- ============ ÉTAPE 3 : VISUELS ============ -->
          <div v-else-if="step === 3" class="space-y-8">
            <InvitationTemplatePicker v-model="form.invitationCardTemplate" :preview="cardPreviewData(form)" :photo-url="photoState.couple.preview || coverPreview" :disabled="loading" />

            <section class="border-t border-outline-variant pt-7">
              <h3 class="section-title">Photo de couverture</h3>
              <p class="mt-1 text-[13px] text-on-surface-variant">Format paysage 16:9 : bannière, invitation et aperçu WhatsApp.</p>
              <div class="mt-4 flex flex-wrap items-center gap-4">
                <button type="button" class="w-40 aspect-video rounded-xl overflow-hidden border border-dashed border-outline grid place-items-center bg-surface-container-low hover:border-primary transition-colors" aria-label="Choisir la photo de couverture" @click="coverInput?.click()">
                  <img v-if="coverPreview" :src="coverPreview" alt="" class="w-full h-full object-cover" />
                  <span v-else class="material-symbols-outlined text-[28px] text-on-surface-variant" aria-hidden="true">add_photo_alternate</span>
                </button>
                <div class="flex flex-wrap gap-2">
                  <button type="button" class="btn-soft" @click="coverInput?.click()">{{ coverFile ? 'Remplacer' : 'Choisir une photo' }}</button>
                  <button v-if="coverFile" type="button" class="btn-ghost-danger" @click="clearCover">Retirer</button>
                </div>
              </div>
              <input ref="coverInput" type="file" accept="image/jpeg,image/png,image/gif,image/webp" class="hidden" @change="onCoverPick" />
            </section>

            <section v-if="form.type === 'WEDDING'" class="border-t border-outline-variant pt-7">
              <h3 class="section-title">Photos des mariés</h3>
              <p class="mt-1 text-[13px] text-on-surface-variant">Format carré ; le recadrage s'ouvre après le choix.</p>
              <div class="mt-4 grid grid-cols-3 gap-3 sm:gap-5 max-w-lg">
                <div v-for="ph in photoFields" :key="ph.kind" class="min-w-0">
                  <button type="button" class="w-full aspect-square rounded-xl overflow-hidden border border-dashed border-outline grid place-items-center bg-surface-container-low hover:border-primary transition-colors" :aria-label="`Choisir : ${ph.label}`" @click="pickPhoto(ph.kind)">
                    <img v-if="photoState[ph.kind].preview" :src="photoState[ph.kind].preview!" alt="" class="w-full h-full object-cover" />
                    <span v-else class="material-symbols-outlined text-[26px] text-on-surface-variant" aria-hidden="true">add_a_photo</span>
                  </button>
                  <p class="mt-2 text-[12.5px] font-medium text-on-surface truncate">{{ ph.label }}</p>
                  <button v-if="photoState[ph.kind].file" type="button" class="text-[12px] text-error hover:underline" @click="clearPhoto(ph.kind)">Retirer</button>
                  <input :id="`wizard-photo-input-${ph.kind}`" type="file" accept="image/jpeg,image/png,image/gif,image/webp" class="hidden" @change="onPick(ph.kind, $event)" />
                </div>
              </div>
            </section>

            <p v-if="photoError" role="alert" class="text-error text-[13px] inline-flex items-center gap-1">
              <span class="material-symbols-outlined text-[16px]" aria-hidden="true">error</span>{{ photoError }}
            </p>
          </div>

          <!-- ============ ÉTAPE 4 : PROGRAMME ============ -->
          <div v-else-if="step === 4" class="space-y-5">
            <ol v-if="sessions.length" class="space-y-2">
              <li v-for="(sess, i) in sessions" :key="i" class="flex items-center gap-3 rounded-xl border border-outline-variant px-3.5 py-3">
                <span class="w-8 h-8 rounded-full bg-primary text-white text-[13px] font-bold grid place-items-center shrink-0">{{ i + 1 }}</span>
                <div class="min-w-0 flex-1">
                  <p class="text-[14px] font-semibold text-on-surface truncate">{{ sess.name }}</p>
                  <p class="text-[12.5px] text-on-surface-variant">{{ sessionTypeLabel(sess.type) }}<template v-if="sess.startTime"> · {{ sess.startTime }}</template><template v-if="sess.endTime"> – {{ sess.endTime }}</template></p>
                </div>
                <button type="button" class="btn-ghost-danger" @click="sessions.splice(i, 1)">Retirer</button>
              </li>
            </ol>
            <p v-else class="rounded-xl border border-dashed border-outline-variant px-4 py-6 text-center text-[13.5px] text-on-surface-variant">
              Aucune étape pour le moment. Exemple : cérémonie civile à 10 h, réception à 18 h.
            </p>

            <div class="rounded-xl border border-outline-variant bg-surface-container-low p-4 space-y-3">
              <p class="text-[14px] font-semibold text-on-surface">Ajouter une étape</p>
              <div class="grid sm:grid-cols-2 gap-3">
                <label class="block"><span class="field-label">Nom</span><input v-model="sessionDraft.name" placeholder="Cérémonie religieuse" class="input" @keydown.enter.prevent="addSession" /></label>
                <label class="block"><span class="field-label">Type</span>
                  <select v-model="sessionDraft.type" class="input">
                    <option v-for="t in sessionTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
                  </select>
                </label>
                <label class="block"><span class="field-label">Début</span><input v-model="sessionDraft.startTime" type="time" class="input" /></label>
                <label class="block"><span class="field-label">Fin</span><input v-model="sessionDraft.endTime" type="time" class="input" /></label>
              </div>
              <p v-if="sessionError" role="alert" class="text-error text-[12.5px]">{{ sessionError }}</p>
              <button type="button" class="btn-soft w-full justify-center" @click="addSession">
                <span class="material-symbols-outlined text-[18px]" aria-hidden="true">add</span> Ajouter au programme
              </button>
            </div>
          </div>

          <!-- ============ ÉTAPE 5 : VÉRIFICATION ============ -->
          <div v-else class="space-y-5">
            <div class="rounded-xl border border-outline-variant divide-y divide-outline-variant">
              <div v-for="row in summary" :key="row.label" class="px-4 py-3.5 flex items-start gap-4">
                <span class="material-symbols-outlined text-[20px] text-primary mt-0.5" aria-hidden="true">{{ row.icon }}</span>
                <div class="min-w-0 flex-1">
                  <p class="text-[12.5px] text-on-surface-variant">{{ row.label }}</p>
                  <p class="text-[14.5px] font-medium text-on-surface break-words" :class="{ 'text-on-surface-variant font-normal': !row.value }">{{ row.value || 'Non renseigné' }}</p>
                </div>
                <button type="button" class="text-[13px] font-semibold text-primary hover:underline shrink-0" @click="goTo(row.step)">Modifier</button>
              </div>
            </div>
            <p class="flex items-start gap-2 rounded-xl bg-primary-light px-4 py-3 text-[13.5px] text-on-surface">
              <span class="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">info</span>
              Ensuite, depuis le tableau de bord de l'événement : invités, invitations WhatsApp, tables et boissons.
            </p>
          </div>

          <p v-if="error" role="alert" class="mt-5 flex items-start gap-2 rounded-xl bg-error-light border border-error/20 px-4 py-3 text-[13.5px] text-error">
            <span class="material-symbols-outlined text-[18px]" aria-hidden="true">error</span>{{ error }}
          </p>
        </div>

        <!-- Navigation -->
        <div class="px-5 sm:px-8 py-4 border-t border-outline-variant flex items-center justify-between gap-3">
          <button type="button" class="h-11 px-4 rounded-xl text-on-surface-variant text-[14px] font-semibold inline-flex items-center gap-1.5 hover:bg-surface-container transition-colors" @click="step === 1 ? $router.back() : back()">
            <span class="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_back</span>
            {{ step === 1 ? 'Annuler' : 'Retour' }}
          </button>
          <button v-if="step < steps.length" type="button" class="btn-primary" @click="next">
            Continuer <span class="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
          </button>
          <button v-else type="button" :disabled="loading" class="btn-primary" @click="submitCreate">
            <span v-if="loading" class="material-symbols-outlined text-[18px] animate-spin" aria-hidden="true">progress_activity</span>
            <span v-else class="material-symbols-outlined text-[18px]" aria-hidden="true">check</span>
            Créer l'événement
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
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { createEvent, uploadEventDressImage, uploadEventPhoto, uploadEventImage, type EventPhotoKind } from '../../api/events'
import InvitationTemplatePicker from '../../components/events/InvitationTemplatePicker.vue'
import { cardPreviewData, type InvitationCardTemplate } from '../../models/invitationCard'
import DressCodeField from '../../components/events/DressCodeField.vue'
import { createWeddingEvent } from '../../api/weddingEvents'
import ImageCropModal from '../../components/common/ImageCropModal.vue'
import { useAuthStore } from '../../stores/auth'
import { useNotificationStore } from '../../stores/notifications'
import { eventSetupWarning, runEventSetup, type EventSetupTask } from '../../utils/eventSetup'
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
  if (loading.value) return
  if (!validateInfos()) return
  loading.value = true
  error.value = ''
  try {
    const payload: Record<string, unknown> = {
      invitationCardTemplate: form.invitationCardTemplate,
      name: form.name,
      type: form.type,
      description: form.description || null,
      message: form.message || null,
      dressColors: form.dressColors,
      eventDate: form.eventDate || null,
      startTime: form.startTime || null,
      endTime: form.endTime || null,
      venueName: form.venueName || null,
      venueAddress: form.venueAddress || null,
      city: form.city || null,
      commune: form.commune || null,
      country: form.country || null,
      latitude: parseCoordinate(form.latitude),
      longitude: parseCoordinate(form.longitude),
      mapUrl: form.mapUrl.trim() || null,
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
    if (created.invitationCardTemplate !== form.invitationCardTemplate) {
      notifications.push('L’événement est créé, mais le modèle choisi n’a pas été enregistré. Vous pouvez le modifier dans les réglages de l’événement.', 'info', 12000)
    }

    const tasks: EventSetupTask[] = []
    const cover = coverFile.value
    const dress = dressFile.value
    if (cover) tasks.push({ label: 'photo de couverture', run: () => uploadEventImage(created.id, cover) })
    if (dress) tasks.push({ label: 'image de la tenue', run: () => uploadEventDressImage(created.id, dress) })
    if (form.type === 'WEDDING') {
      for (const p of photoFields) {
        const file = photoState[p.kind].file
        if (file) tasks.push({ label: p.label, run: () => uploadEventPhoto(created.id, p.kind, file) })
      }
    }
    // Programme (non bloquant) — date héritée de l'événement, ordre d'affichage
    for (let i = 0; i < sessions.value.length; i++) {
      const s = sessions.value[i]
      tasks.push({
        label: `étape du programme « ${s.name} »`,
        run: () => createWeddingEvent(created.id, {
          name: s.name,
          type: s.type,
          eventDate: form.eventDate || null,
          startTime: s.startTime || null,
          endTime: s.endTime || null,
          displayOrder: i + 1,
        }),
      })
    }

    const failures = await runEventSetup(tasks)
    if (failures.length) {
      notifications.push(eventSetupWarning(failures), 'info', 12000)
    } else {
      notifications.push('Événement créé 🎉 Prochaine étape : ajoutez vos invités.', 'success')
    }
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
  { n: 1, label: 'L’essentiel', icon: 'edit', title: 'L’essentiel', hint: 'Le type d’événement, qui on célèbre et quand.' },
  { n: 2, label: 'Lieu et détails', icon: 'location_on', title: 'Lieu et détails', hint: 'Où se passe l’événement et ce que vos invités doivent savoir. Tout est facultatif.' },
  { n: 3, label: 'Visuels', icon: 'image', title: 'Visuels', hint: 'Le modèle de carte et les photos. Facultatif : vous pourrez les ajouter plus tard.' },
  { n: 4, label: 'Programme', icon: 'event_note', title: 'Programme de la journée', hint: 'Le déroulé s’affiche sur l’invitation de vos invités. Facultatif.' },
  { n: 5, label: 'Vérification', icon: 'task_alt', title: 'Vérification', hint: 'Relisez avant de créer l’événement.' },
]
const step = ref(1)
const current = computed(() => steps[step.value - 1])
const error = ref('')
const loading = ref(false)

function goTo(n: number) {
  if (n < step.value) {
    error.value = ''
    step.value = n
    toTop()
  }
}
function back() {
  error.value = ''
  step.value--
  toTop()
}
function next() {
  error.value = ''
  if (step.value === 1 && !validateInfos()) return
  step.value++
  toTop()
}
const wizardTop = ref<HTMLElement | null>(null)
function toTop() {
  wizardTop.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/* ---------- Formulaire (identique à WeddingForm) ---------- */
const form = reactive({
  invitationCardTemplate: 'STANDARD' as InvitationCardTemplate,
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
  dressColors: [] as string[],
})

function parseCoordinate(value: string): number | null {
  const normalized = value.trim().replace(',', '.')
  if (!normalized) return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}
/** Photo du pagne choisie avant la création : uploadée juste après (l'ID n'existe pas encore). */
const dressFile = ref<File | null>(null)

const TYPE_LABELS: Record<string, string> = {
  WEDDING: 'Mariage', COLLATION: 'Collation', ANNIVERSARY: 'Anniversaire',
  BAPTISM: 'Baptême', GRADUATION: 'Graduation', OTHER: 'Autre',
}
const typeLabel = computed(() => TYPE_LABELS[form.type] ?? form.type)
const typeOptions = [
  { value: 'WEDDING', label: 'Mariage', icon: 'favorite' },
  { value: 'COLLATION', label: 'Collation', icon: 'local_bar' },
  { value: 'ANNIVERSARY', label: 'Anniversaire', icon: 'cake' },
  { value: 'BAPTISM', label: 'Baptême', icon: 'child_care' },
  { value: 'GRADUATION', label: 'Graduation', icon: 'school' },
  { value: 'OTHER', label: 'Autre', icon: 'celebration' },
]

/* Nom proposé à partir des prénoms, tant que l'utilisateur ne l'a pas saisi lui-même. */
const nameTouched = ref(false)
watch(
  () => [form.type, form.groomFirstName, form.brideFirstName],
  () => {
    if (nameTouched.value || form.type !== 'WEDDING') return
    const groom = form.groomFirstName.trim()
    const bride = form.brideFirstName.trim()
    if (groom && bride) form.name = `Mariage de ${groom} et ${bride}`
  },
)

const summary = computed(() => {
  const place = [form.venueName, form.commune, form.city, form.country].filter(Boolean).join(', ')
  const when = form.eventDate
    ? new Date(`${form.eventDate}T00:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      + (form.startTime ? ` · ${form.startTime.replace(':', ' h ')}` : '')
      + (form.endTime ? ` – ${form.endTime.replace(':', ' h ')}` : '')
    : ''
  const rows = [
    { icon: 'badge', label: 'Événement', value: `${form.name} · ${typeLabel.value}`, step: 1 },
  ]
  if (form.type === 'WEDDING') {
    rows.push({ icon: 'favorite', label: 'Les mariés', value: `${form.groomFirstName} ${form.groomLastName} et ${form.brideFirstName} ${form.brideLastName}`, step: 1 })
  }
  rows.push(
    { icon: 'calendar_month', label: 'Date', value: when, step: 1 },
    { icon: 'location_on', label: 'Lieu', value: place, step: 2 },
    { icon: 'image', label: 'Visuels', value: visualsCount.value ? `${visualsCount.value} photo${visualsCount.value > 1 ? 's' : ''}` : '', step: 3 },
    { icon: 'event_note', label: 'Programme', value: sessions.value.length ? `${sessions.value.length} étape${sessions.value.length > 1 ? 's' : ''}` : '', step: 4 },
  )
  return rows
})

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
.input { @apply block w-full h-11 px-3.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-[14.5px] outline-none transition-all placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-4 focus:ring-primary/15; }
textarea.input { @apply h-auto py-2.5; }
.field-label { @apply block text-[13px] font-medium text-on-surface mb-1.5; }
.section-title { @apply flex items-center gap-2 text-[15px] font-bold text-on-surface; }
.btn-primary { @apply h-11 px-6 rounded-xl bg-primary text-white text-[14px] font-semibold inline-flex items-center gap-2 shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all disabled:opacity-60; }
.btn-soft { @apply h-10 px-4 rounded-xl bg-primary-light text-primary text-[13.5px] font-semibold inline-flex items-center gap-1.5 hover:bg-primary/20 transition-colors; }
.btn-ghost-danger { @apply h-9 px-3 rounded-lg text-[13px] font-medium text-error hover:bg-error/10 transition-colors; }
</style>
