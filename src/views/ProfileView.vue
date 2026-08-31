<template>
  <div class="max-w-3xl">
    <h1 class="text-[22px] font-bold text-slate-900 tracking-tight">Profil</h1>
    <p class="text-[13px] text-slate-500 mt-0.5 font-medium mb-6">Gérez vos informations personnelles et votre mot de passe.</p>

    <!-- Carte identité -->
    <div class="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
      <div class="flex items-center gap-5">
        <span class="w-16 h-16 rounded-lg bg-primary-light text-primary grid place-items-center text-2xl font-bold">
          {{ initials }}
        </span>
        <div>
          <div class="text-[18px] font-bold text-slate-900">{{ auth.user?.firstName }} {{ auth.user?.lastName }}</div>
          <div class="text-[13px] text-slate-500">{{ auth.user?.email }}</div>
        </div>
      </div>
      <div class="mt-4 flex flex-wrap gap-2">
        <span v-for="r in auth.roles" :key="r" class="px-2.5 py-1 rounded-full bg-primary-light text-primary text-xs font-semibold">{{ r }}</span>
      </div>
    </div>

    <!-- Formulaire profil -->
    <div class="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
      <h2 class="text-[15px] font-bold text-slate-900 mb-4">Informations personnelles</h2>
      <form @submit.prevent="saveProfile">
        <div class="grid sm:grid-cols-2 gap-4 mb-4">
          <label class="block">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Prénom</span>
            <input v-model="profForm.firstName" required class="input" />
          </label>
          <label class="block">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Nom</span>
            <input v-model="profForm.lastName" required class="input" />
          </label>
        </div>
        <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Email</label>
        <input v-model="profForm.email" type="email" required class="input mb-5" />
        <div class="flex items-center gap-3">
          <button type="submit" :disabled="savingProfile" class="h-10 px-5 rounded-lg bg-primary text-white text-[13px] font-bold shadow-sm shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-60">
            {{ savingProfile ? 'Enregistrement…' : 'Enregistrer' }}
          </button>
          <span v-if="profileMsg" class="text-sm" :class="profileErr ? 'text-error' : 'text-success'">{{ profileMsg }}</span>
        </div>
      </form>
    </div>

    <!-- Formulaire mot de passe -->
    <div class="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
      <h2 class="text-[15px] font-bold text-slate-900 mb-4">Changer le mot de passe</h2>
      <form @submit.prevent="savePassword">
        <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Ancien mot de passe</label>
        <input v-model="pwd.oldPassword" type="password" required class="input mb-4" />
        <div class="grid sm:grid-cols-2 gap-4 mb-4">
          <label class="block">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Nouveau mot de passe</span>
            <input v-model="pwd.newPassword" type="password" required minlength="6" class="input" />
          </label>
          <label class="block">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Confirmation</span>
            <input v-model="pwd.confirm" type="password" required class="input" />
          </label>
        </div>
        <div class="flex items-center gap-3">
          <button type="submit" :disabled="savingPwd" class="h-10 px-5 rounded-lg bg-primary text-white text-[13px] font-bold shadow-sm shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-60">
            {{ savingPwd ? 'Envoi…' : 'Mettre à jour' }}
          </button>
          <span v-if="pwdMsg" class="text-sm" :class="pwdErr ? 'text-error' : 'text-success'">{{ pwdMsg }}</span>
        </div>
      </form>
    </div>

    <button class="h-10 px-5 rounded-lg bg-error-light text-error text-[13px] font-semibold hover:bg-error/10 transition-colors" @click="logout">Se déconnecter</button>
  </div>
</template>
<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { updateMyProfile, changeMyPassword } from '../api/user'

const auth = useAuthStore()
const router = useRouter()

const initials = computed(() => `${auth.user?.firstName?.[0] ?? ''}${auth.user?.lastName?.[0] ?? ''}`.toUpperCase())

const profForm = reactive({
  firstName: auth.user?.firstName ?? '',
  lastName: auth.user?.lastName ?? '',
  email: auth.user?.email ?? '',
})
const savingProfile = ref(false)
const profileMsg = ref('')
const profileErr = ref(false)

const pwd = reactive({ oldPassword: '', newPassword: '', confirm: '' })
const savingPwd = ref(false)
const pwdMsg = ref('')
const pwdErr = ref(false)

async function saveProfile() {
  savingProfile.value = true
  profileMsg.value = ''
  profileErr.value = false
  try {
    await updateMyProfile({ ...profForm })
    // met à jour le store local si la réponse contient les infos
    profileMsg.value = 'Profil mis à jour avec succès.'
  } catch {
    profileErr.value = true
    profileMsg.value = 'Erreur lors de la mise à jour du profil.'
  } finally {
    savingProfile.value = false
  }
}

async function savePassword() {
  profileErr.value = false
  pwdMsg.value = ''
  pwdErr.value = false
  if (pwd.newPassword !== pwd.confirm) {
    pwdErr.value = true
    pwdMsg.value = 'Les mots de passe ne correspondent pas.'
    return
  }
  savingPwd.value = true
  try {
    await changeMyPassword(pwd.oldPassword, pwd.newPassword)
    pwdMsg.value = 'Mot de passe mis à jour.'
    pwd.oldPassword = pwd.newPassword = pwd.confirm = ''
  } catch {
    pwdErr.value = true
    pwdMsg.value = 'Erreur : ancien mot de passe incorrect ou serveur injoignable.'
  } finally {
    savingPwd.value = false
  }
}

async function logout() {
  await auth.logout()
  router.push({ name: 'login' })
}
</script>

<style scoped>
.field {
  @apply block w-full px-4 py-2.5 rounded-lg border border-[#e8eaf0] bg-white outline-none focus:border-primary text-sm text-[#1F2937];
}
</style>