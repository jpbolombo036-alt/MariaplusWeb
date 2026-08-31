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
            <label class="block">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Photo du marié (URL)</span>
              <input v-model="form.groomPhotoUrl" placeholder="https://..." class="input" />
            </label>
            <label class="block">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Photo de la mariée (URL)</span>
              <input v-model="form.bridePhotoUrl" placeholder="https://..." class="input" />
            </label>
            <label class="block">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Photo du couple (URL)</span>
              <input v-model="form.couplePhotoUrl" placeholder="https://..." class="input" />
            </label>
          </div>

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
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { createEvent } from '../../api/events'

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
  groomPhotoUrl: '',
  bridePhotoUrl: '',
  couplePhotoUrl: '',
  welcomeMessage: '',
})

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
    payload.groomPhotoUrl = form.groomPhotoUrl || null
    payload.bridePhotoUrl = form.bridePhotoUrl || null
    payload.couplePhotoUrl = form.couplePhotoUrl || null
    payload.welcomeMessage = form.welcomeMessage || null
  }
  const created = await createEvent(payload)
  router.push(`/dashboard/events/${created.id}`)
}
</script>

<style scoped>
.input { @apply block w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-slate-400; }
</style>
