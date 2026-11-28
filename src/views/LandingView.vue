<template>
  <div class="min-h-screen bg-background font-sans text-on-surface overflow-x-clip">
    <!-- ===== Bouton WhatsApp ===== -->
    <a
      v-if="whatsappUrl"
      :href="whatsappUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="fixed bottom-5 right-5 z-[60] h-14 w-14 rounded-full bg-[#25D366] text-white grid place-items-center shadow-lg shadow-black/20 hover:scale-105 transition-transform"
      aria-label="Écrire à EventiaEasy sur WhatsApp"
    >
      <WhatsappIcon class="w-7 h-7" />
    </a>

    <!-- ===== Navigation ===== -->
    <header class="sticky top-0 z-50 bg-background/85 backdrop-blur border-b border-outline-variant" @keydown.esc="closeMobileMenu">
      <div class="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        <RouterLink to="/" class="flex items-center gap-2.5 shrink-0">
          <img src="/logo.png" alt="" class="w-9 h-9 rounded-lg object-contain ring-1 ring-outline-variant" />
          <span class="text-lg font-bold tracking-tight">Eventia<span class="text-primary">Easy</span></span>
        </RouterLink>
        <nav class="hidden lg:flex items-center gap-7 text-[14px] font-medium text-on-surface-variant" aria-label="Sections">
          <a v-for="s in sections" :key="s.hash" :href="s.hash" class="hover:text-on-surface transition-colors">{{ s.label }}</a>
        </nav>
        <div class="flex items-center gap-2">
          <button
            class="w-10 h-10 rounded-lg grid place-items-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            type="button"
            :aria-label="themeStore.dark ? 'Activer le mode clair' : 'Activer le mode sombre'"
            :aria-pressed="themeStore.dark"
            @click="themeStore.toggle()"
          >
            <span aria-hidden="true" class="material-symbols-outlined text-[20px]">{{ themeStore.dark ? 'light_mode' : 'dark_mode' }}</span>
          </button>
          <RouterLink to="/login" class="hidden sm:inline-flex h-10 px-4 rounded-lg text-[14px] font-semibold items-center hover:bg-surface-container transition-colors">
            Se connecter
          </RouterLink>
          <RouterLink to="/login?mode=register" class="hidden sm:inline-flex h-10 px-4 rounded-lg bg-primary text-white text-[14px] font-semibold items-center hover:bg-primary-dark transition-colors">
            Créer mon espace
          </RouterLink>
          <button
            ref="mobileMenuButton"
            type="button"
            class="lg:hidden w-10 h-10 rounded-lg grid place-items-center hover:bg-surface-container"
            :aria-label="mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'"
            :aria-expanded="mobileMenuOpen"
            aria-controls="landing-mobile-menu"
            @click="mobileMenuOpen = !mobileMenuOpen"
          >
            <span aria-hidden="true" class="material-symbols-outlined">{{ mobileMenuOpen ? 'close' : 'menu' }}</span>
          </button>
        </div>
      </div>
      <nav v-if="mobileMenuOpen" id="landing-mobile-menu" aria-label="Navigation mobile" class="lg:hidden px-4 py-3 border-t border-outline-variant bg-background flex flex-col">
        <a v-for="s in sections" :key="s.hash" :href="s.hash" class="px-3 py-3 rounded-lg text-[15px] font-medium hover:bg-surface-container" @click="closeMobileMenu">{{ s.label }}</a>
        <RouterLink to="/login" class="px-3 py-3 rounded-lg text-[15px] font-semibold" @click="closeMobileMenu">Se connecter</RouterLink>
        <RouterLink to="/login?mode=register" class="mt-1 px-3 py-3 rounded-lg text-[15px] font-semibold bg-primary text-white text-center" @click="closeMobileMenu">Créer mon espace</RouterLink>
      </nav>
    </header>

    <main>
      <!-- ===== Accroche ===== -->
      <section class="max-w-6xl mx-auto px-4 md:px-6 pt-14 md:pt-20 pb-16 grid lg:grid-cols-[1.05fr_1fr] gap-12 items-center">
        <div>
          <p class="inline-flex items-center gap-2 text-[13px] font-semibold text-primary bg-primary-light rounded-full px-3 py-1">
            <span class="material-symbols-outlined text-[16px]" aria-hidden="true">location_on</span>
            Conçu en RD Congo, pour les événements d'ici
          </p>
          <h1 class="mt-5 text-[34px] leading-[1.1] md:text-5xl md:leading-[1.08] font-extrabold tracking-tight">
            Vos invitations, vos invités et votre salle de fête, gérés au même endroit.
          </h1>
          <p class="mt-5 text-[17px] leading-relaxed text-on-surface-variant max-w-xl">
            EventiaEasy envoie vos invitations par WhatsApp, recueille les réponses de vos invités, contrôle l'entrée par QR code
            le jour&nbsp;J — et aide les salles de fête à tenir leurs réservations et leur caisse.
          </p>
          <div class="mt-8 flex flex-wrap gap-3">
            <RouterLink to="/login?mode=register" class="h-12 px-6 rounded-lg bg-primary text-white font-semibold inline-flex items-center gap-2 hover:bg-primary-dark transition-colors">
              Créer mon espace
              <span class="material-symbols-outlined text-[20px]" aria-hidden="true">arrow_forward</span>
            </RouterLink>
            <a v-if="whatsappUrl" :href="whatsappUrl" target="_blank" rel="noopener noreferrer"
              class="h-12 px-6 rounded-lg border border-outline-variant bg-surface-container-lowest font-semibold inline-flex items-center gap-2 hover:border-primary/50 transition-colors">
              <WhatsappIcon class="w-5 h-5 text-[#25D366]" />
              Parler à l'équipe
            </a>
          </div>
          <ul class="mt-8 grid sm:grid-cols-3 gap-3 text-[13px] text-on-surface-variant">
            <li v-for="p in proofs" :key="p" class="flex items-start gap-2">
              <span class="material-symbols-outlined text-[18px] text-success" aria-hidden="true">check_circle</span>
              {{ p }}
            </li>
          </ul>
        </div>

        <!-- Illustration produit (exemple) -->
        <div class="relative" aria-label="Aperçu de l'invitation et des réponses (exemple)">
          <div class="rounded-2xl overflow-hidden border border-outline-variant shadow-xl shadow-black/10 aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5]">
            <img src="/images/invitations/preview-reception.jpg" alt="Table de réception dressée pour un mariage" class="w-full h-full object-cover" />
          </div>
          <div class="absolute left-3 sm:-left-6 top-6 w-[230px] rounded-xl bg-surface-container-lowest border border-outline-variant shadow-lg p-4">
            <p class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Invitation · exemple</p>
            <p class="mt-1 text-[17px] font-bold">Grace &amp; Patrick</p>
            <p class="text-[12.5px] text-on-surface-variant">Samedi 20 mars · 14 h · Bukavu</p>
            <div class="mt-3 flex gap-2">
              <span class="flex-1 h-8 rounded-md bg-primary text-white text-[12px] font-semibold grid place-items-center">Je serai là</span>
              <span class="flex-1 h-8 rounded-md border border-outline-variant text-[12px] font-semibold grid place-items-center">Je ne peux pas</span>
            </div>
          </div>
          <div class="absolute right-3 sm:-right-5 bottom-8 w-[220px] rounded-xl bg-surface-container-lowest border border-outline-variant shadow-lg p-4">
            <div class="flex items-center gap-2">
              <span class="w-8 h-8 rounded-full bg-success-light text-success grid place-items-center">
                <span class="material-symbols-outlined text-[18px]" aria-hidden="true">how_to_reg</span>
              </span>
              <div class="min-w-0">
                <p class="text-[13px] font-semibold">Réponse reçue</p>
                <p class="text-[12px] text-on-surface-variant">2 personnes · Jus d'orange</p>
              </div>
            </div>
            <div class="mt-3 flex items-center gap-2 text-[12px] text-on-surface-variant">
              <span class="material-symbols-outlined text-[16px]" aria-hidden="true">qr_code_2</span>
              QR code d'entrée envoyé
            </div>
          </div>
        </div>
      </section>

      <!-- ===== Pour qui ===== -->
      <section class="border-y border-outline-variant bg-surface-container-low">
        <div class="max-w-6xl mx-auto px-4 md:px-6 py-16">
          <h2 class="text-2xl md:text-3xl font-extrabold tracking-tight">Pour qui ?</h2>
          <div class="mt-8 grid md:grid-cols-3 gap-5">
            <article v-for="a in audiences" :key="a.title" class="rounded-xl bg-surface-container-lowest border border-outline-variant p-6">
              <span class="w-11 h-11 rounded-lg bg-primary-light text-primary grid place-items-center">
                <span class="material-symbols-outlined" aria-hidden="true">{{ a.icon }}</span>
              </span>
              <h3 class="mt-4 text-[17px] font-bold">{{ a.title }}</h3>
              <p class="mt-2 text-[14px] leading-relaxed text-on-surface-variant">{{ a.text }}</p>
            </article>
          </div>
        </div>
      </section>

      <!-- ===== Fonctionnalités événements ===== -->
      <section id="fonctionnalites" class="max-w-6xl mx-auto px-4 md:px-6 py-20 scroll-mt-20">
        <div class="max-w-2xl">
          <p class="text-[13px] font-semibold uppercase tracking-wider text-primary">Événements</p>
          <h2 class="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">De l'invitation jusqu'à l'entrée de la salle</h2>
          <p class="mt-3 text-[16px] text-on-surface-variant">Mariages, anniversaires, baptêmes, collations, remises de diplôme : chaque étape est couverte.</p>
        </div>
        <div class="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
          <article v-for="f in features" :key="f.title">
            <span class="material-symbols-outlined text-[28px] text-primary" aria-hidden="true">{{ f.icon }}</span>
            <h3 class="mt-3 text-[17px] font-bold">{{ f.title }}</h3>
            <p class="mt-2 text-[14px] leading-relaxed text-on-surface-variant">{{ f.text }}</p>
          </article>
        </div>
      </section>

      <!-- ===== Module Salles ===== -->
      <section id="salles" class="bg-[#14161d] text-white scroll-mt-16">
        <div class="max-w-6xl mx-auto px-4 md:px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p class="text-[13px] font-semibold uppercase tracking-wider text-[#b9a5ff]">Salles de fête</p>
            <h2 class="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">Réservations, paiements et caisse de votre salle</h2>
            <p class="mt-3 text-[16px] text-white/70">
              Un espace dédié aux gérants et à leurs caissiers, pensé pour la réalité des salles en RDC : dollars et francs congolais, Mobile Money,
              acomptes et soldes.
            </p>
            <ul class="mt-8 space-y-4">
              <li v-for="v in venueFeatures" :key="v.title" class="flex gap-3">
                <span class="material-symbols-outlined text-[22px] text-[#b9a5ff] shrink-0" aria-hidden="true">{{ v.icon }}</span>
                <div>
                  <p class="font-semibold">{{ v.title }}</p>
                  <p class="text-[14px] text-white/65 leading-relaxed">{{ v.text }}</p>
                </div>
              </li>
            </ul>
          </div>

          <!-- Illustration : fiche de réservation (exemple) -->
          <div class="rounded-2xl bg-[#1d2029] border border-white/10 p-5 sm:p-6 shadow-2xl" aria-label="Aperçu d'une réservation de salle (exemple)">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-[12px] text-white/50">Réservation · exemple</p>
                <p class="text-[18px] font-bold">Salle principale · samedi 20 mars</p>
              </div>
              <span class="rounded-full bg-[#34d399]/15 text-[#34d399] text-[12px] font-bold px-2.5 py-1">Confirmée</span>
            </div>
            <div class="mt-5 grid grid-cols-3 gap-3">
              <div v-for="m in bookingSample" :key="m.label" class="rounded-lg bg-white/5 p-3">
                <p class="text-[11.5px] text-white/50">{{ m.label }}</p>
                <p class="text-[15px] font-bold" :class="m.tone">{{ m.value }}</p>
              </div>
            </div>
            <div class="mt-5 divide-y divide-white/10 text-[13px]">
              <div v-for="p in paymentSample" :key="p.ref" class="py-2.5 flex items-center justify-between gap-3">
                <span class="text-white/70">{{ p.ref }} · {{ p.method }}</span>
                <span class="font-semibold">{{ p.amount }}</span>
              </div>
            </div>
            <p class="mt-4 text-[12px] text-white/50">Reçus et devis PDF à votre en-tête : logo, RCCM, Id. Nat., NIF.</p>
          </div>
        </div>
      </section>

      <!-- ===== Comment ça marche ===== -->
      <section id="comment" class="max-w-6xl mx-auto px-4 md:px-6 py-20 scroll-mt-20">
        <h2 class="text-3xl md:text-4xl font-extrabold tracking-tight">Comment ça marche</h2>
        <ol class="mt-10 grid md:grid-cols-4 gap-8">
          <li v-for="(s, i) in steps" :key="s.title">
            <span class="w-9 h-9 rounded-full border-2 border-primary text-primary font-bold grid place-items-center">{{ i + 1 }}</span>
            <h3 class="mt-4 text-[17px] font-bold">{{ s.title }}</h3>
            <p class="mt-2 text-[14px] leading-relaxed text-on-surface-variant">{{ s.text }}</p>
          </li>
        </ol>
      </section>

      <!-- ===== Questions fréquentes ===== -->
      <section id="questions" class="border-t border-outline-variant bg-surface-container-low scroll-mt-16">
        <div class="max-w-3xl mx-auto px-4 md:px-6 py-20">
          <h2 class="text-3xl md:text-4xl font-extrabold tracking-tight">Questions fréquentes</h2>
          <div class="mt-8 divide-y divide-outline-variant border-y border-outline-variant">
            <details v-for="q in faq" :key="q.q" class="group py-4">
              <summary class="flex items-center justify-between gap-4 cursor-pointer list-none font-semibold text-[16px]">
                {{ q.q }}
                <span class="material-symbols-outlined text-on-surface-variant transition-transform group-open:rotate-45" aria-hidden="true">add</span>
              </summary>
              <p class="mt-3 text-[15px] leading-relaxed text-on-surface-variant">{{ q.a }}</p>
            </details>
          </div>
        </div>
      </section>

      <!-- ===== Contact ===== -->
      <section id="contact" class="max-w-6xl mx-auto px-4 md:px-6 py-20 scroll-mt-20">
        <div class="rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 md:p-12 grid md:grid-cols-[1.3fr_1fr] gap-10 items-center">
          <div>
            <h2 class="text-3xl md:text-4xl font-extrabold tracking-tight">Parlons de votre prochain événement</h2>
            <p class="mt-3 text-[16px] text-on-surface-variant">
              Créez votre espace, puis notre équipe l'active et vous accompagne pour vos premières invitations ou la mise en place de votre salle.
            </p>
            <RouterLink to="/login?mode=register" class="mt-7 h-12 px-6 rounded-lg bg-primary text-white font-semibold inline-flex items-center gap-2 hover:bg-primary-dark transition-colors">
              Créer mon espace
              <span class="material-symbols-outlined text-[20px]" aria-hidden="true">arrow_forward</span>
            </RouterLink>
          </div>
          <ul class="space-y-3 text-[15px]">
            <li v-if="whatsappUrl">
              <a :href="whatsappUrl" target="_blank" rel="noopener noreferrer" class="flex items-center gap-3 rounded-lg border border-outline-variant p-4 hover:border-primary/50 transition-colors">
                <WhatsappIcon class="w-6 h-6 text-[#25D366]" />
                <span><span class="block font-semibold">WhatsApp</span><span class="text-on-surface-variant">{{ phoneLabel }}</span></span>
              </a>
            </li>
            <li>
              <a :href="`tel:${phoneTel}`" class="flex items-center gap-3 rounded-lg border border-outline-variant p-4 hover:border-primary/50 transition-colors">
                <span class="material-symbols-outlined text-primary" aria-hidden="true">call</span>
                <span><span class="block font-semibold">Téléphone</span><span class="text-on-surface-variant">{{ phoneLabel }}</span></span>
              </a>
            </li>
            <li>
              <a href="https://www.facebook.com/EventiaEasy" target="_blank" rel="noopener noreferrer" class="flex items-center gap-3 rounded-lg border border-outline-variant p-4 hover:border-primary/50 transition-colors">
                <span class="material-symbols-outlined text-primary" aria-hidden="true">public</span>
                <span><span class="block font-semibold">Facebook</span><span class="text-on-surface-variant">EventiaEasy</span></span>
              </a>
            </li>
          </ul>
        </div>
      </section>
    </main>

    <!-- ===== Pied de page ===== -->
    <footer class="border-t border-outline-variant">
      <div class="max-w-6xl mx-auto px-4 md:px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[13px] text-on-surface-variant">
        <div class="flex items-center gap-2">
          <img src="/logo.png" alt="" class="w-7 h-7 rounded-md object-contain" />
          <span class="font-semibold text-on-surface">Eventia<span class="text-primary">Easy</span></span>
          <span>· Gestion d'événements et de salles de fête</span>
        </div>
        <nav class="flex flex-wrap justify-center gap-5" aria-label="Pied de page">
          <a v-for="s in sections" :key="s.hash" :href="s.hash" class="hover:text-on-surface">{{ s.label }}</a>
          <RouterLink to="/login" class="hover:text-on-surface">Se connecter</RouterLink>
        </nav>
        <span>© {{ year }} EventiaEasy</span>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useThemeStore } from '../stores/theme'
import { ApiConfig } from '../api/config'
import WhatsappIcon from '../components/common/WhatsappIcon.vue'

const themeStore = useThemeStore()
const mobileMenuOpen = ref(false)
const mobileMenuButton = ref<HTMLButtonElement | null>(null)
const year = new Date().getFullYear()

function closeMobileMenu() {
  mobileMenuOpen.value = false
  mobileMenuButton.value?.focus()
}

const sections = [
  { label: 'Fonctionnalités', hash: '#fonctionnalites' },
  { label: 'Salles de fête', hash: '#salles' },
  { label: 'Comment ça marche', hash: '#comment' },
  { label: 'Questions', hash: '#questions' },
  { label: 'Contact', hash: '#contact' },
]

// Numéro de la plateforme (lien wa.me) : configurable, masqué si absent.
const contactNumber = ApiConfig.whatsappContactNumber
const whatsappUrl = contactNumber
  ? `https://wa.me/${contactNumber}?text=${encodeURIComponent("Bonjour EventiaEasy, je souhaite avoir plus d'informations.")}`
  : ''
const phoneTel = `+${contactNumber || '243847381745'}`
/** « +243 847 381 745 » à partir de « 243847381745 ». */
const phoneLabel = phoneTel.replace(/^\+(\d{3})(\d{3})(\d{3})(\d{3})$/, '+$1 $2 $3 $4')

const proofs = [
  'Invitations envoyées par WhatsApp',
  'Contrôle d’entrée par QR code, même sans internet',
  'Dollars et francs congolais',
]

const audiences = [
  {
    icon: 'favorite',
    title: 'Familles et mariés',
    text: 'Préparez votre liste d’invités, envoyez les invitations et suivez qui vient, avec combien d’accompagnants.',
  },
  {
    icon: 'groups',
    title: 'Organisateurs d’événements',
    text: 'Gérez plusieurs événements et répartissez le travail : gestionnaires d’invités et agents d’accueil n’accèdent qu’à l’événement qui leur est confié.',
  },
  {
    icon: 'storefront',
    title: 'Salles de fête',
    text: 'Tenez le calendrier de vos salles, encaissez les acomptes, suivez les impayés et la caisse de chacun de vos caissiers.',
  },
]

const features = [
  {
    icon: 'mark_email_read',
    title: 'Invitations par WhatsApp',
    text: 'Chaque invité reçoit son invitation personnelle sur WhatsApp, avec un lien vers sa carte. Vous voyez qui l’a ouverte, et pouvez relancer.',
  },
  {
    icon: 'style',
    title: 'Cartes d’invitation soignées',
    text: 'Trois modèles de carte, photos du couple, message, programme, lieu avec carte, et couleurs de tenue demandées.',
  },
  {
    icon: 'how_to_reg',
    title: 'Réponses en ligne',
    text: 'L’invité confirme ou décline, indique le nombre de personnes, choisit sa boisson et vous laisse un mot — sans créer de compte.',
  },
  {
    icon: 'qr_code_scanner',
    title: 'Check-in par QR code',
    text: 'À l’entrée, l’agent scanne le QR code de l’invitation. Le scan fonctionne hors connexion et se synchronise ensuite, sans doublon.',
  },
  {
    icon: 'table_restaurant',
    title: 'Tables et placement',
    text: 'Créez vos tables, placez les invités selon la capacité de chaque table et retrouvez le plan le jour J.',
  },
  {
    icon: 'upload_file',
    title: 'Liste d’invités et catégories',
    text: 'Ajoutez vos invités un par un ou importez un fichier Excel ou CSV, puis classez-les par catégorie (famille, amis, collègues…).',
  },
  {
    icon: 'photo_library',
    title: 'Galerie photo',
    text: 'Partagez les photos de l’événement avec vos invités, sur la même page que leur invitation.',
  },
  {
    icon: 'notifications_active',
    title: 'Rappels automatiques',
    text: 'L’application vous rappelle les événements qui approchent, et peut relancer les invités qui n’ont pas encore répondu.',
  },
  {
    icon: 'insights',
    title: 'Statistiques et exports',
    text: 'Réponses, présents, placements par catégorie : tout est suivi en direct et exportable en Excel ou en PDF.',
  },
]

const venueFeatures = [
  {
    icon: 'event_available',
    title: 'Calendrier sans double réservation',
    text: 'Options avec date limite, confirmations, plusieurs salles : un créneau déjà pris ne peut pas être réservé une seconde fois.',
  },
  {
    icon: 'payments',
    title: 'Paiements en USD et en CDF',
    text: 'Espèces, M-Pesa, Orange Money, Airtel Money ou virement, au taux du jour que vous fixez. Le reste à payer est calculé pour vous.',
  },
  {
    icon: 'point_of_sale',
    title: 'Caissiers et contrôle de caisse',
    text: 'Vos caissiers encaissent et impriment les reçus ; vous voyez ce que chacun a encaissé, en espèces et en Mobile Money.',
  },
  {
    icon: 'receipt_long',
    title: 'Devis, reçus et remboursements',
    text: 'Documents PDF à votre en-tête, remboursement total ou partiel à l’annulation, tableau de bord des encaissements et des impayés.',
  },
]

const bookingSample = [
  { label: 'Total', value: '2 500 USD', tone: '' },
  { label: 'Payé', value: '1 500 USD', tone: 'text-[#34d399]' },
  { label: 'Reste', value: '1 000 USD', tone: 'text-[#f87171]' },
]

const paymentSample = [
  { ref: 'REC-00012', method: 'Espèces', amount: '1 000,00 USD' },
  { ref: 'REC-00013', method: 'M-Pesa', amount: '1 400 000,00 CDF' },
]

const steps = [
  { title: 'Créez votre espace', text: 'Inscription en quelques minutes avec votre nom, votre email et le nom de votre organisation.' },
  { title: 'Activation par notre équipe', text: 'Nous activons votre espace et les modules dont vous avez besoin, puis vous guidons pour démarrer.' },
  { title: 'Invitez ou réservez', text: 'Ajoutez vos invités et envoyez les invitations, ou enregistrez vos réservations et paiements de salle.' },
  { title: 'Le jour J', text: 'Vos agents scannent les QR codes à l’entrée ; vous suivez les arrivées et le placement en direct.' },
]

const faq = [
  {
    q: 'Mes invités doivent-ils installer une application ?',
    a: 'Non. Ils reçoivent un lien sur WhatsApp et répondent depuis leur téléphone, dans le navigateur, sans créer de compte.',
  },
  {
    q: 'Comment les invitations sont-elles envoyées ?',
    a: 'Par WhatsApp, à chaque invité, avec son lien personnel. Vous pouvez aussi copier le lien d’une invitation pour la partager vous-même.',
  },
  {
    q: 'Le contrôle à l’entrée fonctionne-t-il sans internet ?',
    a: 'Oui. L’agent d’accueil peut scanner hors connexion ; les entrées sont synchronisées dès le retour du réseau, sans compter deux fois le même invité.',
  },
  {
    q: 'Puis-je confier une partie du travail à mon équipe ?',
    a: 'Oui. Vous ajoutez des gestionnaires d’invités et des agents d’accueil, chacun limité à l’événement qui lui est confié, et des caissiers pour votre salle. Chacun ne voit que ce dont il a besoin.',
  },
  {
    q: 'Je gère une salle de fête : qu’est-ce que le module Salles ?',
    a: 'Un espace pour vos salles, vos clients, vos réservations et vos encaissements en USD et en CDF, avec devis, reçus, remboursements et suivi de la caisse. Il est activé par notre équipe à votre demande.',
  },
  {
    q: 'Comment démarrer ?',
    a: 'Créez votre espace, puis contactez-nous sur WhatsApp ou par téléphone : nous activons votre compte et vous accompagnons pour la première mise en place.',
  },
]
</script>
