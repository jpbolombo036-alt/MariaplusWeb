<template>
  <div class="max-w-3xl">
    <h1 class="text-[22px] font-bold text-slate-900 tracking-tight">Profil</h1>
    <p class="text-[13px] text-slate-500 mt-0.5 font-medium mb-6">Gérez vos informations personnelles et votre mot de passe.</p>

    <!-- Carte identité -->
    <div class="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
      <div class="flex items-center gap-5">
        <div class="relative">
          <img
            v-if="avatarSrc"
            :src="avatarSrc"
            alt="Photo de profil"
            class="w-16 h-16 rounded-2xl object-cover ring-1 ring-primary/20"
          />
          <span v-else class="w-16 h-16 rounded-2xl bg-primary-light text-primary grid place-items-center text-2xl font-bold ring-1 ring-primary/20">
            {{ initials }}
          </span>
          <span class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-success grid place-items-center ring-2 ring-white dark:ring-[rgb(43_47_59)]">
            <span class="material-symbols-outlined text-white text-[12px]">check</span>
          </span>
          <button
            type="button"
            title="Changer la photo"
            class="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary text-white grid place-items-center shadow hover:bg-primary-dark transition-colors"
            @click="fileInput?.click()"
          >
            <span class="material-symbols-outlined text-[14px]">photo_camera</span>
          </button>
        </div>
        <input
          ref="fileInput"
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          class="hidden"
          @change="onAvatarPick"
        />
        <div class="min-w-0">
          <div class="text-[18px] font-bold text-slate-900 truncate">{{ auth.user?.firstName }} {{ auth.user?.lastName }}</div>
          <div class="text-[13px] text-slate-500 truncate">{{ auth.user?.email }}</div>
          <div v-if="phoneDisplay" class="text-[13px] text-slate-500 flex items-center gap-1">
            <span class="material-symbols-outlined text-[14px]">call</span>{{ phoneDisplay }}
          </div>
        </div>
      </div>
      <div class="mt-4 flex flex-wrap gap-2 items-center">
        <span v-for="r in auth.roles" :key="r" class="px-2.5 py-1 rounded-full bg-primary-light text-primary text-xs font-semibold">{{ r }}</span>
        <button
          v-if="avatarSrc"
          type="button"
          :disabled="avatarBusy"
          class="ml-auto text-xs font-semibold text-error hover:bg-error/10 rounded-lg px-2.5 py-1 transition-colors disabled:opacity-60"
          @click="removeAvatar"
        >Supprimer la photo</button>
      </div>
      <p v-if="avatarMsg" class="mt-3 text-sm inline-flex items-center gap-1" :class="avatarErr ? 'text-error' : 'text-success'">
        <span class="material-symbols-outlined text-[16px]">{{ avatarErr ? 'error' : 'check_circle' }}</span>
        {{ avatarMsg }}
      </p>
    </div>

    <!-- Formulaire profil -->
    <div class="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
      <div class="flex items-center gap-2 mb-5">
        <span class="material-symbols-outlined text-[20px] text-primary">badge</span>
        <h2 class="text-[15px] font-bold text-slate-900">Informations personnelles</h2>
      </div>
      <form @submit.prevent="saveProfile">
        <div class="grid sm:grid-cols-2 gap-4 mb-4">
          <label class="block">
            <span class="label">Prénom <span class="text-error">*</span></span>
            <input v-model="profForm.firstName" required maxlength="60" placeholder="Ex : Jean" class="input" />
          </label>
          <label class="block">
            <span class="label">Nom <span class="text-error">*</span></span>
            <input v-model="profForm.lastName" required maxlength="60" placeholder="Ex : Kabongo" class="input" />
          </label>
        </div>
        <div class="grid sm:grid-cols-2 gap-4 mb-5">
          <label class="block">
            <span class="label"><span class="material-symbols-outlined text-[13px] align-[-2px] mr-0.5">mail</span>Email <span class="text-error">*</span></span>
            <input v-model="profForm.email" type="email" required placeholder="vous@exemple.com" class="input" />
          </label>
          <label class="block">
            <span class="label"><span class="material-symbols-outlined text-[13px] align-[-2px] mr-0.5">call</span>Téléphone</span>
            <input v-model="profForm.phone" type="tel" maxlength="20" placeholder="+243 812 345 678" class="input" />
          </label>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <button type="submit" :disabled="savingProfile || !profileDirty" class="btn-primary">
            <span v-if="savingProfile" class="material-symbols-outlined text-base animate-spin">progress_activity</span>
            {{ savingProfile ? 'Enregistrement�?�' : (profileDirty ? 'Enregistrer les modifications' : 'Aucune modification') }}
          </button>
          <button v-if="profileDirty" type="button" class="h-10 px-4 rounded-lg text-[13px] font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors" @click="resetProfile">
            Annuler
          </button>
          <span v-if="profileMsg" class="text-sm inline-flex items-center gap-1" :class="profileErr ? 'text-error' : 'text-success'">
            <span class="material-symbols-outlined text-[16px]">{{ profileErr ? 'error' : 'check_circle' }}</span>
            {{ profileMsg }}
          </span>
        </div>
      </form>
    </div>

    <!-- Formulaire mot de passe -->
    <!-- Formulaire mot de passe -->
    <div class="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
      <div class="flex items-center gap-2 mb-1">
        <span class="material-symbols-outlined text-[20px] text-primary">lock</span>
        <h2 class="text-[15px] font-bold text-slate-900">Changer le mot de passe</h2>
      </div>
      <p class="text-[12px] text-slate-500 mb-5">Minimum 6 caractères. Lettres, chiffres et symboles pour un mot de passe robuste.</p>

      <form @submit.prevent="savePassword">
        <label class="block mb-4">
          <span class="label">Ancien mot de passe <span class="text-error">*</span></span>
          <div class="relative">
            <input v-model="pwd.oldPassword" :type="show.old ? 'text' : 'password'" required autocomplete="current-password" class="input pr-11" />
            <button type="button" class="eye" @click="show.old = !show.old" :title="show.old ? 'Masquer' : 'Afficher'">
              <span class="material-symbols-outlined text-[19px]">{{ show.old ? 'visibility_off' : 'visibility' }}</span>
            </button>
          </div>
        </label>

        <div class="grid sm:grid-cols-2 gap-4 mb-2">
          <label class="block">
            <span class="label">Nouveau mot de passe <span class="text-error">*</span></span>
            <div class="relative">
              <input v-model="pwd.newPassword" :type="show.next ? 'text' : 'password'" required minlength="6" autocomplete="new-password" class="input pr-11" />
              <button type="button" class="eye" @click="show.next = !show.next" :title="show.next ? 'Masquer' : 'Afficher'">
                <span class="material-symbols-outlined text-[19px]">{{ show.next ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </div>
          </label>
          <label class="block">
            <span class="label">Confirmation <span class="text-error">*</span></span>
            <div class="relative">
              <input v-model="pwd.confirm" :type="show.confirm ? 'text' : 'password'" required autocomplete="new-password"
                     :class="['input pr-11', confirmState === 'mismatch' ? '!border-error' : '', confirmState === 'ok' ? '!border-success' : '']" />
              <button type="button" class="eye" @click="show.confirm = !show.confirm" :title="show.confirm ? 'Masquer' : 'Afficher'">
                <span class="material-symbols-outlined text-[19px]">{{ show.confirm ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </div>
            <span v-if="confirmState === 'mismatch'" class="block mt-1.5 text-[12px] text-error inline-flex items-center gap-1">
              <span class="material-symbols-outlined text-[14px]">error</span>Ne correspond pas
            </span>
            <span v-else-if="confirmState === 'ok'" class="block mt-1.5 text-[12px] text-success inline-flex items-center gap-1">
              <span class="material-symbols-outlined text-[14px]">check_circle</span>Correspond
            </span>
          </label>
        </div>

        <div v-if="pwd.newPassword" class="mb-5">
          <div class="flex items-center gap-2">
            <div class="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div class="h-full rounded-full transition-all duration-300" :class="strength.bar" :style="{ width: strength.percent + '%' }"></div>
            </div>
            <span class="text-[11px] font-semibold" :class="strength.text">{{ strength.label }}</span>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <button type="submit" :disabled="savingPwd || !canSubmitPwd" class="btn-primary">
            <span v-if="savingPwd" class="material-symbols-outlined text-base animate-spin">progress_activity</span>
            {{ savingPwd ? 'Envoi�?�' : 'Mettre à jour le mot de passe' }}
          </button>
          <span v-if="pwdMsg" class="text-sm inline-flex items-center gap-1" :class="pwdErr ? 'text-error' : 'text-success'">
            <span class="material-symbols-outlined text-[16px]">{{ pwdErr ? 'error' : 'check_circle' }}</span>
            {{ pwdMsg }}
          </span>
        </div>
      </form>
    </div>

    <button class="h-10 px-5 rounded-lg bg-error-light text-error text-[13px] font-semibold hover:bg-error/10 transition-colors inline-flex items-center gap-2" @click="logout">
      <span class="material-symbols-outlined text-[18px]">logout</span>Se déconnecter
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { updateMyProfile, changeMyPassword, loadMyAvatar, uploadMyAvatar, deleteMyAvatar } from '../api/user'

const auth = useAuthStore()
const router = useRouter()

const initials = computed(() => `${auth.user?.firstName?.[0] ?? ''}${auth.user?.lastName?.[0] ?? ''}`.toUpperCase())

/* --- Photo de profil --- */
const fileInput = ref<HTMLInputElement | null>(null)
const avatarSrc = ref<string | null>(null)
const avatarVersion = ref(Date.now())
const avatarMsg = ref('')
const avatarErr = ref(false)
const avatarBusy = ref(false)

onMounted(async () => {
  avatarSrc.value = await loadMyAvatar(avatarVersion.value)
})

async function onAvatarPick(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  avatarMsg.value = ''
  avatarErr.value = false
  if (!/^image\/(jpeg|png|gif|webp)$/.test(file.type)) {
    avatarErr.value = true
    avatarMsg.value = 'Format non supporté (JPEG, PNG, GIF ou WebP attendu).'
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    avatarErr.value = true
    avatarMsg.value = 'Image trop volumineuse (max 2 Mo).'
    return
  }
  avatarBusy.value = true
  try {
    await uploadMyAvatar(file)
    if (avatarSrc.value) URL.revokeObjectURL(avatarSrc.value)
    avatarSrc.value = await loadMyAvatar(++avatarVersion.value)
    avatarMsg.value = 'Photo mise à jour.'
  } catch (e: any) {
    avatarErr.value = true
    avatarMsg.value = e?.response?.data?.error || e?.message || "Impossible d'envoyer la photo."
  } finally {
    avatarBusy.value = false
  }
}

async function removeAvatar() {
  avatarBusy.value = true
  avatarMsg.value = ''
  avatarErr.value = false
  try {
    await deleteMyAvatar()
    if (avatarSrc.value) URL.revokeObjectURL(avatarSrc.value)
    avatarSrc.value = null
    avatarMsg.value = 'Photo supprimée.'
  } catch (e: any) {
    avatarErr.value = true
    avatarMsg.value = e?.response?.data?.error || e?.message || 'Impossible de supprimer la photo.'
  } finally {
    avatarBusy.value = false
  }
}
const phoneDisplay = computed(() => (auth.user as any)?.phone ?? '')

/* --- Profil --- */
const profForm = reactive({
  firstName: auth.user?.firstName ?? '',
  lastName: auth.user?.lastName ?? '',
  email: auth.user?.email ?? '',
  phone: (auth.user as any)?.phone ?? '',
})
const snapshot = JSON.stringify({ ...profForm })
const profileDirty = computed(() => JSON.stringify({ ...profForm }) !== snapshot)
const savingProfile = ref(false)
const profileMsg = ref('')
const profileErr = ref(false)

function resetProfile() {
  const s = JSON.parse(snapshot)
  profForm.firstName = s.firstName
  profForm.lastName = s.lastName
  profForm.email = s.email
  profForm.phone = s.phone
  profileMsg.value = ''
}

async function saveProfile() {
  savingProfile.value = true
  profileMsg.value = ''
  profileErr.value = false
  try {
    const updated: any = await updateMyProfile({ ...profForm, phone: profForm.phone || null })
    // met à jour le store local si la réponse contient les infos
    const u: any = auth.user
    if (u && updated && typeof updated === 'object') {
      u.firstName = updated.firstName ?? u.firstName
      u.lastName = updated.lastName ?? u.lastName
      u.email = updated.email ?? u.email
      u.phone = updated.phone ?? profForm.phone
    }
    profileMsg.value = 'Profil mis à jour avec succès.'
  } catch {
    profileErr.value = true
    profileMsg.value = 'Erreur lors de la mise à jour du profil.'
  } finally {
    savingProfile.value = false
  }
}

/* --- Mot de passe --- */
const pwd = reactive({ oldPassword: '', newPassword: '', confirm: '' })
const show = reactive({ old: false, next: false, confirm: false })
const savingPwd = ref(false)
const pwdMsg = ref('')
const pwdErr = ref(false)

const confirmState = computed<'idle' | 'mismatch' | 'ok'>(() => {
  if (!pwd.confirm) return 'idle'
  return pwd.confirm === pwd.newPassword ? 'ok' : 'mismatch'
})

const canSubmitPwd = computed(() =>
  pwd.oldPassword.length > 0 && pwd.newPassword.length >= 6 && pwd.confirm === pwd.newPassword,
)

const strength = computed(() => {
  const p = pwd.newPassword
  if (!p) return { percent: 0, label: '', bar: '', text: '' }
  let score = 0
  if (p.length >= 6) score++
  if (p.length >= 10) score++
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++
  if (/\d/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++
  const levels = [
    { percent: 20, label: 'Très faible', bar: 'bg-error', text: 'text-error' },
    { percent: 40, label: 'Faible', bar: 'bg-error', text: 'text-error' },
    { percent: 60, label: 'Moyen', bar: 'bg-attention', text: 'text-attention-dark' },
    { percent: 80, label: 'Bon', bar: 'bg-success', text: 'text-success' },
    { percent: 100, label: 'Fort', bar: 'bg-success', text: 'text-success' },
  ]
  return levels[Math.max(0, Math.min(score, 5) - 1)]
})

async function savePassword() {
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
.label {
  @apply flex items-center text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5;
}
.input {
  @apply block w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-slate-400 disabled:opacity-60;
}
.eye {
  @apply absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors;
}
.btn-primary {
  @apply h-10 px-5 rounded-lg bg-primary text-white text-[13px] font-bold shadow-sm shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2;
}
</style>
