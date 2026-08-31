<template>
  <div class="min-h-screen bg-background font-sans text-on-surface overflow-x-clip">
    <!-- ===== NAVBAR ===== -->
    <header class="sticky top-0 z-50 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/50">
      <div class="max-w-content mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <RouterLink to="/" class="flex items-center gap-2 group">
          <span class="w-9 h-9 rounded-xl overflow-hidden ring-1 ring-primary/20 grid place-items-center group-hover:scale-105 transition-transform">
            <img src="/logo.png" alt="MariagePlus" class="w-full h-full object-contain" />
          </span>
          <span class="text-lg font-bold tracking-tight">Mariage<span class="text-primary">Plus</span></span>
        </RouterLink>
        <nav class="hidden md:flex items-center gap-7 text-sm font-medium text-on-surface-variant">
          <RouterLink to="/" class="hover:text-primary transition-colors">Accueil</RouterLink>
          <RouterLink :to="{ hash: '#fonctionnalites' }" class="hover:text-primary transition-colors">Fonctionnalités</RouterLink>
          <RouterLink :to="{ hash: '#comment' }" class="hover:text-primary transition-colors">Comment ça marche</RouterLink>
          <RouterLink :to="{ hash: '#temoignages' }" class="hover:text-primary transition-colors">Témoignages</RouterLink>
          <RouterLink :to="{ hash: '#contact' }" class="hover:text-primary transition-colors">Contact</RouterLink>
        </nav>
        <div class="flex items-center gap-3">
          <button
            class="w-10 h-10 rounded-full grid place-items-center text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
            title="Thème sombre / clair"
            @click="themeStore.toggle()"
          >
            <span class="material-symbols-outlined text-[20px]">{{ themeStore.dark ? 'light_mode' : 'dark_mode' }}</span>
          </button>
          <RouterLink to="/login"
            class="px-5 h-10 rounded-full bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-semibold inline-flex items-center gap-1.5 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all">
            Se connecter <span class="material-symbols-outlined text-base">arrow_forward</span>
          </RouterLink>
        </div>
      </div>
    </header>

    <!-- ===== HERO ===== -->
    <section class="relative isolate overflow-hidden">
      <!-- Fond dégradé vivant -->
      <div class="absolute inset-0 -z-20 bg-gradient-to-br from-primary-light via-background to-surface"></div>
      <!-- Blobs colorés -->
      <div class="absolute -top-24 -left-24 w-96 h-96 -z-10 rounded-full blur-3xl opacity-40 animate-float-slow"
        style="background: radial-gradient(circle, #5b2ecc 0%, transparent 65%)"></div>
      <div class="absolute top-40 -right-32 w-[28rem] h-[28rem] -z-10 rounded-full blur-3xl opacity-30 animate-float-slower"
        style="background: radial-gradient(circle, #8b5cf6 0%, transparent 65%)"></div>
      <div class="absolute bottom-0 left-1/3 w-80 h-80 -z-10 rounded-full blur-3xl opacity-20 animate-float-slow"
        style="background: radial-gradient(circle, #f4a340 0%, transparent 65%)"></div>

      <div class="relative max-w-content mx-auto px-4 md:px-8 pt-16 md:pt-24 pb-20 text-center">
        <span class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-7 ring-1 ring-primary/20">
          <span class="material-symbols-outlined text-base">auto_awesome</span> La gestion d'événements simplifiée
        </span>

        <h1 class="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] max-w-4xl mx-auto">
          <span class="block">Organisez des</span>
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-dark to-primary">événements d'exception</span>
          <span class="block">avec <span class="relative inline-block">élégance
            <svg class="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none"><path d="M2 10C60 3 140 3 198 9" stroke="#5b2ecc" stroke-width="4" stroke-linecap="round"/></svg>
          </span></span>
        </h1>

        <p class="mt-7 text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
          Invitations digitales, RSVP en temps réel, check-in par QR code et suivi complet de vos invités — tout au même endroit.
        </p>

        <div class="mt-10 flex flex-wrap justify-center gap-4">
          <a href="/login" class="group px-8 h-12 rounded-full bg-gradient-to-r from-primary to-primary-dark text-white font-semibold inline-flex items-center gap-2 shadow-xl shadow-primary/30 hover:shadow-primary/45 hover:-translate-y-0.5 transition-all">
            Commencer gratuitement <span class="material-symbols-outlined text-lg group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
          </a>
          <a href="#comment" class="px-8 h-12 rounded-full border-2 border-primary/30 text-primary font-semibold inline-flex items-center gap-2 bg-primary-light/30 hover:bg-primary-light/60 transition-colors">
            <span class="material-symbols-outlined text-lg">play_circle</span> Découvrir
          </a>
        </div>

        <!-- Stats -->
        <div class="mt-16 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
          <div v-for="s in stats" :key="s.label" class="flex flex-col items-center rounded-2xl bg-white/70 backdrop-blur border border-outline-variant/40 py-5 shadow-soft">
            <span class="text-3xl md:text-4xl font-extrabold text-primary">{{ s.value }}</span>
            <span class="text-sm text-on-surface-variant mt-1">{{ s.label }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== FEATURES ===== -->
    <section id="fonctionnalites" class="max-w-content mx-auto px-4 md:px-8 py-20">
      <div class="text-center mb-14">
        <span class="text-sm font-semibold text-primary uppercase tracking-widest">Fonctionnalités</span>
        <h2 class="mt-3 text-3xl md:text-5xl font-extrabold">Pensé pour chaque étape</h2>
        <p class="text-on-surface-variant mt-3 max-w-xl mx-auto">Du premier invité à l'enregistrement le jour J, tout est réuni dans une plateforme claire.</p>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="(f, i) in features" :key="f.title"
          class="reveal rounded-2xl bg-white border border-outline-variant/40 p-7 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all duration-300"
          :style="{ transitionDelay: (i * 60) + 'ms' }">
          <div class="w-12 h-12 rounded-xl grid place-items-center mb-5" :class="f.bg">
            <span class="material-symbols-outlined" :class="f.color">{{ f.icon }}</span>
          </div>
          <h3 class="text-lg font-bold mb-2">{{ f.title }}</h3>
          <p class="text-sm text-on-surface-variant leading-relaxed">{{ f.desc }}</p>
        </div>
      </div>
    </section>

    <!-- ===== COMMENT ÇA MARCHE ===== -->
    <section id="comment" class="bg-surface-container-low/60 border-y border-outline-variant/40 py-20">
      <div class="max-w-content mx-auto px-4 md:px-8">
        <div class="text-center mb-14">
          <span class="text-sm font-semibold text-primary uppercase tracking-widest">Comment ça marche</span>
          <h2 class="mt-3 text-3xl md:text-4xl font-extrabold">3 étapes vers un événement réussi</h2>
        </div>
        <div class="grid md:grid-cols-3 gap-8">
          <div v-for="(s, i) in steps" :key="s.title" class="relative reveal text-center">
            <div class="relative inline-flex w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white items-center justify-center shadow-xl shadow-primary/25 mb-5">
              <span class="material-symbols-outlined text-3xl">{{ s.icon }}</span>
              <span class="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white border border-outline-variant text-primary text-sm font-bold flex items-center justify-center shadow-sm">{{ i + 1 }}</span>
            </div>
            <h3 class="text-lg font-bold">{{ s.title }}</h3>
            <p class="text-sm text-on-surface-variant mt-2 max-w-xs mx-auto">{{ s.desc }}</p>
          </div>
        </div>
      </div>
    </section>


    <!-- ===== TÉMOIGNAGES ===== -->
    <section id="temoignages" class="max-w-content mx-auto px-4 md:px-8 py-20">
      <div class="text-center mb-14">
        <span class="text-sm font-semibold text-primary uppercase tracking-widest">Ils nous font confiance</span>
        <h2 class="mt-3 text-3xl md:text-4xl font-extrabold">Des événements inoubliables</h2>
      </div>
      <div class="grid md:grid-cols-3 gap-6">
        <div v-for="t in testimonials" :key="t.name" class="reveal rounded-2xl bg-white border border-outline-variant/40 p-7 shadow-soft hover:shadow-card transition-all duration-300">
          <div class="text-amber-400 mb-3 text-lg">★★★★★</div>
          <p class="text-sm text-on-surface-variant italic leading-relaxed">“{{ t.text }}”</p>
          <div class="mt-5 flex items-center gap-3">
            <span class="w-10 h-10 rounded-lg grid place-items-center text-sm font-bold text-white" :style="{ background: t.color }">{{ t.initials }}</span>
            <div>
              <div class="font-semibold text-sm">{{ t.name }}</div>
              <div class="text-xs text-on-surface-variant">{{ t.role }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== CTA ===== -->
    <section id="contact" class="max-w-content mx-auto px-4 md:px-8 pb-20">
      <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-dark to-[#2a1066] text-white p-10 md:p-16 text-center shadow-2xl shadow-primary/30">
        <div class="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-white/10 blur-2xl"></div>
        <div class="absolute -bottom-20 -left-10 w-80 h-80 rounded-full bg-fuchsia-400/20 blur-2xl"></div>
        <span class="material-symbols-outlined text-5xl mb-4 relative">celebration</span>
        <h2 class="text-3xl md:text-4xl font-extrabold relative">Prêt à célébrer en toute sérénité ?</h2>
        <p class="mt-4 text-white/80 max-w-xl mx-auto relative">Rejoignez MariagePlus et prenez le contrôle de vos événements dès aujourd'hui.</p>
        <RouterLink to="/login" class="mt-8 inline-flex items-center gap-2 px-8 h-12 rounded-full bg-white text-primary-dark font-bold shadow-lg hover:shadow-2xl hover:-translate-y-0.5 transition-all relative">
          Créer mon espace <span class="material-symbols-outlined">arrow_forward</span>
        </RouterLink>

        <!-- Contacts -->
        <div class="mt-8 flex flex-wrap items-center justify-center gap-6 text-white/90 relative">
          <a href="tel:+243847381745" class="inline-flex items-center gap-2 text-sm font-medium hover:text-white transition-colors">
            <span class="material-symbols-outlined text-lg">call</span>
            +243 847 381 745
          </a>
          <span class="w-1 h-1 rounded-full bg-white/50"></span>
          <a href="https://www.facebook.com/EventiaEasy" target="_blank" rel="noopener"
             class="inline-flex items-center gap-2 text-sm font-medium hover:text-white transition-colors">
            <span class="material-symbols-outlined text-lg">thumb_up</span>
            Facebook · EventiaEasy
          </a>
        </div>
      </div>
    </section>

    <!-- ===== FOOTER ===== -->
    <footer class="border-t border-outline-variant/40 bg-surface-container-low/40">
      <div class="max-w-content mx-auto px-4 md:px-8 py-10">
        <div class="flex flex-col md:flex-row items-center justify-between gap-6">
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-lg overflow-hidden ring-1 ring-primary/20 grid place-items-center"><img src="/logo.png" alt="MariagePlus" class="w-full h-full object-contain" /></span>
            <span class="font-bold">Mariage<span class="text-primary">Plus</span></span>
          </div>

          <!-- Contacts -->
          <div class="flex flex-wrap items-center justify-center gap-5 text-sm text-on-surface-variant">
            <a href="tel:+243847381745"
               class="inline-flex items-center gap-1.5 hover:text-primary transition-colors">
              <span class="material-symbols-outlined text-base">call</span>
              +243 847 381 745
            </a>
            <a href="https://www.facebook.com/EventiaEasy" target="_blank" rel="noopener"
               class="inline-flex items-center gap-1.5 hover:text-primary transition-colors">
              <span class="material-symbols-outlined text-base">thumb_up</span>
              Facebook · EventiaEasy
            </a>
          </div>

          <div class="text-sm text-on-surface-variant">© 2026 MariagePlus. Tous droits réservés.</div>
        </div>
      </div>
    </footer>
  </div>
</template>


<script setup lang="ts">
import { onMounted } from 'vue'
import { useThemeStore } from '../stores/theme'

const themeStore = useThemeStore()

const stats = [
  { value: '500+', label: 'Événements organisés' },
  { value: '50k+', label: 'Invités gérés' },
  { value: '98%', label: 'Satisfaction' },
]

const features = [
  { icon: 'mail', title: 'Invitations digitales', desc: 'Créez, envoyez et suivez vos invitations par email ou lien, avec relances automatisées.', bg: 'bg-primary-light', color: 'text-primary' },
  { icon: 'pie_chart', title: 'Analytique RSVP', desc: 'Tableaux de bord visuels pour suivre les réponses et anticiper le jour J.', bg: 'bg-green-50', color: 'text-green-600' },
  { icon: 'qr_code_scanner', title: 'Check-in fluide', desc: 'Scannez les QR codes à l’entrée et synchronisez en temps réel multi-appareils.', bg: 'bg-blue-50', color: 'text-blue-600' },
  { icon: 'table_restaurant', title: 'Placement des tables', desc: 'Affectez vos invités aux tables et visualisez la capacité en un coup d’œil.', bg: 'bg-amber-50', color: 'text-amber-600' },
  { icon: 'group', title: 'Gestion des invités', desc: 'Importez, catégorisez et suivez chaque invité avec ses accompagnants.', bg: 'bg-primary-light', color: 'text-primary' },
  { icon: 'auto_awesome', title: 'Expérience premium', desc: 'Une interface élégante et moderne pensée pour impressionner vos invités.', bg: 'bg-fuchsia-50', color: 'text-fuchsia-600' },
]

const steps = [
  { icon: 'add_circle', title: 'Créez votre événement', desc: 'Renseignez les informations clés de votre mariage ou événement en quelques minutes.' },
  { icon: 'send', title: 'Invitez vos convives', desc: 'Envoyez des invitations digitales et relancez automatiquement les absents.' },
  { icon: 'celebration', title: 'Célébrez en confiance', desc: 'Gérez le RSVP, le check-in et le placement le jour J en temps réel.' },
]

const testimonials = [
  { initials: 'SG', name: 'Sophie & David', role: 'Mariage · Lyon', text: 'MariagePlus nous a simplifié toute l’organisation. Le suivi RSVP est génial, nos 180 invités ont tout géré en ligne.', color: 'linear-gradient(135deg,#5b2ecc,#8b5cf6)' },
  { initials: 'KM', name: 'Kevin M.', role: 'Wedding planner', text: 'La plateforme la plus complète que j’ai utilisée : invitations, tables, check-in. Mes clients sont conquis.', color: 'linear-gradient(135deg,#176b5b,#2dd4a7)' },
  { initials: 'AL', name: 'Alexia L.', role: 'Événement privé', text: 'Interface magnifique et intuitive. Le QR code à l’entrée a fluidifié toute la réception.', color: 'linear-gradient(135deg,#f4a340,#fbbf24)' },
]

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('revealed')
          observer.unobserve(e.target)
        }
      })
    },
    { threshold: 0.12 },
  )
  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el))
})
</script>

<style scoped>
.reveal {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.reveal.revealed {
  opacity: 1;
  transform: translateY(0);
}
@keyframes floatSlow {
  0%, 100% { transform: translateY(0) translateX(0); }
  50% { transform: translateY(-20px) translateX(10px); }
}
@keyframes floatSlower {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-30px); }
}
.animate-float-slow {
  animation: floatSlow 8s ease-in-out infinite;
}
.animate-float-slower {
  animation: floatSlower 12s ease-in-out infinite;
}
</style>

