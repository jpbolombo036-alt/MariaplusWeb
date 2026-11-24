<template>
  <main class="min-h-screen bg-slate-50 grid place-items-center px-4 py-10">
    <form
      class="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8"
      novalidate
      @submit.prevent="submit"
    >
      <div class="w-12 h-12 rounded-xl bg-primary/10 text-primary grid place-items-center mb-4">
        <span class="material-symbols-outlined text-[26px]" aria-hidden="true">lock_reset</span>
      </div>
      <h1 class="text-[20px] font-bold text-slate-900">Choisissez votre nouveau mot de passe</h1>
      <p class="text-[13px] text-slate-500 mt-1">
        Vous vous êtes connecté avec un mot de passe temporaire. Remplacez-le pour accéder à votre espace.
      </p>

      <div class="mt-6 space-y-4">
        <div>
          <label for="current-password" class="block text-[13px] font-semibold text-slate-700 mb-1">Mot de passe temporaire</label>
          <input id="current-password" v-model="current" type="password" autocomplete="current-password" required
                 class="w-full h-11 rounded-lg border border-slate-200 px-3 text-[14px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20" />
        </div>
        <div>
          <label for="new-password" class="block text-[13px] font-semibold text-slate-700 mb-1">Nouveau mot de passe</label>
          <input id="new-password" v-model="next" type="password" autocomplete="new-password" required minlength="8"
                 aria-describedby="new-password-hint"
                 class="w-full h-11 rounded-lg border border-slate-200 px-3 text-[14px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20" />
          <p id="new-password-hint" class="text-[12px] text-slate-500 mt-1">Au moins 8 caractères.</p>
        </div>
        <div>
          <label for="confirm-password" class="block text-[13px] font-semibold text-slate-700 mb-1">Confirmer le nouveau mot de passe</label>
          <input id="confirm-password" v-model="confirm" type="password" autocomplete="new-password" required
                 class="w-full h-11 rounded-lg border border-slate-200 px-3 text-[14px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20" />
        </div>
      </div>

      <p v-if="error" class="mt-4 text-[13px] text-error" role="alert">{{ error }}</p>

      <button
        type="submit"
        :disabled="saving"
        class="mt-6 w-full h-11 rounded-lg bg-primary text-white text-[14px] font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
      >{{ saving ? 'Enregistrement…' : 'Enregistrer et continuer' }}</button>
      <button type="button" class="mt-3 w-full text-[13px] font-semibold text-slate-500 hover:text-slate-800" @click="logout">
        Se déconnecter
      </button>
    </form>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { changeMyPassword } from '../api/user'
import { apiErrorMessage } from '../api/http'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const current = ref('')
const next = ref('')
const confirm = ref('')
const saving = ref(false)
const error = ref('')

/** Only same-app paths: never follow a redirect to another site. */
function safeRedirect(): string {
  const target = typeof route.query.redirect === 'string' ? route.query.redirect : ''
  return target.startsWith('/') && !target.startsWith('//') && !target.startsWith('/change-password') ? target : '/dashboard'
}

async function submit() {
  error.value = ''
  if (!current.value) { error.value = 'Saisissez le mot de passe temporaire reçu.'; return }
  if (next.value.length < 8) { error.value = 'Le nouveau mot de passe doit contenir au moins 8 caractères.'; return }
  if (next.value !== confirm.value) { error.value = 'Les deux nouveaux mots de passe ne correspondent pas.'; return }
  if (next.value === current.value) { error.value = 'Choisissez un mot de passe différent du mot de passe temporaire.'; return }
  saving.value = true
  try {
    await changeMyPassword(current.value, next.value)
    if (auth.user) auth.user.mustChangePassword = false
    await router.replace(safeRedirect())
  } catch (e) {
    error.value = apiErrorMessage(e)
  } finally {
    saving.value = false
  }
}

function logout() {
  void auth.logout().finally(() => router.replace('/login'))
}
</script>
