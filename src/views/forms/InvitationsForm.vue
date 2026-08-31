<template>
  <div class="min-h-full">
    <div class="max-w-3xl mx-auto">
      <div class="flex items-center gap-3 mb-6">
        <button @click="$router.back()" class="h-10 w-10 rounded-lg border border-slate-200 bg-white text-slate-600 inline-flex items-center justify-center hover:bg-slate-50 transition-colors">
          <span class="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <div>
          <h1 class="text-[22px] font-bold text-slate-900 tracking-tight">Nouvelle invitation</h1>
          <p class="text-[13px] text-slate-500 mt-0.5 font-medium">Sélectionnez un invité pour créer une invitation.</p>
        </div>
      </div>

      <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <form @submit.prevent="submitCreate" class="space-y-5">
          <label class="block">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Invité *</span>
            <select v-model="selectedGuestId" required class="input">
              <option :value="null" disabled>Sélectionner un invité</option>
              <option v-for="g in guests" :key="g.id" :value="g.id">{{ g.firstName }} {{ g.lastName }}</option>
            </select>
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
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { createInvitation } from '../../api/invitations'
import { listGuests, type Guest } from '../../api/guests'

const route = useRoute()
const id = Number(route.params.id)
const guests = ref<Guest[]>([])
const selectedGuestId = ref<number | null>(null)

onMounted(async () => {
  guests.value = await listGuests(id)
})

async function submitCreate() {
  if (!selectedGuestId.value) return
  await createInvitation(id, selectedGuestId.value)
  window.history.length > 1 ? window.history.back() : window.location.href = `/dashboard/events/${id}/invitations`
}
</script>

<style scoped>
.input { @apply block w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-slate-400; }
</style>
