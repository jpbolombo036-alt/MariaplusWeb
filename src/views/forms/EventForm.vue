<template>
  <div class="min-h-full">
    <div class="max-w-3xl mx-auto">
      <div class="flex items-center gap-3 mb-6">
        <button @click="$router.back()" class="h-10 w-10 rounded-lg border border-slate-200 bg-white text-slate-600 inline-flex items-center justify-center hover:bg-slate-50 transition-colors">
          <span class="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <div>
          <h1 class="text-[22px] font-bold text-slate-900 tracking-tight">Nouvel événement</h1>
          <p class="text-[13px] text-slate-500 mt-0.5 font-medium">Ajoutez un événement interne.</p>
        </div>
      </div>

      <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <form @submit.prevent="submitCreate" class="space-y-5">
          <label class="block">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Nom *</span>
            <input v-model="form.name" required placeholder="Ex : Cérémonie religieuse" class="input" />
          </label>

          <label class="block">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Type</span>
            <select v-model="form.type" class="input">
              <option v-for="t in types" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>
          </label>

          <label class="block">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Date</span>
            <input v-model="form.eventDate" type="date" class="input" />
          </label>

          <div class="grid grid-cols-2 gap-4">
            <label class="block">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Début</span>
              <input v-model="form.startTime" type="time" class="input" />
            </label>
            <label class="block">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Fin</span>
              <input v-model="form.endTime" type="time" class="input" />
            </label>
          </div>

          <label class="block">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Lieu</span>
            <input v-model="form.venueName" placeholder="Ex : Église Saint-Roch" class="input" />
          </label>
          <input v-model="form.city" placeholder="Ville" class="input mb-4" />

          <label class="block">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Description</span>
            <textarea v-model="form.description" rows="2" placeholder="Détails (optionnel)" class="input resize-none"></textarea>
          </label>

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
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { createWeddingEvent, type WeddingEventItem } from '../../api/weddingEvents'

const route = useRoute()
const id = Number(route.params.id)
const form = reactive({
  name: '',
  type: 'OTHER',
  eventDate: '',
  startTime: '',
  endTime: '',
  venueName: '',
  city: '',
  description: '',
})

const types = [
  { value: 'CIVIL_CEREMONY', label: 'Cérémonie civile' },
  { value: 'RELIGIOUS_CEREMONY', label: 'Cérémonie religieuse' },
  { value: 'RECEPTION', label: 'Réception' },
  { value: 'AFTER_PARTY', label: 'After party' },
  { value: 'OTHER', label: 'Autre' },
]

async function submitCreate() {
  await createWeddingEvent(id, form)
  window.history.length > 1 ? window.history.back() : window.location.href = `/dashboard/events/${id}/internal-events`
}
</script>

<style scoped>
.input { @apply block w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-slate-400; }
</style>
