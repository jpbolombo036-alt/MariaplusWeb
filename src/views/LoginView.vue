<template>
  <div class="min-h-screen flex items-center justify-center p-4 md:p-8 font-sans text-on-surface">
    <button type="button" class="fixed top-4 left-4 z-50 h-10 px-4 rounded-lg bg-white/80 backdrop-blur border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-white inline-flex items-center gap-2 shadow-sm" @click="router.push('/')">
      <span class="material-symbols-outlined text-[18px]">arrow_back</span>
      Retour
    </button>
    <main class="w-full max-w-[1400px] min-h-[760px] bg-surface-container-lowest rounded-3xl shadow-2xl flex flex-col lg:flex-row overflow-hidden relative">
      <!-- Hero gauche (masqué < lg) -->
      <section class="hidden lg:flex w-full lg:w-5/12 bg-image-overlay p-12 flex-col justify-between text-white relative">
        <div class="flex items-center gap-3 z-10">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-md border border-primary/30 overflow-hidden">
            <span class="w-10 h-10 rounded-xl overflow-hidden grid place-items-center"><img src="/logo.png" alt="MariagePlus" class="w-full h-full object-contain" /></span>
          </div>
          <span class="text-2xl font-bold tracking-tight">Mariage<span class="text-primary">Plus</span></span>
        </div>

        <div class="z-10 mt-16 max-w-md">
          <h1 class="text-5xl font-bold leading-tight mb-6">Organisez.<br />Invitez.<br />Célébrez.</h1>
          <div class="w-12 h-1 bg-primary mb-6"></div>
          <p class="text-lg text-slate-300 leading-relaxed mb-6">
            La solution complète pour gérer vos événements avec élégance et simplicité.
          </p>
        </div>

        <div class="z-10">
          <div class="flex items-center gap-6 text-sm text-slate-300">
            <span class="flex items-center gap-2"><span class="material-symbols-outlined text-primary">diversity_2</span> Invités</span>
            <span class="flex items-center gap-2"><span class="material-symbols-outlined text-primary">qr_code_scanner</span> Check-in</span>
            <span class="flex items-center gap-2"><span class="material-symbols-outlined text-primary">bar_chart</span> RSVP</span>
          </div>
        </div>
      </section>

      <!-- Formulaire droit -->
      <section class="flex-1 flex flex-col justify-center px-6 md:px-16 py-12 bg-surface-container-lowest">
        <div class="max-w-md w-full mx-auto">
          <div class="flex lg:hidden items-center justify-center gap-2 mb-6">
            <span class="w-9 h-9 rounded-lg overflow-hidden grid place-items-center"><img src="/logo.png" alt="MariagePlus" class="w-full h-full object-contain" /></span>
            <span class="text-xl font-bold">MariagePlus</span>
          </div>

          <!-- Bascule Connexion / Inscription -->
          <div class="flex items-center gap-1 p-1 rounded-xl bg-surface-container mb-8">
            <button
              type="button" @click="mode = 'login'"
              class="flex-1 h-10 rounded-lg text-sm font-semibold transition-colors"
              :class="mode === 'login' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-primary'"
            >Se connecter</button>
            <button
              type="button" @click="mode = 'register'"
              class="flex-1 h-10 rounded-lg text-sm font-semibold transition-colors"
              :class="mode === 'register' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-primary'"
            >Créer un compte</button>
          </div>

          <!-- ==================== CONNEXION ==================== -->
          <template v-if="mode === 'login'">
            <h2 class="text-2xl font-bold text-on-surface mb-1">Bon retour parmi nous</h2>
            <p class="text-on-surface-variant mb-8">Accédez à votre espace de gestion</p>

            <form class="space-y-4" @submit.prevent="onSubmit">
            <label class="block">
              <span class="text-sm font-medium text-on-surface mb-1 block">Email</span>
              <input
                v-model="email" type="email" required
                class="w-full h-11 px-4 rounded-xl border border-outline-variant bg-surface focus:border-primary focus:ring-0 text-body-lg"
                placeholder="vous@exemple.com"
              />
            </label>

            <label class="block">
              <span class="text-sm font-medium text-on-surface mb-1 block">Mot de passe</span>
              <input
                v-model="password" type="password" required
                class="w-full h-11 px-4 rounded-xl border border-outline-variant bg-surface focus:border-primary focus:ring-0 text-body-lg"
                placeholder="••••••••"
              />
            </label>

            <p v-if="error" class="text-sm text-error flex items-center gap-1.5">
              <span class="material-symbols-outlined text-base">error</span>{{ error }}
            </p>

            <button
              type="submit" :disabled="loading"
              class="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl shadow-sm text-sm font-semibold text-white bg-primary hover:opacity-90 disabled:opacity-60 transition-colors"
            >
              <span v-if="loading" class="material-symbols-outlined animate-spin text-base">progress_activity</span>
              {{ loading ? 'Connexion…' : 'Se connecter' }}
            </button>
            </form>

            <p class="mt-6 text-sm text-on-surface-variant text-center">
              Vous n'avez pas de compte ?
              <button type="button" class="font-semibold text-primary hover:underline" @click="mode = 'register'">Créez-en un gratuitement</button>
            </p>
          </template>

          <!-- ==================== INSCRIPTION ==================== -->
          <template v-else>
            <h2 class="text-2xl font-bold text-on-surface mb-1">Créer votre compte organisateur</h2>
            <p class="text-on-surface-variant mb-8">Votre organisation est créée automatiquement — vous êtes connecté dès l'inscription.</p>

            <form class="space-y-4" @submit.prevent="onSubmit">
              <div class="grid grid-cols-2 gap-3">
                <label class="block">
                  <span class="text-sm font-medium text-on-surface mb-1 block">Prénom *</span>
                  <input v-model="reg.firstName" type="text" required
                    class="w-full h-11 px-4 rounded-xl border border-outline-variant bg-surface focus:border-primary focus:ring-0 text-body-lg"
                    placeholder="Jean-Pierre" />
                </label>
                <label class="block">
                  <span class="text-sm font-medium text-on-surface mb-1 block">Nom *</span>
                  <input v-model="reg.lastName" type="text" required
                    class="w-full h-11 px-4 rounded-xl border border-outline-variant bg-surface focus:border-primary focus:ring-0 text-body-lg"
                    placeholder="Bolombo" />
                </label>
              </div>

              <label class="block">
                <span class="text-sm font-medium text-on-surface mb-1 block">Email *</span>
                <input v-model="reg.email" type="email" required autocomplete="email"
                  class="w-full h-11 px-4 rounded-xl border border-outline-variant bg-surface focus:border-primary focus:ring-0 text-body-lg"
                  placeholder="vous@exemple.com" />
              </label>

              <label class="block">
                <span class="text-sm font-medium text-on-surface mb-1 block">Téléphone <span class="text-on-surface-variant font-normal">(optionnel)</span></span>
                <input v-model="reg.phone" type="tel"
                  class="w-full h-11 px-4 rounded-xl border border-outline-variant bg-surface focus:border-primary focus:ring-0 text-body-lg"
                  placeholder="+33 6 12 34 56 78" />
              </label>

              <div class="grid grid-cols-2 gap-3">
                <label class="block">
                  <span class="text-sm font-medium text-on-surface mb-1 block">Mot de passe *</span>
                  <input v-model="reg.password" type="password" required minlength="8" autocomplete="new-password"
                    class="w-full h-11 px-4 rounded-xl border border-outline-variant bg-surface focus:border-primary focus:ring-0 text-body-lg"
                    placeholder="8 caractères minimum" />
                </label>
                <label class="block">
                  <span class="text-sm font-medium text-on-surface mb-1 block">Confirmation *</span>
                  <input v-model="reg.confirm" type="password" required autocomplete="new-password"
                    class="w-full h-11 px-4 rounded-xl border border-outline-variant bg-surface focus:border-primary focus:ring-0 text-body-lg"
                    placeholder="••••••••" />
                </label>
              </div>

              <div class="pt-2 border-t border-outline-variant/60">
                <p class="text-xs font-semibold text-primary uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-base">apartment</span>Votre organisation
                </p>

                <label class="block">
                  <span class="text-sm font-medium text-on-surface mb-1 block">Nom de l'organisation *</span>
                  <input v-model="reg.organizationName" type="text" required
                    class="w-full h-11 px-4 rounded-xl border border-outline-variant bg-surface focus:border-primary focus:ring-0 text-body-lg"
                    placeholder="Ex. Les Événements d'Or" />
                </label>

                <div class="grid grid-cols-2 gap-3 mt-3">
                  <label class="block">
                    <span class="text-sm font-medium text-on-surface mb-1 block">Email org. <span class="text-on-surface-variant font-normal">(opt.)</span></span>
                    <input v-model="reg.organizationEmail" type="email"
                      class="w-full h-11 px-4 rounded-xl border border-outline-variant bg-surface focus:border-primary focus:ring-0 text-body-lg"
                      placeholder="contact@org.com" />
                  </label>
                  <label class="block">
                    <span class="text-sm font-medium text-on-surface mb-1 block">Tél. org. <span class="text-on-surface-variant font-normal">(opt.)</span></span>
                    <input v-model="reg.organizationPhone" type="tel"
                      class="w-full h-11 px-4 rounded-xl border border-outline-variant bg-surface focus:border-primary focus:ring-0 text-body-lg"
                      placeholder="+33 1 23 45 67 89" />
                  </label>
                </div>
                <label class="block mt-3">
                  <span class="text-sm font-medium text-on-surface mb-1 block">Adresse <span class="text-on-surface-variant font-normal">(optionnel)</span></span>
                  <input v-model="reg.organizationAddress" type="text"
                    class="w-full h-11 px-4 rounded-xl border border-outline-variant bg-surface focus:border-primary focus:ring-0 text-body-lg"
                    placeholder="12 rue des Fleurs, Paris" />
                </label>
              </div>

              <p v-if="error" class="text-sm text-error flex items-center gap-1.5">
                <span class="material-symbols-outlined text-base">error</span>{{ error }}
              </p>

              <button
                type="submit" :disabled="loading"
                class="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl shadow-sm text-sm font-semibold text-white bg-primary hover:opacity-90 disabled:opacity-60 transition-colors"
              >
                <span v-if="loading" class="material-symbols-outlined animate-spin text-base">progress_activity</span>
                {{ loading ? 'Création…' : 'Créer mon compte' }}
              </button>
            </form>

            <p class="mt-4 text-sm text-on-surface-variant text-center">
              Vous avez déjà un compte ?
              <button type="button" class="font-semibold text-primary hover:underline" @click="mode = 'login'">Se connecter</button>
            </p>
          </template>

          <p class="mt-8 text-center text-xs text-on-surface-variant">© 2026 MariagePlus. Tous droits réservés.</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const mode = ref<'login' | 'register'>('login')

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
      error.value = e?.message || 'Identifiants invalides'
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
  loading.value = true
  try {
    await auth.register({
      firstName: r.firstName.trim(),
      lastName: r.lastName.trim(),
      email: r.email.trim(),
      phone: r.phone.trim() || undefined,
      password: r.password,
      organizationName: r.organizationName.trim(),
      organizationEmail: r.organizationEmail.trim() || undefined,
      organizationPhone: r.organizationPhone.trim() || undefined,
      organizationAddress: r.organizationAddress.trim() || undefined,
    })
    // POST /auth/register renvoie un LoginResponse → déjà connecté.
    router.replace('/dashboard')
  } catch (e: any) {
    error.value = e?.message || "Impossible de créer le compte (email peut-être déjà utilisé)"
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.bg-image-overlay {
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.82) 0%, rgba(15, 23, 42, 0.92) 100%),
    url('https://lh3.googleusercontent.com/aida-public/AB6AXuBz0JuiswFRQ2xNi4j7pz5PvBfcQ_QZdJG_waZCGAKPceCnMUSwgSaRyktuFS_kgHQf9RB4j7zQuLBoOPcbY_Ijy-xBIhscsWTknghalJEcTGxkjHjOT61tnFdIKEJkebgPbrqw3b5Su_zOsENO9zvZB8L1pl3070kbwGKx1Kadj-sl1kdBqrThE18q0b18IQiS1LCVXP734Va2EtEUdOEzlaQGzT0ClwiZ2XtVOYDTh3BfCkmTTrPgSZvHS4TldlYTRC0');
  background-size: cover;
  background-position: center;
}
</style>
