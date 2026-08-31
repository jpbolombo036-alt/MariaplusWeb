<template>
  <div class="min-h-full">
    <div class="max-w-3xl mx-auto">
      <div class="flex items-center gap-3 mb-6">
        <button @click="$router.back()" class="h-10 w-10 rounded-lg border border-slate-200 bg-white text-slate-600 inline-flex items-center justify-center hover:bg-slate-50 transition-colors">
          <span class="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <div>
          <h1 class="text-[22px] font-bold text-slate-900 tracking-tight">Nouvel invité</h1>
          <p class="text-[13px] text-slate-500 mt-0.5 font-medium">Ajoutez un invité à votre événement.</p>
        </div>
      </div>

      <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <form @submit.prevent="submitCreate" class="space-y-5">
          <div class="grid grid-cols-2 gap-4">
            <label class="block">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Prénom *</span>
              <input v-model="form.firstName" required type="text" placeholder="Prénom" class="input" />
            </label>
            <label class="block">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Nom *</span>
              <input v-model="form.lastName" required type="text" placeholder="Nom" class="input" />
            </label>
          </div>

          <label class="block">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Email</span>
            <input v-model="form.email" type="email" placeholder="email@exemple.com" class="input" />
          </label>

          <label class="block">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Téléphone</span>
            <input v-model="form.phone" placeholder="+33 …" class="input" />
          </label>

          <div class="grid grid-cols-2 gap-4">
            <label class="block">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Catégorie</span>
              <select v-model="form.categoryId" class="input">
                <option :value="null">Aucune</option>
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </label>
            <label class="block">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Accompagnants</span>
              <input v-model.number="form.allowedCompanions" type="number" min="0" placeholder="0" class="input" />
            </label>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button type="button" @click="$router.back()" class="px-4 h-10 text-slate-500 text-[13px] font-medium hover:text-slate-700 transition-colors">Annuler</button>
            <button type="submit" class="px-5 h-10 rounded-lg bg-primary text-white text-[13px] font-bold shadow-sm shadow-primary/20 hover:bg-primary-dark transition-all">Ajouter</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { createGuest, listCategories, type GuestCategory } from '../../api/guests'

const route = useRoute()
const id = Number(route.params.id)
const categories = ref<GuestCategory[]>([])
const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  categoryId: null as number | null,
  allowedCompanions: 0,
})

onMounted(async () => {
  categories.value = await listCategories(id)
})

async function submitCreate() {
  await createGuest(id, {
    firstName: form.firstName,
    lastName: form.lastName,
    email: form.email || null,
    phone: form.phone || null,
    categoryId: form.categoryId,
    allowedCompanions: form.allowedCompanions,
  })
  window.history.length > 1 ? window.history.back() : window.location.href = `/dashboard/events/${id}/guests`
}
</script>

<style scoped>
.input { @apply block w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-slate-400; }
</style>
