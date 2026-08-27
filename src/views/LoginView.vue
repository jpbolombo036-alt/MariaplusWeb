<template>
  <div class="min-h-screen flex items-center justify-center p-4 md:p-8 font-sans text-on-surface">
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

          <h2 class="text-2xl font-bold text-on-surface mb-1">Se connecter</h2>
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

            <p v-if="error" class="text-sm text-error">{{ error }}</p>

            <button
              type="submit" :disabled="loading"
              class="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl shadow-sm text-sm font-semibold text-white bg-primary hover:opacity-90 disabled:opacity-60 transition-colors"
            >
              {{ loading ? 'Connexion…' : 'Se connecter' }}
            </button>
          </form>

          <p class="mt-6 text-sm text-on-surface-variant text-center">
            Vous n'avez pas de compte ?
            <a class="font-medium text-primary" href="#">Contactez votre administrateur</a>
          </p>

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

onMounted(() => {
  if (auth.isAuthenticated) router.replace((route.query.redirect as string) || '/dashboard')
})

async function onSubmit() {
  loading.value = true
  error.value = ''
  try {
    await auth.login(email.value, password.value)
    router.replace((route.query.redirect as string) || '/dashboard')
  } catch (e: any) {
    error.value = e?.message || 'Identifiants invalides'
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
