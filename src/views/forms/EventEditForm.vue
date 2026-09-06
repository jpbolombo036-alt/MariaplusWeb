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

          <div class="flex justify-end gap-3 pt-2">
            <button type="button" @click="$router.back()" class="px-4 h-10 text-slate-500 text-[13px] font-medium hover:text-slate-700 transition-colors">Annuler</button>
            <button type="submit" :disabled="saving" class="px-5 h-10 rounded-lg bg-primary text-white text-[13px] font-bold shadow-sm shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-50">{{ saving ? 'Enregistrement…' : 'Enregistrer' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getEvent, updateEvent } from '../../api/events'

const route = useRoute()
const id = Number(route.params.id)
const loading = ref(true)
const saving = ref(false)

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
  } finally {
    loading.value = false
  }
})

async function submit() {
  saving.value = true
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
    await updateEvent(id, payload)
    window.history.length > 1 ? window.history.back() : window.location.href = `/dashboard/events/${id}`
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.input { @apply block w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-slate-400; }
</style>
