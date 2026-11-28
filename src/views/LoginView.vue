<template>
  <div class="min-h-screen relative isolate flex flex-col font-sans text-on-surface bg-background lg:bg-[#17122f]">
    <!-- Ordinateur (version A) : photo de réception floutée en plein écran -->
    <div class="hidden lg:block absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <img src="/images/invitations/preview-reception.jpg" alt="" class="w-full h-full object-cover scale-110 blur-[6px]" />
      <div class="absolute inset-0 bg-gradient-to-br from-[#17122f]/95 via-[#2b1f63]/85 to-[#17122f]/95"></div>
    </div>

    <header class="w-full max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
      <RouterLink to="/" class="flex items-center gap-2.5">
        <img src="/logo.png" alt="" class="w-9 h-9 rounded-lg object-contain ring-1 ring-outline-variant lg:ring-white/20" />
        <span class="text-lg font-bold tracking-tight lg:text-white">Eventia<span class="text-primary lg:text-[#c4b5fd]">Easy</span></span>
      </RouterLink>
      <RouterLink to="/" class="inline-flex items-center gap-1.5 text-[13px] font-semibold text-on-surface-variant hover:text-primary lg:text-white/75 lg:hover:text-white transition-colors">
        <span class="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_back</span>
        Accueil
      </RouterLink>
    </header>

    <!-- Mobile (version B) : vitrine du produit au-dessus du formulaire -->
    <section class="lg:hidden px-4" aria-label="Aperçu d'EventiaEasy (exemple)">
      <div class="relative h-[230px] rounded-3xl overflow-hidden shadow-lg shadow-primary/15">
        <img src="/images/invitations/preview-reception.jpg" alt="" class="absolute inset-0 w-full h-full object-cover" />
        <div class="absolute inset-0 bg-gradient-to-t from-[#17122f]/95 via-[#17122f]/40 to-transparent"></div>
        <div class="absolute left-3 top-3 w-[168px] rounded-xl bg-white/95 text-slate-900 shadow-lg px-3 py-2">
          <p class="text-[10px] font-semibold uppercase tracking-wider text-primary">Invitation · exemple</p>
          <p class="text-[14px] font-bold leading-tight">Grace &amp; Patrick</p>
          <p class="text-[11px] text-slate-500">Sam. 20 mars · Bukavu</p>
        </div>
        <div class="absolute right-3 top-[86px] rounded-xl bg-white/95 text-slate-900 shadow-lg px-2.5 py-2 flex items-center gap-2">
          <span class="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 grid place-items-center">
            <span class="material-symbols-outlined text-[17px]" aria-hidden="true">qr_code_scanner</span>
          </span>
          <span>
            <span class="block text-[12px] font-semibold leading-tight">Entrée validée</span>
            <span class="block text-[10.5px] text-slate-500">Table 4 · 2 pers.</span>
          </span>
        </div>
        <div class="absolute left-4 right-4 bottom-3.5 text-white">
          <p class="text-[19px] font-extrabold leading-tight">Vos invités, votre salle, <span class="text-[#fcd34d]">au même endroit.</span></p>
          <p class="mt-1.5 text-[11.5px] text-white/75">WhatsApp · QR hors ligne · USD et CDF</p>
        </div>
      </div>
    </section>

    <main class="flex-1 flex items-start lg:items-center justify-center px-4 pt-6 pb-8 lg:py-10">
      <div class="w-full max-w-[440px] lg:rounded-3xl lg:bg-surface-container-lowest lg:shadow-2xl lg:shadow-black/40 lg:ring-1 lg:ring-white/10 lg:px-9 lg:py-9">
        <!-- ==================== CONNEXION ==================== -->
        <template v-if="mode === 'login'">
          <div class="hidden lg:grid w-12 h-12 mx-auto mb-4 rounded-2xl bg-primary-light text-primary place-items-center">
            <span class="material-symbols-outlined" aria-hidden="true">lock</span>
          </div>
          <h1 class="text-[24px] font-extrabold tracking-tight lg:text-center">Connexion à votre espace</h1>
          <p class="mt-1 text-[14.5px] text-on-surface-variant lg:text-center">Événements, invités et salle de fête</p>

          <div v-if="error" role="alert" class="mt-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-error-light border border-error/20 text-error text-sm">
            <span class="material-symbols-outlined text-[19px] shrink-0" aria-hidden="true">error</span>
            <span>{{ error }}</span>
          </div>

          <form class="mt-6 space-y-4" @submit.prevent="onSubmit">
            <div>
              <label for="login-email" class="text-sm font-medium mb-1.5 block">Email</label>
              <div class="relative">
                <span aria-hidden="true" class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[19px] text-on-surface-variant">mail</span>
                <input id="login-email" v-model="email" type="email" required autocomplete="email" class="auth-input pl-11" placeholder="vous@exemple.com" />
              </div>
            </div>

            <div>
              <label for="login-password" class="text-sm font-medium mb-1.5 block">Mot de passe</label>
              <div class="relative">
                <span aria-hidden="true" class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[19px] text-on-surface-variant">lock</span>
                <input id="login-password" v-model="password" :type="showPwd ? 'text' : 'password'" required autocomplete="current-password" class="auth-input pl-11 pr-11" placeholder="••••••••" />
                <button type="button" class="auth-eye" :aria-label="showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'" :aria-pressed="showPwd" @click="showPwd = !showPwd">
                  <span aria-hidden="true" class="material-symbols-outlined text-[19px]">{{ showPwd ? 'visibility_off' : 'visibility' }}</span>
                </button>
              </div>
              <div class="mt-2 text-right">
                <button type="button" class="text-[13px] font-semibold text-primary hover:underline" :aria-expanded="recoveryOpen" aria-controls="password-recovery" @click="recoveryOpen = !recoveryOpen">Mot de passe oublié ?</button>
              </div>
            </div>

            <div v-if="recoveryOpen" id="password-recovery" class="rounded-xl border border-outline-variant bg-surface-container-low p-4 text-sm">
              <p v-if="recoverySent" role="status" data-testid="recovery-sent" class="font-medium">{{ recoverySent }}</p>
              <template v-else>
                <p class="text-on-surface-variant">Indiquez l'adresse de votre compte. Notre équipe vous enverra un mot de passe temporaire, en général par WhatsApp. Ne communiquez jamais votre mot de passe actuel.</p>
                <label for="recovery-email" class="block mt-3 mb-1 font-semibold">Email du compte</label>
                <div class="flex gap-2">
                  <input id="recovery-email" v-model="recoveryEmail" type="email" autocomplete="email" class="auth-input !h-10 min-w-0 flex-1" @keydown.enter.prevent="sendRecovery" />
                  <button type="button" :disabled="recoverySending" class="shrink-0 px-4 rounded-xl bg-primary text-white font-semibold disabled:opacity-60" @click="sendRecovery">{{ recoverySending ? 'Envoi…' : 'Envoyer la demande' }}</button>
                </div>
                <p v-if="recoveryError" role="alert" class="mt-2 text-error">{{ recoveryError }}</p>
              </template>
              <a :href="recoverySupportUrl" target="_blank" rel="noopener noreferrer" class="mt-3 inline-block font-semibold text-primary hover:underline">Ou écrivez-nous sur WhatsApp</a>
            </div>

            <button type="submit" :disabled="loading" class="auth-primary">
              <span v-if="loading" class="material-symbols-outlined animate-spin text-base" aria-hidden="true">progress_activity</span>
              {{ loading ? 'Connexion…' : 'Se connecter' }}
              <span v-if="!loading" class="material-symbols-outlined text-[19px]" aria-hidden="true">arrow_forward</span>
            </button>
          </form>

          <div class="my-5 flex items-center gap-3 text-[12px] text-on-surface-variant" aria-hidden="true">
            <span class="flex-1 h-px bg-outline-variant"></span>ou<span class="flex-1 h-px bg-outline-variant"></span>
          </div>
          <a :href="recoverySupportUrl" target="_blank" rel="noopener noreferrer"
            class="w-full h-11 rounded-xl border border-outline-variant inline-flex items-center justify-center gap-2 text-[14px] font-semibold hover:border-primary/50 transition-colors">
            <WhatsappIcon class="w-5 h-5 text-[#25D366]" />
            Besoin d'aide ? WhatsApp
          </a>

          <p class="mt-6 text-sm text-on-surface-variant text-center">
            Nouveau sur EventiaEasy ?
            <button type="button" class="font-semibold text-primary hover:underline" @click="mode = 'register'">Créer mon espace</button>
          </p>
        </template>

        <!-- ==================== INSCRIPTION (2 étapes) ==================== -->
        <template v-else>
          <div class="flex gap-2" aria-hidden="true">
            <span class="flex-1 h-1.5 rounded-full bg-primary"></span>
            <span class="flex-1 h-1.5 rounded-full transition-colors" :class="step === 2 ? 'bg-primary' : 'bg-surface-container-high'"></span>
          </div>
          <p class="mt-4 text-[12.5px] font-semibold text-primary">Étape {{ step }} sur 2</p>
          <h1 class="mt-0.5 text-[24px] font-extrabold tracking-tight">{{ step === 1 ? 'Créer mon espace' : 'Votre organisation' }}</h1>
          <p class="mt-1 text-[14.5px] text-on-surface-variant">
            {{ step === 1 ? 'Vos informations de connexion.' : 'Vous êtes connecté dès la création de votre espace.' }}
          </p>

          <form class="mt-6 space-y-4" @submit.prevent="onSubmit">
            <template v-if="step === 1">
              <div class="grid grid-cols-2 gap-3">
                <label class="block">
                  <span class="text-sm font-medium mb-1.5 block">Prénom</span>
                  <input v-model="reg.firstName" type="text" required autocomplete="given-name" class="auth-input" placeholder="Jean-Pierre" />
                </label>
                <label class="block">
                  <span class="text-sm font-medium mb-1.5 block">Nom</span>
                  <input v-model="reg.lastName" type="text" required autocomplete="family-name" class="auth-input" placeholder="Bolombo" />
                </label>
              </div>
              <label class="block">
                <span class="text-sm font-medium mb-1.5 block">Email</span>
                <input v-model="reg.email" type="email" required autocomplete="email" class="auth-input" placeholder="vous@exemple.com" />
              </label>
              <label class="block">
                <span class="text-sm font-medium mb-1.5 block">Téléphone WhatsApp <span class="text-on-surface-variant font-normal">(optionnel)</span></span>
                <input v-model="reg.phone" type="tel" autocomplete="tel" class="auth-input" placeholder="+243 81 234 5678" />
              </label>
              <div>
                <label for="reg-password" class="text-sm font-medium mb-1.5 block">Mot de passe</label>
                <span class="relative block">
                  <input id="reg-password" v-model="reg.password" :type="showRegPwd ? 'text' : 'password'" required minlength="8" autocomplete="new-password" class="auth-input pr-11" placeholder="8 caractères minimum" />
                  <button type="button" class="auth-eye" :aria-label="showRegPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'" :aria-pressed="showRegPwd" @click="showRegPwd = !showRegPwd">
                    <span aria-hidden="true" class="material-symbols-outlined text-[19px]">{{ showRegPwd ? 'visibility_off' : 'visibility' }}</span>
                  </button>
                </span>
                <span v-if="reg.password" class="mt-2 flex items-center gap-2">
                  <span class="flex-1 h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                    <span class="block h-full rounded-full transition-all duration-300" :class="strength.bar" :style="{ width: strength.percent + '%' }"></span>
                  </span>
                  <span class="text-[11px] font-semibold" :class="strength.text">{{ strength.label }}</span>
                </span>
              </div>
              <div>
                <label for="reg-confirm" class="text-sm font-medium mb-1.5 block">Confirmation du mot de passe</label>
                <span class="relative block">
                  <input id="reg-confirm" v-model="reg.confirm" :type="showRegConfirm ? 'text' : 'password'" required autocomplete="new-password"
                    :class="['auth-input pr-11', confirmState === 'mismatch' ? '!border-error' : '', confirmState === 'ok' ? '!border-success' : '']"
                    placeholder="••••••••" />
                  <button type="button" class="auth-eye" :aria-label="showRegConfirm ? 'Masquer la confirmation du mot de passe' : 'Afficher la confirmation du mot de passe'" :aria-pressed="showRegConfirm" @click="showRegConfirm = !showRegConfirm">
                    <span aria-hidden="true" class="material-symbols-outlined text-[19px]">{{ showRegConfirm ? 'visibility_off' : 'visibility' }}</span>
                  </button>
                </span>
                <span v-if="confirmState === 'mismatch'" class="mt-1.5 text-[12px] text-error inline-flex items-center gap-1">
                  <span class="material-symbols-outlined text-[14px]" aria-hidden="true">error</span>Ne correspond pas
                </span>
                <span v-else-if="confirmState === 'ok'" class="mt-1.5 text-[12px] text-success inline-flex items-center gap-1">
                  <span class="material-symbols-outlined text-[14px]" aria-hidden="true">check_circle</span>Correspond
                </span>
              </div>
            </template>

            <template v-else>
              <fieldset>
                <legend class="text-sm font-medium mb-1.5">Vous êtes</legend>
                <div class="grid grid-cols-2 gap-3">
                  <label v-for="o in profileOptions" :key="o.label"
                    class="cursor-pointer rounded-xl border p-3.5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/40"
                    :class="reg.venueOwner === o.value ? 'border-primary bg-primary-light text-primary' : 'border-outline-variant hover:border-primary/50'">
                    <input v-model="reg.venueOwner" type="radio" name="profile" :value="o.value" class="sr-only" />
                    <span class="material-symbols-outlined" aria-hidden="true">{{ o.icon }}</span>
                    <span class="mt-1 block text-[14px] font-semibold">{{ o.label }}</span>
                    <span class="block text-[12px]" :class="reg.venueOwner === o.value ? 'text-primary/80' : 'text-on-surface-variant'">{{ o.hint }}</span>
                  </label>
                </div>
              </fieldset>
              <label class="block">
                <span class="text-sm font-medium mb-1.5 block">{{ reg.venueOwner ? 'Nom de la salle ou de la société' : "Nom de l'organisation" }}</span>
                <input v-model="reg.organizationName" type="text" required class="auth-input" :placeholder="reg.venueOwner ? 'Ex. Salle Exodus' : 'Ex. Les Événements d’Or'" />
              </label>
              <label class="block">
                <span class="text-sm font-medium mb-1.5 block">Ville ou adresse <span class="text-on-surface-variant font-normal">(optionnel)</span></span>
                <input v-model="reg.organizationAddress" type="text" autocomplete="address-level2" class="auth-input" placeholder="Ex. Kinshasa, Gombe" />
              </label>
              <p v-if="reg.venueOwner" class="flex items-start gap-2 rounded-xl bg-primary-light p-3 text-[13px]">
                <span class="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">info</span>
                Notre équipe est prévenue et active le module Salles sur votre espace.
              </p>
              <p class="text-[12.5px] text-on-surface-variant">L'email et le téléphone de l'étape 1 servent aussi pour l'organisation ; vous pourrez les modifier plus tard.</p>
            </template>

            <div v-if="error" role="alert" class="flex items-start gap-2.5 p-3.5 rounded-xl bg-error-light border border-error/20 text-error text-sm">
              <span class="material-symbols-outlined text-[19px] shrink-0" aria-hidden="true">error</span>
              <span>{{ error }}</span>
            </div>

            <div class="flex gap-3">
              <button v-if="step === 2" type="button" class="h-12 px-5 rounded-xl border border-outline-variant font-semibold hover:border-primary/50 transition-colors" @click="step = 1; error = ''">Retour</button>
              <button type="submit" :disabled="loading || confirmState === 'mismatch'" class="auth-primary flex-1">
                <span v-if="loading" class="material-symbols-outlined animate-spin text-base" aria-hidden="true">progress_activity</span>
                {{ step === 1 ? 'Continuer' : loading ? 'Création…' : 'Créer mon espace' }}
              </button>
            </div>
          </form>

          <p class="mt-6 text-sm text-on-surface-variant text-center">
            Vous avez déjà un compte ?
            <button type="button" class="font-semibold text-primary hover:underline" @click="mode = 'login'">Me connecter</button>
          </p>
        </template>
      </div>
    </main>

    <footer class="pb-6 text-center text-[12px] text-on-surface-variant lg:text-white/60">
      © {{ year }} EventiaEasy ·
      <a :href="`mailto:${contactEmail}`" class="hover:underline">{{ contactEmail }}</a>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ApiConfig } from '../api/config'
import { requestPasswordReset } from '../api/user'
import { apiErrorMessage } from '../api/http'
import WhatsappIcon from '../components/common/WhatsappIcon.vue'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const recoveryOpen = ref(false)
const recoveryEmail = ref('')
const recoverySending = ref(false)
const recoverySent = ref('')
const recoveryError = ref('')
watch(recoveryOpen, (isOpen) => { if (isOpen && !recoveryEmail.value) recoveryEmail.value = email.value.trim() })

async function sendRecovery() {
  const value = recoveryEmail.value.trim()
  recoveryError.value = ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    recoveryError.value = 'Saisissez une adresse email valide.'
    return
  }
  if (recoverySending.value) return
  recoverySending.value = true
  try {
    recoverySent.value = await requestPasswordReset(value)
  } catch (e) {
    recoveryError.value = apiErrorMessage(e)
  } finally {
    recoverySending.value = false
  }
}
const recoverySupportUrl = `https://wa.me/${ApiConfig.whatsappContactNumber}?text=${encodeURIComponent("Bonjour, j'ai besoin d'aide pour récupérer l'accès à mon compte EventiaEasy.")}`
const password = ref('')
const loading = ref(false)
const error = ref('')
const mode = ref<'login' | 'register'>(route.query.mode === 'register' ? 'register' : 'login')
watch(() => route.query.mode, (value) => {
  mode.value = value === 'register' ? 'register' : 'login'
  error.value = ''
})
watch(mode, (value) => {
  error.value = ''
  if (value !== (route.query.mode === 'register' ? 'register' : 'login')) {
    void router.replace({ query: { ...route.query, mode: value === 'register' ? 'register' : undefined } })
  }
})
const showPwd = ref(false)
const step = ref<1 | 2>(1)
watch(mode, () => { step.value = 1 })
const year = new Date().getFullYear()
const contactEmail = ApiConfig.contactEmail
const profileOptions = [
  { value: false, icon: 'celebration', label: "J'organise", hint: 'Mariages, fêtes, cérémonies' },
  { value: true, icon: 'storefront', label: "J'ai une salle", hint: 'Réservations et caisse' },
]
const showRegPwd = ref(false)
const showRegConfirm = ref(false)

/* Jauge de robustesse du mot de passe (inscription). */
const strength = computed(() => {
  const p = reg.value.password
  if (!p) return { percent: 0, label: '', bar: '', text: '' }
  let score = 0
  if (p.length >= 8) score++
  if (p.length >= 12) score++
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

const confirmState = computed<'idle' | 'mismatch' | 'ok'>(() => {
  if (!reg.value.confirm) return 'idle'
  return reg.value.confirm === reg.value.password ? 'ok' : 'mismatch'
})

const reg = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirm: '',
  organizationName: '',
  organizationEmail: '',
  organizationPhone: '',
  organizationAddress: '',
  venueOwner: false,
})

onMounted(() => {
  if (auth.isAuthenticated) router.replace((route.query.redirect as string) || '/dashboard')
})

async function onSubmit() {
  error.value = ''
  if (mode.value === 'login') {
    loading.value = true
    try {
      await auth.login(email.value, password.value)
      router.replace((route.query.redirect as string) || '/dashboard')
    } catch (e: any) {
      error.value = e?.response?.data?.error || e?.message || 'Identifiants invalides'
    } finally {
      loading.value = false
    }
    return
  }
  // Inscription : validations locales alignées sur RegisterRequest (backend)
  const r = reg.value
  if (r.password.length < 8) {
    error.value = 'Le mot de passe doit contenir au moins 8 caractères'
    return
  }
  if (r.password !== r.confirm) {
    error.value = 'Les mots de passe ne correspondent pas'
    return
  }
  if (step.value === 1) {
    step.value = 2
    return
  }
  loading.value = true
  try {
    await auth.register({
      firstName: r.firstName.trim(),
      lastName: r.lastName.trim(),
      email: r.email.trim(),
      phone: r.phone.trim() || undefined,
      password: r.password,
      organizationName: r.organizationName.trim(),
      organizationEmail: r.organizationEmail.trim() || r.email.trim(),
      organizationPhone: r.organizationPhone.trim() || r.phone.trim() || undefined,
      organizationAddress: r.organizationAddress.trim() || undefined,
      venueOwner: r.venueOwner,
    })
    // POST /auth/register renvoie un LoginResponse → déjà connecté.
    router.replace('/dashboard')
  } catch (e: any) {
    error.value = e?.response?.data?.error || e?.message || "Impossible de créer le compte (email peut-être déjà utilisé)"
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-input {
  @apply w-full h-12 px-4 rounded-xl border border-outline-variant bg-surface-container-lowest text-[15px] outline-none transition-all placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-4 focus:ring-primary/15;
}
.auth-eye {
  @apply absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-on-surface-variant hover:text-on-surface transition-colors;
}
.auth-primary {
  @apply h-12 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-white text-[15px] font-semibold shadow-lg shadow-primary/25 hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed transition-all;
}
</style>
