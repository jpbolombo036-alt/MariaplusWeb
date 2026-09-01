<template>
  <div>
    <!-- En-tête style Prosoc -->
    <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-5">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 class="text-[22px] font-bold text-slate-900 tracking-tight">Check-in</h2>
          <p class="text-[13px] text-slate-500 mt-0.5 font-medium">Scanner et valider les entrées</p>
        </div>
        <div class="flex flex-col sm:flex-row gap-2">
          <router-link :to="`/agent/checkin/${id}`" class="h-10 px-5 rounded-lg border border-primary/30 text-primary text-[13px] font-semibold inline-flex items-center justify-center gap-2 hover:bg-primary/10 transition-all">
            <span class="material-symbols-outlined text-[18px]">point_of_sale</span> Poste d'accueil
          </router-link>
          <PermGuard :allow="['CHECKIN_SCAN']">
            <button class="h-10 px-5 rounded-lg bg-primary text-white text-[13px] font-semibold inline-flex items-center gap-2 shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all" @click="openScanner">
              <span class="material-symbols-outlined text-[18px]">photo_camera</span> Scanner avec la caméra
            </button>
          </PermGuard>
        </div>
      </div>
    </div>

    <!-- Recherche manuelle -->
    <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-5">
      <form class="flex gap-3" @submit.prevent="doScan">
        <div class="flex-1 relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <span class="material-symbols-outlined text-[20px]">qr_code</span>
          </span>
          <input ref="qrInput" v-model="qr" placeholder="Token du QR, jeton, ou lien d'invitation" class="h-11 pl-10 pr-4 rounded-lg border border-slate-200 bg-white text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 w-full transition-all" />
        </div>
        <button type="submit" class="h-11 px-5 rounded-lg bg-primary text-white text-[13px] font-semibold inline-flex items-center gap-2 shadow-sm shadow-primary/20 hover:bg-primary-dark transition-all">
          <span class="material-symbols-outlined text-[18px]">search</span>
          <span class="hidden sm:inline">Rechercher</span>
        </button>
      </form>
    </div>

    <!-- Recherche invité (agent d'accueil) -->
    <PermGuard :allow="['CHECKIN_SCAN']">
      <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-5">
        <div class="flex items-center gap-2 mb-3 flex-wrap">
          <span class="material-symbols-outlined text-primary text-[20px]">person_search</span>
          <h3 class="text-[15px] font-bold text-slate-900">Recherche invité</h3>
          <span class="text-[12px] text-slate-400">nom, téléphone, email ou code d'invitation</span>
        </div>
        <form class="flex gap-3" @submit.prevent="doSearch">
          <input v-model="searchQuery" placeholder="Ex. Jean, +243847…, INV-2026…" class="h-11 flex-1 px-4 rounded-lg border border-slate-200 bg-white text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all" />
          <button type="submit" :disabled="searching" class="h-11 px-5 rounded-lg bg-slate-900 text-white text-[13px] font-semibold inline-flex items-center gap-2 hover:bg-slate-800 disabled:opacity-60 transition-all">
            <span v-if="searching" class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
            <span v-else class="material-symbols-outlined text-[18px]">search</span>
            <span class="hidden sm:inline">Rechercher</span>
          </button>
        </form>
        <p v-if="searchError" class="mt-3 text-[13px] text-error">{{ searchError }}</p>
        <p v-else-if="searched && !searching && searchResults.length === 0" class="mt-4 text-[13px] text-slate-500">
          Aucun invité trouvé pour « {{ lastSearch }} ».
        </p>

        <div v-if="searchResults.length" class="mt-4 space-y-4">
          <div v-for="(r, i) in searchResults" :key="i" class="border border-slate-200 rounded-xl p-4">
            <div class="flex items-start justify-between gap-3 flex-wrap">
              <div class="flex items-center gap-3 min-w-0">
                <span class="w-11 h-11 rounded-lg bg-primary-light text-primary grid place-items-center font-bold text-[14px] shrink-0">{{ initialsOf(r.guestName) }}</span>
                <div class="min-w-0">
                  <div class="font-bold text-slate-900 text-[15px] truncate">{{ r.guestName }}</div>
                  <div class="text-[12px] text-slate-500 truncate">{{ r.eventName }}<template v-if="r.invitationCode"> · {{ r.invitationCode }}</template></div>
                </div>
              </div>
              <span class="px-3 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1" :class="statusClass(r)">
                <span class="material-symbols-outlined text-[14px]">{{ statusIcon(r) }}</span>{{ statusLabel(r) }}
              </span>
            </div>

            <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-slate-600">
              <span v-if="r.eventDate" class="inline-flex items-center gap-1"><span class="material-symbols-outlined text-[15px] text-slate-400">calendar_month</span>{{ r.eventDate }}</span>
              <span v-if="r.eventTime" class="inline-flex items-center gap-1"><span class="material-symbols-outlined text-[15px] text-slate-400">schedule</span>{{ r.eventTime }}</span>
              <span v-if="r.eventVenue" class="inline-flex items-center gap-1"><span class="material-symbols-outlined text-[15px] text-slate-400">location_on</span>{{ r.eventVenue }}</span>
              <span class="inline-flex items-center gap-1"><span class="material-symbols-outlined text-[15px] text-slate-400">group</span>{{ r.expectedAttendees }} personne(s)</span>
            </div>

            <div class="mt-2 flex flex-wrap gap-2">
              <span v-if="r.checkedInAttendees > 0 && r.checkedInAt" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-success-light text-success text-[12px] font-semibold">
                <span class="material-symbols-outlined text-[14px]">how_to_reg</span>Présent · {{ formatTime(r.checkedInAt) }}
              </span>
              <span v-if="r.tableName" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-light text-primary text-[12px] font-semibold">
                <span class="material-symbols-outlined text-[14px]">table_restaurant</span>Table {{ r.tableName }}
              </span>
              <span v-if="r.drinkChoice" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-attention-light text-attention-dark text-[12px] font-semibold">
                <span class="material-symbols-outlined text-[14px]">local_bar</span>{{ r.drinkChoice }}
              </span>
            </div>

            <div class="mt-4 flex flex-col sm:flex-row gap-2">
              <button v-if="r.hasCard && r.publicToken" type="button" class="h-10 px-4 rounded-lg bg-primary text-white text-[13px] font-semibold inline-flex items-center justify-center gap-2 shadow-sm shadow-primary/20 hover:bg-primary-dark transition-all" @click="openCard(r)">
                <span class="material-symbols-outlined text-[18px]">image</span>Voir l'invitation
              </button>
              <button v-if="r.canCheckIn && r.publicToken" type="button" :disabled="checkingIn" class="h-10 px-4 rounded-lg bg-secondary text-white text-[13px] font-semibold inline-flex items-center justify-center gap-2 shadow-sm hover:bg-secondary/90 disabled:opacity-60 transition-all" @click="checkInFromSearch(r)">
                <span class="material-symbols-outlined text-[18px]">how_to_reg</span>Enregistrer l'entrée
              </button>
            </div>
          </div>
        </div>
      </div>
    </PermGuard>

    <div v-if="scanError" class="bg-error-light border border-error/20 text-error rounded-xl p-4 mb-5 text-sm inline-flex items-center gap-2 w-full">
      <span class="material-symbols-outlined text-[19px]">error</span>{{ scanError }}
    </div>

    <div v-if="result" class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-5">
      <div class="flex items-center gap-4 mb-4">
        <span class="w-12 h-12 rounded-lg bg-primary-light text-primary grid place-items-center text-[24px]">
          <span class="material-symbols-outlined">person</span>
        </span>
        <div class="min-w-0">
          <div class="font-bold text-slate-900 text-[15px]">{{ result.guestName }}</div>
          <div class="text-[13px] text-slate-500">Statut : {{ result.invitationStatus }}</div>
          <span v-if="result.checkedInAttendees > 0 && !result.canCheckIn" class="mt-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-success-light text-success text-[11px] font-bold">
            <span class="material-symbols-outlined text-[14px]">how_to_reg</span>
            DÉJÀ ENREGISTRÉ<template v-if="result.checkedInAt"> — {{ formatTime(result.checkedInAt) }}</template>
          </span>
          <span v-if="result.checkedInAttendees > 0 && !result.canCheckIn" class="mt-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-success-light text-success text-[11px] font-bold">
            <span class="material-symbols-outlined text-[14px]">how_to_reg</span>
            DÉJÀ ENREGISTRÉ<template v-if="result.checkedInAt"> — {{ formatTime(result.checkedInAt) }}</template>
          </span>
          <div class="text-[13px] text-slate-500">
            Attendus : {{ result.expectedAttendees }} · Check-in : {{ result.checkedInAttendees }} · Restants : {{ result.remainingAttendees }}
          </div>
          <div v-if="result.tableName || result.drinkChoice" class="mt-1.5 flex flex-wrap gap-2">
            <span v-if="result.tableName" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-light text-primary text-[12px] font-semibold">
              <span class="material-symbols-outlined text-[14px]">table_restaurant</span>Table {{ result.tableName }}
            </span>
            <span v-if="result.drinkChoice" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-attention-light text-attention-dark text-[12px] font-semibold">
              <span class="material-symbols-outlined text-[14px]">local_bar</span>{{ result.drinkChoice }}
            </span>
          </div>
        </div>
        <span class="ml-auto material-symbols-outlined text-[28px]" :class="result.canCheckIn ? 'text-success' : 'text-error'">
          {{ result.canCheckIn ? 'check_circle' : 'cancel' }}
        </span>
      </div>
      <PermGuard :allow="['CHECKIN_CREATE']">
        <button v-if="result.canCheckIn" :disabled="checkingIn" class="h-10 px-5 rounded-lg bg-secondary text-white text-[13px] font-semibold inline-flex items-center gap-2 shadow-sm hover:bg-secondary/90 disabled:opacity-60 transition-all" @click="doCheckIn">
          <span v-if="checkingIn" class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
          <span v-else class="material-symbols-outlined text-[18px]">check_circle</span>
          {{ checkingIn ? 'Validation…' : "Valider l'entrée" }}
        </button>
      </PermGuard>
    </div>

    <div v-if="checkinMsg" class="bg-success-light border border-success/20 text-success rounded-xl p-4 text-sm inline-flex items-center gap-2 w-full">
      <span class="material-symbols-outlined text-[19px]">check_circle</span>{{ checkinMsg }}
    </div>

    <!-- Présents dans la salle -->
    <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mt-5">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="font-bold text-slate-900 text-[15px] inline-flex items-center gap-2">
            <span class="material-symbols-outlined text-success">how_to_reg</span>Présents dans la salle
          </h3>
          <p class="text-[13px] text-slate-500 mt-0.5">
            {{ present.length }} invité(s) entré(s) · {{ totalPresent }} personne(s)
          </p>
        </div>
        <button class="h-9 px-3 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 text-[13px]" @click="loadPresent">
          <span class="material-symbols-outlined text-[17px]">refresh</span>
          <span class="hidden sm:inline">Actualiser</span>
        </button>
      </div>

      <p v-if="presentLoading" class="text-slate-400 text-sm py-4 text-center">Chargement…</p>
      <div v-else-if="present.length === 0" class="text-slate-400 text-sm py-6 text-center">
        Aucune entrée enregistrée pour le moment.
      </div>
      <ul v-else class="divide-y divide-slate-100">
        <li v-for="p in present" :key="p.invitationId" class="py-3 flex items-center gap-3 flex-wrap">
          <span class="w-9 h-9 rounded-lg bg-success-light text-success grid place-items-center text-[13px] font-bold shrink-0">
            <span class="material-symbols-outlined text-[18px]">check</span>
          </span>
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-slate-800 text-[14px] truncate">{{ p.guestName }}</p>
            <p class="text-[12px] text-slate-500">
              {{ p.numberOfAttendees }} personne(s)
              <template v-if="p.lastCheckedInAt"> · {{ formatTime(p.lastCheckedInAt) }}</template>
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <span v-if="p.tableName" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-light text-primary text-[12px] font-semibold">
              <span class="material-symbols-outlined text-[14px]">table_restaurant</span>Table {{ p.tableName }}
            </span>
            <span v-if="p.drinkChoice" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-attention-light text-attention-dark text-[12px] font-semibold">
              <span class="material-symbols-outlined text-[14px]">local_bar</span>{{ p.drinkChoice }}
            </span>
          </div>
        </li>
      </ul>
    </div>
  </div>

<!-- ===== Modal scanner caméra ===== -->
<div v-if="cameraOpen" class="fixed inset-0 z-50 bg-black/70 grid place-items-center p-4" @click.self="closeScanner">
  <div class="bg-surface-container-lowest rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
    <div class="flex items-center justify-between px-5 py-4 border-b border-slate-200">
      <span class="font-semibold text-slate-900 text-[15px] inline-flex items-center gap-2">
        <span class="material-symbols-outlined text-primary">photo_camera</span>Scanner le QR code
      </span>
      <button class="p-1.5 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors" @click="closeScanner">
        <span class="material-symbols-outlined text-[20px]">close</span>
      </button>
    </div>

    <div class="relative bg-black aspect-square">
      <video ref="videoEl" class="w-full h-full object-cover" playsinline muted></video>
      <div class="absolute inset-0 grid place-items-center pointer-events-none">
        <div class="w-56 h-56 border-2 border-white/80 rounded-2xl relative">
          <span class="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-2xl"></span>
          <span class="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-2xl"></span>
          <span class="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-2xl"></span>
          <span class="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-2xl"></span>
        </div>
      </div>
      <p class="absolute bottom-3 inset-x-0 text-center text-white/90 text-[12px] font-medium">
        Placez le QR code de l'invité dans le cadre
      </p>
    </div>

    <div class="px-5 py-4">
      <p v-if="cameraError" class="text-[13px] text-error inline-flex items-center gap-1.5">
        <span class="material-symbols-outlined text-[17px]">error</span>{{ cameraError }}
      </p>
      <p v-else-if="cameraLoading" class="text-[13px] text-slate-500">Activation de la caméra…</p>
      <p v-else class="text-[13px] text-slate-500">La caméra s'arrête automatiquement après un scan réussi.</p>
    </div>
  </div>
</div>

<!-- ===== Visionneuse carte d'invitation confirmée ===== -->
<Teleport to="body">
  <div v-if="cardViewer.open" class="fixed inset-0 z-[100] bg-black/75 flex items-center justify-center p-3 sm:p-8" @click.self="cardViewer.open = false">
    <div class="bg-surface-container-lowest rounded-2xl w-full max-w-2xl max-h-full flex flex-col overflow-hidden shadow-2xl">
      <div class="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
        <span class="font-semibold text-slate-900 text-[14px] truncate">Invitation confirmée — {{ cardViewer.name }}</span>
        <button class="p-1.5 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors" @click="cardViewer.open = false">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>
      <div class="overflow-auto bg-slate-100 p-3 sm:p-5 grid place-items-center">
        <img :src="cardViewer.url" class="max-w-full h-auto rounded-xl shadow-lg" alt="Carte d'invitation confirmée" />
      </div>
      <div class="px-5 py-3 border-t border-slate-200 flex justify-end">
        <button class="h-10 px-5 rounded-lg bg-primary text-white text-[13px] font-semibold hover:bg-primary-dark transition-all" @click="cardViewer.open = false">Fermer</button>
      </div>
    </div>
  </div>
</Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import { scan, checkIn, listPresent, searchGuests, type CheckInScan, type CheckInSearchItem, type PresentGuest } from '../../api/checkin'
import { publicCardUrl } from '../../api/publicInvitation'
import PermGuard from '../../components/common/PermGuard.vue'

const route = useRoute()
const id = Number(route.params.id)
const qr = ref('')
const qrInput = ref<HTMLInputElement | null>(null)
const result = ref<CheckInScan | null>(null)
const scanError = ref('')
const checkinMsg = ref('')
const checkingIn = ref(false)

/* --- Présents dans la salle --- */
const present = ref<PresentGuest[]>([])
const presentLoading = ref(true)
const totalPresent = computed(() => present.value.reduce((s, p) => s + p.numberOfAttendees, 0))

async function loadPresent() {
  presentLoading.value = true
  try {
    present.value = await listPresent(id)
  } catch {
    present.value = []
  } finally {
    presentLoading.value = false
  }
}
function formatTime(d: string): string {
  return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
onMounted(loadPresent)

/* --- Recherche invité (agent d'accueil) --- */
const searchQuery = ref('')
const lastSearch = ref('')
const searching = ref(false)
const searched = ref(false)
const searchError = ref('')
const searchResults = ref<CheckInSearchItem[]>([])

async function doSearch() {
  const q = searchQuery.value.trim()
  searchError.value = ''
  if (q.length < 2) {
    searchError.value = 'Saisissez au moins 2 caractères.'
    return
  }
  searching.value = true
  searched.value = true
  lastSearch.value = q
  try {
    searchResults.value = await searchGuests(id, q)
  } catch (e: any) {
    searchResults.value = []
    searchError.value = e?.response?.data?.error || e?.message || 'Erreur lors de la recherche.'
  } finally {
    searching.value = false
  }
}

function initialsOf(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '?'
}

function statusLabel(r: CheckInSearchItem): string {
  if (r.checkedInAttendees > 0) return 'PRÉSENT'
  if (r.rsvpStatus === 'ACCEPTED') return 'PRÉSENCE CONFIRMÉE'
  if (r.rsvpStatus === 'DECLINED') return 'A DÉCLINÉ'
  return 'EN ATTENTE'
}
function statusClass(r: CheckInSearchItem): string {
  if (r.checkedInAttendees > 0) return 'bg-success-light text-success'
  if (r.rsvpStatus === 'ACCEPTED') return 'bg-success-light text-success'
  if (r.rsvpStatus === 'DECLINED') return 'bg-error-light text-error'
  return 'bg-attention-light text-attention-dark'
}
function statusIcon(r: CheckInSearchItem): string {
  if (r.checkedInAttendees > 0) return 'how_to_reg'
  if (r.rsvpStatus === 'ACCEPTED') return 'check_circle'
  if (r.rsvpStatus === 'DECLINED') return 'cancel'
  return 'hourglass_top'
}

/* --- Visionneuse carte d'invitation confirmée --- */
const cardViewer = reactive({ open: false, url: '', name: '' })

function openCard(r: CheckInSearchItem) {
  if (!r.publicToken) return
  cardViewer.url = publicCardUrl(r.publicToken)
  cardViewer.name = r.guestName
  cardViewer.open = true
}

async function checkInFromSearch(r: CheckInSearchItem) {
  if (!r.publicToken) return
  checkingIn.value = true
  checkinMsg.value = ''
  scanError.value = ''
  try {
    const res = await checkIn(r.publicToken, id, 1)
    checkinMsg.value = `Entrée validée pour ${res.guestName} (${res.numberOfAttendees} personne(s)).`
    qr.value = r.publicToken
    result.value = await scan(r.publicToken, id)
    await doSearch()
    await loadPresent()
  } catch (e: any) {
    scanError.value = e?.response?.data?.error || e?.message || 'Erreur lors du check-in.'
  } finally {
    checkingIn.value = false
  }
}

/* --- Scanner caméra (@zxing/browser) --- */
const cameraOpen = ref(false)
const cameraLoading = ref(false)
const cameraError = ref('')
const videoEl = ref<HTMLVideoElement | null>(null)
let reader: BrowserMultiFormatReader | null = null
let controls: IScannerControls | null = null

/** Extrait le token public depuis un QR : token brut ou lien .../invitations/<token>. */
function extractToken(raw: string): string {
  let t = raw.trim()
  const marker = '/invitations/'
  const idx = t.lastIndexOf(marker)
  if (idx >= 0) {
    t = t.slice(idx + marker.length)
  }
  // retire un éventuel paramètre de requête ou slash final
  t = t.split('?')[0].split('#')[0].replace(/\/+$/, '')
  return t
}

async function openScanner() {
  cameraOpen.value = true
  cameraError.value = ''
  cameraLoading.value = true
  // laisse le <video> apparaître dans le DOM avant de démarrer le flux
  await new Promise((r) => setTimeout(r, 60))
  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Caméra non disponible sur cet appareil/navigateur.')
    }
    const reader2 = new BrowserMultiFormatReader()
    reader = reader2
    controls = await reader2.decodeFromVideoDevice(undefined, videoEl.value!, (res) => {
      if (!res) return
      const token = extractToken(res.getText())
      if (token) {
        qr.value = token
        closeScanner()
        void doScan()
      }
    })
    cameraLoading.value = false
  } catch (e: any) {
    cameraLoading.value = false
    const name = e?.name ?? ''
    if (name === 'NotAllowedError') {
      cameraError.value = "Accès à la caméra refusé. Autorisez la caméra dans les paramètres du navigateur puis réessayez."
    } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
      cameraError.value = 'Aucune caméra détectée sur cet appareil.'
    } else if (name === 'NotReadableError') {
      cameraError.value = 'La caméra est déjà utilisée par une autre application.'
    } else {
      cameraError.value = e?.message || 'Impossible d\'accéder à la caméra.'
    }
    stopCamera()
  }
}

function stopCamera() {
  try {
    controls?.stop()
  } catch { /* ignore */ }
  controls = null
  reader = null
  const v = videoEl.value
  if (v?.srcObject) {
    (v.srcObject as MediaStream).getTracks().forEach((t) => t.stop())
    v.srcObject = null
  }
}

function closeScanner() {
  cameraOpen.value = false
  stopCamera()
}

onBeforeUnmount(closeScanner)

/* --- Scan manuel + check-in --- */
async function doScan() {
  scanError.value = ''
  checkinMsg.value = ''
  if (!qr.value.trim()) return
  try {
    result.value = await scan(extractToken(qr.value), id)
  } catch (e: any) {
    result.value = null
    scanError.value = e?.response?.data?.error || e?.message || 'Invitation introuvable pour ce code.'
  }
}

async function doCheckIn() {
  if (!qr.value) return
  checkingIn.value = true
  checkinMsg.value = ''
  scanError.value = ''
  try {
    const res = await checkIn(extractToken(qr.value), id, 1)
    checkinMsg.value = `Entrée validée pour ${res.guestName} (${res.numberOfAttendees} personne(s)).`
    result.value = await scan(extractToken(qr.value), id)
    await loadPresent()
  } catch (e: any) {
    scanError.value = e?.response?.data?.error || e?.message || 'Erreur lors du check-in.'
  } finally {
    checkingIn.value = false
  }
}
</script>
