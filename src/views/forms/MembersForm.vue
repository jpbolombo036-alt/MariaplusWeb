<template>
  <div class="min-h-full">
    <div class="max-w-3xl mx-auto">
      <div class="flex items-center gap-3 mb-6">
        <button @click="$router.back()" class="h-10 w-10 rounded-lg border border-slate-200 bg-white text-slate-600 inline-flex items-center justify-center hover:bg-slate-50 transition-colors">
          <span class="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <div>
          <h1 class="text-[22px] font-bold text-slate-900 tracking-tight">Nouveau membre</h1>
          <p class="text-[13px] text-slate-500 mt-0.5 font-medium">Ajoutez un membre à votre organisation.</p>
        </div>
      </div>

      <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <form @submit.prevent="submitCreate" class="space-y-5">
          <div class="grid grid-cols-2 gap-4">
            <label class="block">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Prénom *</span>
              <input v-model.trim="form.firstName" required type="text" placeholder="Prénom" class="input" />
            </label>
            <label class="block">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Nom *</span>
              <input v-model.trim="form.lastName" required type="text" placeholder="Nom" class="input" />
            </label>
          </div>

          <label class="block">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Email *</span>
            <input v-model.trim="form.email" required type="email" placeholder="email@exemple.com" class="input" />
          </label>

          <div class="grid grid-cols-2 gap-4">
            <label class="block">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Téléphone</span>
              <input v-model.trim="form.phone" type="tel" placeholder="+33 6 …" class="input" />
            </label>
            <label class="block">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Mot de passe *</span>
              <input v-model="form.password" required type="password" placeholder="••••••••" minlength="8" class="input" />
            </label>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <label class="block">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Rôle *</span>
              <select v-model="form.roleCode" required class="input">
                <option value="GESTIONNAIRE_INVITES">Gestionnaire d'invités</option>
                <option value="AGENT_ACCUEIL">Agent d'accueil</option>
              </select>
            </label>
            <label class="block">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Événement affecté *</span>
              <select v-model.number="form.eventId" required class="input">
                <option v-for="w in weddings" :key="w.id" :value="w.id">{{ w.weddingDetails?.displayName || w.name }}</option>
              </select>
            </label>
          </div>

          <p v-if="error" class="rounded-lg bg-error-light text-error text-sm px-3.5 py-2.5">{{ error }}</p>

          <div class="flex justify-end gap-3 pt-2">
            <button type="button" @click="$router.back()" class="px-4 h-10 text-slate-500 text-[13px] font-medium hover:text-slate-700 transition-colors">Annuler</button>
            <button type="submit" :disabled="saving" class="px-5 h-10 rounded-lg bg-primary text-white text-[13px] font-bold shadow-sm shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-60 inline-flex items-center gap-2">
              <span v-if="saving" class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
              Ajouter
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { Perm } from '../../permissions'
import { addMember } from '../../api/organization'
import { listEvents, type Event } from '../../api/events'

const route = useRoute()
const auth = useAuthStore()
const error = ref('')
const saving = ref(false)
const weddings = ref<Event[]>([])

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  roleCode: 'GESTIONNAIRE_INVITES',
  eventId: 0 as number,
})

onMounted(async () => {
  weddings.value = await listEvents(undefined, 0, 100)
  if (weddings.value.length) {
    form.eventId = weddings.value[0].id
  }
})

async function submitCreate() {
  if (!auth.user?.organizationId) return
  saving.value = true
  error.value = ''
  try {
    await addMember(auth.user.organizationId, {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone || undefined,
      password: form.password,
      roleCode: form.roleCode,
      eventId: form.eventId,
    })
    window.history.length > 1 ? window.history.back() : window.location.href = '/dashboard/members'
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : "Échec de l'ajout du membre."
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.input { @apply block w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-slate-400; }
</style>
