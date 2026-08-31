<template>
  <div>
    <!-- En-tête style Prosoc -->
    <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-5">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 class="text-[22px] font-bold text-slate-900 tracking-tight">Check-in</h2>
          <p class="text-[13px] text-slate-500 mt-0.5 font-medium">Scanner et valider les entrées</p>
        </div>
        <PermGuard :allow="['CHECKIN_SCAN']">
          <button class="h-10 px-5 rounded-lg bg-primary text-white text-[13px] font-semibold inline-flex items-center gap-2 shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all" @click="openScanner">
            <span class="material-symbols-outlined text-[18px]">photo_camera</span> Scanner avec la caméra
          </button>
        </PermGuard>
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
          <div class="text-[13px] text-slate-500">
            Attendus : {{ result.expectedAttendees }} · Check-in : {{ result.checkedInAttendees }} · Restants : {{ result.remainingAttendees }}
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
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { scan, checkIn, type CheckInScan } from '../../api/checkin'
import PermGuard from '../../components/common/PermGuard.vue'

const route = useRoute()
const id = Number(route.params.id)
const qr = ref('')
const qrInput = ref<HTMLInputElement | null>(null)
const result = ref<CheckInScan | null>(null)
const scanError = ref('')
const checkinMsg = ref('')
const checkingIn = ref(false)

/* --- Scanner caméra (@zxing/browser) --- */
const cameraOpen = ref(false)
const cameraLoading = ref(false)
const cameraError = ref('')
const videoEl = ref<HTMLVideoElement | null>(null)
let reader: BrowserMultiFormatReader | null = null

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
    await reader.decodeFromVideoDevice(undefined, videoEl.value!, (res) => {
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
    reader?.reset()
  } catch { /* ignore */ }
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
  } catch (e: any) {
    scanError.value = e?.response?.data?.error || e?.message || 'Erreur lors du check-in.'
  } finally {
    checkingIn.value = false
  }
}
</script>
