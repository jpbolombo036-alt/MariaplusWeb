<template>
  <div class="agent-root">
    <!-- ============ SIDEBAR AGENT_ACCUEIL ============ -->
    <aside class="ag-sidebar" :class="{ 'ag-sidebar--open': mobileNav }">
      <div class="ag-logo">
        <img src="/logo.png" class="ag-logo-img" alt="" />
        <span class="ag-logo-text">Eventia<span class="ag-logo-plus">Easy</span></span>
      </div>
      <p class="ag-sidebar-sub">Accueil / Check-in</p>
      <nav class="ag-nav">
        <button type="button" class="ag-nav-item ag-nav-item--active" @click="scrollToSec('sec-scan')">
          <span class="material-symbols-outlined">qr_code_scanner</span>Scanner QR Code
        </button>
        <button type="button" class="ag-nav-item" @click="scrollToSec('sec-search')">
          <span class="material-symbols-outlined">person_search</span>Recherche invité
        </button>
        <button type="button" class="ag-nav-item" @click="scrollToSec('sec-present')">
          <span class="material-symbols-outlined">group</span>Arrivées du jour
        </button>
        <button type="button" class="ag-nav-item" @click="scrollToSec('sec-present')">
          <span class="material-symbols-outlined">history</span>Historique
        </button>
        <router-link class="ag-nav-item" to="/dashboard/profile">
          <span class="material-symbols-outlined">settings</span>Paramètres
        </router-link>
      </nav>
    </aside>
    <div v-if="mobileNav" class="ag-backdrop" @click="mobileNav = false"></div>

    <!-- ============ ZONE PRINCIPALE ============ -->
    <div class="agent-main">
      <header class="ag-header">
        <button class="ag-burger" @click="mobileNav = !mobileNav" aria-label="Menu">
          <span class="material-symbols-outlined">menu</span>
        </button>
        <div class="ag-header-title">
          <h1>Check-in</h1>
          <p>Validation de l'arrivée d'un invité</p>
        </div>
        <div class="ag-header-right">
          <button class="ag-bell" aria-label="Notifications">
            <span class="material-symbols-outlined">notifications</span>
            <span class="ag-bell-dot"></span>
          </button>
          <span class="ag-avatar">AA</span>
          <div class="ag-agent">
            <span class="ag-agent-name">Agent Accueil</span>
            <span class="ag-agent-status">● En ligne</span>
          </div>
        </div>
      </header>

      <main class="ag-content">
        <div class="ag-grid">
          <!-- ======== COLONNE PRINCIPALE ======== -->
          <section class="ag-col-left">

            <!-- Scanner QR -->
            <div class="ag-card" id="sec-scan">
              <h3 class="ag-card-title">
                <span class="material-symbols-outlined">qr_code_scanner</span>Scanner QR Code
              </h3>
              <form class="ag-scanrow" @submit.prevent="doScan">
                <input v-model="qr" class="ag-input" placeholder="Token du QR ou lien d'invitation…" />
                <button type="submit" class="ag-btn ag-btn--primary ag-btn--md" :disabled="scanning">
                  {{ scanning ? '…' : 'Scanner' }}
                </button>
              </form>
              <button type="button" class="ag-linkbtn" @click="openScanner">
                <span class="material-symbols-outlined">photo_camera</span>Utiliser la caméra
              </button>
              <p v-if="scanError" class="ag-error">{{ scanError }}</p>
            </div>

            <!-- Recherche invité -->
            <div class="ag-card" id="sec-search">
              <h3 class="ag-card-title">
                <span class="material-symbols-outlined">person_search</span>Recherche invité
              </h3>
              <form class="ag-scanrow" @submit.prevent="doSearch">
                <input v-model="searchQuery" class="ag-input" placeholder="Nom, téléphone, email ou code…" />
                <button type="submit" class="ag-btn ag-btn--ghost ag-btn--md" :disabled="searching">
                  {{ searching ? '…' : 'Rechercher' }}
                </button>
              </form>
              <div v-if="searchResults.length" class="ag-results">
                <button v-for="(r, i) in searchResults" :key="i" type="button" class="ag-result" @click="selectGuest(r)">
                  <span class="ag-mini-avatar">{{ initialsOf(r.guestName) }}</span>
                  <span class="ag-result-name">
                    {{ r.guestName }}
                    <small>{{ statusLabelOf(r) }} · {{ r.expectedAttendees }} pers.<template v-if="r.invitationCode"> · {{ r.invitationCode }}</template></small>
                  </span>
                  <span class="material-symbols-outlined ag-result-go">chevron_right</span>
                </button>
              </div>
            </div>

            <!-- ======== GRANDE CARTE DE VALIDATION ======== -->
            <div v-if="sel" class="ag-card ag-validate">
              <div class="ag-state-circle" :class="'ag-state--' + state">
                <span class="ag-state-inner">{{ stateIcon }}</span>
              </div>
              <h2 class="ag-state-title">{{ stateTitle }}</h2>
              <p class="ag-state-sub">{{ stateSub }}</p>

              <!-- Invité -->
              <div class="ag-guest">
                <span class="ag-guest-avatar">{{ initialsOf(sel.guestName) }}</span>
                <div class="ag-guest-name">{{ sel.guestName }}</div>
                <div v-if="sel.invitationCode" class="ag-guest-sub">N° {{ sel.invitationCode }}</div>
                <span v-if="sel.rsvpStatus === 'ACCEPTED'" class="ag-badge ag-badge--ok">
                  <span class="material-symbols-outlined">check_circle</span>RSVP ACCEPTÉ
                </span>
                <span v-else-if="sel.rsvpStatus === 'DECLINED'" class="ag-badge ag-badge--no">
                  <span class="material-symbols-outlined">cancel</span>RSVP REFUSÉ
                </span>
                <span v-else class="ag-badge ag-badge--wait">
                  <span class="material-symbols-outlined">hourglass_top</span>RSVP EN ATTENTE
                </span>
              </div>

              <!-- Événement / Date / Lieu -->
              <div class="ag-eventbox">
                <div class="ag-evcol">
                  <span class="material-symbols-outlined ag-evicon">event</span>
                  <div class="ag-evlabel">ÉVÉNEMENT</div>
                  <div class="ag-evvalue">{{ sel.weddingDisplayName || '—' }}</div>
                </div>
                <div v-if="sel.eventDate" class="ag-evcol">
                  <span class="material-symbols-outlined ag-evicon">calendar_month</span>
                  <div class="ag-evlabel">DATE</div>
                  <div class="ag-evvalue">{{ sel.eventDate }}</div>
                  <div v-if="dayOfWeek" class="ag-evsub">{{ dayOfWeek }}</div>
                </div>
                <div v-if="sel.eventVenue" class="ag-evcol">
                  <span class="material-symbols-outlined ag-evicon">location_on</span>
                  <div class="ag-evlabel">LIEU</div>
                  <div class="ag-evvalue">{{ venueMain }}</div>
                  <div v-if="venueSub" class="ag-evsub">{{ venueSub }}</div>
                </div>
              </div>

              <!-- Nombre de personnes + Check-in enregistré -->
              <div class="ag-duo">
                <div class="ag-people">
                  <span class="ag-people-icon"><span class="material-symbols-outlined">group</span></span>
                  <div class="ag-people-label">INVITATION POUR</div>
                  <div class="ag-people-count">{{ sel.expectedAttendees }}</div>
                  <div class="ag-people-word">PERSONNE(S)</div>
                  <div class="ag-people-sub">(vous inclus)</div>
                </div>
                <div v-if="sel.checkedInAttendees > 0" class="ag-donecard">
                  <div class="ag-donecard-title">
                    <span class="material-symbols-outlined">check_circle</span>CHECK-IN ENREGISTRÉ
                  </div>
                  <div class="ag-donecard-time">{{ checkinTimeText }}</div>
                  <span class="ag-badge ag-badge--ok"><span class="material-symbols-outlined">check</span>Présent</span>
                  <div class="ag-donecard-qty">{{ sel.checkedInAttendees }}/{{ sel.expectedAttendees }} entrée(s)</div>
                </div>
              </div>

              <!-- Bouton principal -->
              <button
                v-if="state === 'allowed'"
                type="button"
                class="ag-btn ag-btn--primary ag-btn--xl"
                :disabled="checkinBusy"
                @click="doCheckIn"
              >
                <span v-if="checkinBusy" class="ag-spin"></span>
                <span v-else class="material-symbols-outlined">how_to_reg</span>
                {{ checkinBusy ? 'Enregistrement…' : "Enregistrer l'entrée" }}
              </button>
              <button v-else-if="state === 'done'" type="button" class="ag-btn ag-btn--primary ag-btn--xl ag-btn--done" disabled>
                <span class="material-symbols-outlined">check_circle</span>Check-in enregistré
              </button>

              <div class="ag-secondary">
                <button v-if="sel.hasCard && sel.publicToken" type="button" class="ag-btn ag-btn--ghost" @click="openViewer">
                  <span class="material-symbols-outlined">visibility</span>Voir l'invitation
                </button>
                <button type="button" class="ag-btn ag-btn--ghost" @click="newSearch">
                  <span class="material-symbols-outlined">search</span>Nouvelle recherche
                </button>
              </div>
            </div>

            <!-- ======== ARRIVÉES DU JOUR ======== -->
            <div class="ag-card" id="sec-present">
              <h3 class="ag-card-title">
                <span class="material-symbols-outlined">group</span>Arrivées du jour
                <span class="ag-count-chip">{{ present.length }} invité(s) · {{ totalPresent }} personne(s)</span>
              </h3>
              <p v-if="presentLoading" class="ag-empty">Chargement…</p>
              <p v-else-if="present.length === 0" class="ag-empty">Aucune entrée enregistrée pour le moment.</p>
              <ul v-else class="ag-presentlist">
                <li v-for="p in present" :key="p.invitationId">
                  <span class="ag-present-check"><span class="material-symbols-outlined">check</span></span>
                  <span class="ag-present-name">{{ p.guestName }}<small>{{ p.numberOfAttendees }} pers.<template v-if="p.lastCheckedInAt"> · {{ fmtTime(p.lastCheckedInAt) }}</template></small></span>
                  <span v-if="p.tableName" class="ag-chip ag-chip--violet"><span class="material-symbols-outlined">table_restaurant</span>{{ p.tableName }}</span>
                  <span v-if="p.drinkChoice" class="ag-chip ag-chip--amber"><span class="material-symbols-outlined">local_bar</span>{{ p.drinkChoice }}</span>
                </li>
              </ul>
            </div>
          </section>

          <!-- ======== COLONNE DROITE : APERÇU INVITATION ======== -->
          <aside class="ag-col-right">
            <div class="ag-card ag-preview">
              <h3 class="ag-card-title"><span class="material-symbols-outlined">badge</span>Aperçu de l'invitation</h3>
              <template v-if="sel">
                <img v-if="sel.hasCard" :src="cardUrl" class="ag-preview-img" alt="Invitation confirmée" />
                <img v-else-if="qrPreview" :src="qrPreview" class="ag-preview-qr" alt="QR Code" />
                <div class="ag-preview-info">
                  <p class="ag-preview-h">Informations</p>
                  <p class="ag-preview-desc">Présentez ce QR Code à l'entrée pour faciliter votre accès.</p>
                  <p class="ag-preview-valid"><span class="material-symbols-outlined">verified</span>Invitation valide</p>
                  <p class="ag-preview-clock">Heure du système<br /><strong>{{ clockText }}</strong></p>
                </div>
                <button v-if="sel.hasCard" type="button" class="ag-btn ag-btn--ghost ag-btn--md" @click="openViewer">
                  <span class="material-symbols-outlined">visibility</span>Voir l'invitation
                </button>
              </template>
              <p v-else class="ag-empty">Scannez un QR ou recherchez un invité pour afficher son invitation.</p>
            </div>
          </aside>
        </div>
      </main>
    </div>

    <!-- ======== VISIONNEUSE ======== -->
    <Teleport to="body">
      <div v-if="viewer.open" class="ag-viewer" @click.self="viewer.open = false">
        <div class="ag-viewer-box">
          <div class="ag-viewer-head">
            <span>Invitation confirmée — {{ viewer.name }}</span>
            <button type="button" class="ag-viewer-close" @click="viewer.open = false">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <div class="ag-viewer-body">
            <img :src="viewer.url" alt="Carte d'invitation confirmée" />
          </div>
          <div class="ag-viewer-foot">
            <button type="button" class="ag-btn ag-btn--primary ag-btn--md" @click="viewer.open = false">Fermer</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ======== MODAL CAMÉRA ======== -->
    <Teleport to="body">
      <div v-if="cameraOpen" class="ag-viewer" @click.self="closeScanner">
        <div class="ag-viewer-box ag-camera-box">
          <div class="ag-viewer-head">
            <span>Scanner le QR code</span>
            <button type="button" class="ag-viewer-close" @click="closeScanner">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <div class="ag-camera-zone">
            <video ref="videoEl" class="ag-camera-video" playsinline muted></video>
          </div>
          <div class="ag-viewer-foot">
            <p v-if="cameraError" class="ag-error">{{ cameraError }}</p>
            <p v-else-if="cameraLoading" class="ag-empty">Activation de la caméra…</p>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import QRCode from 'qrcode'
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import {
  scan,
  checkIn,
  listPresent,
  searchGuests,
  type CheckInScan,
  type CheckInSearchItem,
  type PresentGuest,
} from '../../api/checkin'
import { publicCardUrl } from '../../api/publicInvitation'

const route = useRoute()
const id = Number(route.params.id)

/* ---------- Navigation latérale ---------- */
const mobileNav = ref(false)
function scrollToSec(sec: string) {
  document.getElementById(sec)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  mobileNav.value = false
}

/* ---------- Scan / recherche / check-in ---------- */
const qr = ref('')
const scanning = ref(false)
const scanError = ref('')
const sel = ref<CheckInScan | null>(null)
const checkinBusy = ref(false)

const searchQuery = ref('')
const searching = ref(false)
const searchResults = ref<CheckInSearchItem[]>([])
const present = ref<PresentGuest[]>([])
const presentLoading = ref(true)
const totalPresent = computed(() => present.value.reduce((s, p) => s + p.numberOfAttendees, 0))

function extractToken(raw: string): string {
  let t = raw.trim()
  const marker = '/invitations/'
  const idx = t.lastIndexOf(marker)
  if (idx >= 0) t = t.slice(idx + marker.length)
  return t.split('?')[0].split('#')[0].replace(/\/+$/, '')
}

async function doScan() {
  scanError.value = ''
  if (!qr.value.trim()) return
  scanning.value = true
  try {
    sel.value = await scan(extractToken(qr.value), id)
    await loadPresent()
  } catch (e: any) {
    sel.value = null
    scanError.value = e?.response?.status === 404
      ? 'Invitation introuvable. Aucune invitation correspondante n’a été trouvée.'
      : (e?.response?.data?.error || 'Impossible de vérifier cette invitation.')
  } finally {
    scanning.value = false
  }
}

async function doSearch() {
  const q = searchQuery.value.trim()
  if (q.length < 2) return
  searching.value = true
  try {
    searchResults.value = await searchGuests(id, q)
  } catch {
    searchResults.value = []
  } finally {
    searching.value = false
  }
}

async function selectGuest(r: CheckInSearchItem) {
  if (!r.publicToken) return
  scanError.value = ''
  qr.value = r.publicToken
  try {
    sel.value = await scan(r.publicToken, id)
  } catch {
    sel.value = null
    scanError.value = 'Invitation introuvable. Aucune invitation correspondante n’a été trouvée.'
  }
}

async function doCheckIn() {
  if (!sel.value?.publicToken || !sel.value.canCheckIn) return
  checkinBusy.value = true
  try {
    await checkIn(sel.value.publicToken, id, 1)
    sel.value = await scan(sel.value.publicToken, id)
    await loadPresent()
  } catch (e: any) {
    scanError.value = e?.response?.data?.error || 'Erreur lors du check-in.'
  } finally {
    checkinBusy.value = false
  }
}

function newSearch() {
  sel.value = null
  qr.value = ''
  searchQuery.value = ''
  scanError.value = ''
  document.getElementById('sec-search')?.scrollIntoView({ behavior: 'smooth' })
}

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

/* ---------- États visuels ---------- */
const state = computed(() => {
  const r = sel.value
  if (!r) return 'empty'
  if (r.rsvpStatus === 'DECLINED') return 'declined'
  if (r.canCheckIn) return 'allowed'
  if (r.checkedInAttendees > 0) return 'done'
  return 'pending'
})
const stateIcon = computed(() =>
  ({ allowed: '✓', done: '✓', declined: '✕', pending: '⏳' } as Record<string, string>)[state.value] ?? '✓',
)
const stateTitle = computed(() =>
  ({
    allowed: 'CHECK-IN AUTORISÉ',
    done: 'DÉJÀ PRÉSENT',
    declined: 'ACCÈS NON AUTORISÉ',
    pending: 'RSVP EN ATTENTE',
  } as Record<string, string>)[state.value] ?? '',
)
const stateSub = computed(() => {
  const r = sel.value
  if (!r) return ''
  switch (state.value) {
    case 'allowed':
      return r.checkedInAttendees > 0
        ? `Déjà ${r.checkedInAttendees}/${r.expectedAttendees} personne(s) enregistrée(s) — l'invité est autorisé à entrer.`
        : "L'invité est autorisé à entrer."
    case 'done':
      return 'Cet invité a déjà été enregistré.'
    case 'declined':
      return "Cet invité a indiqué qu'il ne participera pas à l'événement."
    default:
      return "Cet invité n'a pas encore confirmé sa présence."
  }
})

/* ---------- Détails dérivés (données backend uniquement) ---------- */
const MONTHS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
const dayOfWeek = computed(() => {
  const s = sel.value?.eventDate?.trim()
  if (!s) return ''
  const m = s.match(/^(\d{1,2})\s+([a-zà-ÿ]+)\s+(\d{4})$/i)
  if (!m) return ''
  const idx = MONTHS_FR.findIndex((mo) => mo.toLowerCase() === m[2]?.toLowerCase())
  if (idx < 0) return ''
  try {
    return new Intl.DateTimeFormat('fr-FR', { weekday: 'long' }).format(new Date(Number(m[3]), idx, Number(m[1])))
  } catch {
    return ''
  }
})
const venueParts = computed(() => (sel.value?.eventVenue || '').split(',').map((s) => s.trim()).filter(Boolean))
const venueMain = computed(() => venueParts.value[0] || '')
const venueSub = computed(() => (venueParts.value.length > 1 ? venueParts.value.slice(1).join(' · ') : ''))

function initialsOf(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '?'
}
function fmtTime(d: string): string {
  return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
const checkinTimeText = computed(() => {
  const d = sel.value?.checkedInAt
  if (!d) return ''
  const dt = new Date(d)
  const time = dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const sameDay = dt.toDateString() === new Date().toDateString()
  return sameDay ? `Aujourd'hui à ${time}` : dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) + ` à ${time}`
})
function statusLabelOf(r: CheckInSearchItem): string {
  if (r.checkedInAttendees > 0) return 'Présent'
  if (r.rsvpStatus === 'ACCEPTED') return 'Présence confirmée'
  if (r.rsvpStatus === 'DECLINED') return 'A décliné'
  return 'En attente'
}

/* ---------- Aperçu invitation (carte PNG enregistrée ou QR) ---------- */
const cardUrl = computed(() => (sel.value?.publicToken ? publicCardUrl(sel.value.publicToken) : ''))
const qrPreview = ref('')
watch(sel, async (r) => {
  qrPreview.value = ''
  if (r?.publicToken && !r.hasCard) {
    try {
      qrPreview.value = await QRCode.toDataURL(r.publicToken, { width: 360, margin: 1 })
    } catch {
      /* ignore */
    }
  }
})

const viewer = reactive({ open: false, url: '', name: '' })
function openViewer() {
  if (!sel.value?.publicToken) return
  viewer.url = publicCardUrl(sel.value.publicToken)
  viewer.name = sel.value.guestName
  viewer.open = true
}

/* ---------- Horloge système ---------- */
const now = ref(new Date())
let clockTimer: number | null = null
const clockText = computed(() =>
  now.value.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  + ' — ' + now.value.toLocaleTimeString('fr-FR'),
)

/* ---------- Scanner caméra ---------- */
const cameraOpen = ref(false)
const cameraLoading = ref(false)
const cameraError = ref('')
const videoEl = ref<HTMLVideoElement | null>(null)
let reader: BrowserMultiFormatReader | null = null
let controls: IScannerControls | null = null

async function openScanner() {
  cameraOpen.value = true
  cameraError.value = ''
  cameraLoading.value = true
  await new Promise((r) => setTimeout(r, 60))
  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Caméra non disponible sur cet appareil/navigateur.')
    }
    const reader2 = new BrowserMultiFormatReader()
    reader = reader2
    controls = await reader2.decodeFromVideoDevice(undefined, videoEl.value!, (res) => {
      if (!res) return
      const tok = extractToken(res.getText())
      if (tok) {
        qr.value = tok
        closeScanner()
        void doScan()
      }
    })
    cameraLoading.value = false
  } catch (e: any) {
    cameraLoading.value = false
    const name = e?.name ?? ''
    cameraError.value = name === 'NotAllowedError'
      ? 'Accès à la caméra refusé. Autorisez la caméra puis réessayez.'
      : (name === 'NotFoundError' || name === 'OverconstrainedError')
        ? 'Aucune caméra détectée sur cet appareil.'
        : (e?.message || "Impossible d'accéder à la caméra.")
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

/* ---------- Cycle de vie ---------- */
onMounted(() => {
  loadPresent()
  clockTimer = window.setInterval(() => { now.value = new Date() }, 1000)
})
onBeforeUnmount(() => {
  stopCamera()
  if (clockTimer !== null) {
    clearInterval(clockTimer)
    clockTimer = null
  }
})
</script>

<style>
/* ============================================================
   Poste AGENT_ACCUEIL — Check-in (SaaS control-access UI)
   Classes .ag-* globales · mode sombre via html.dark
   ============================================================ */
.agent-root {
  display: flex;
  min-height: 100vh;
  background: #f8f7fc;
  font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
  color: #172033;
  animation: ag-fade 0.25s ease both;
}

/* ---------- Sidebar ---------- */
.ag-sidebar {
  width: 250px;
  flex-shrink: 0;
  background: #ffffff;
  border-right: 1px solid #ece9f2;
  padding: 22px 16px;
  position: sticky;
  top: 0;
  height: 100vh;
}
.ag-logo { display: flex; align-items: center; gap: 9px; }
.ag-logo-img { width: 28px; height: 28px; object-fit: contain; }
.ag-logo-text { font-size: 20px; font-weight: 700; color: #5427c7; }
.ag-logo-plus { color: #8b5cf6; }
.ag-sidebar-sub { font-size: 12px; color: #9aa3b2; margin: 4px 0 26px; padding-left: 4px; }
.ag-nav { display: flex; flex-direction: column; gap: 4px; }
.ag-nav-item {
  display: flex; align-items: center; gap: 11px;
  padding: 11px 14px; border-radius: 10px;
  font-size: 14px; font-weight: 600; color: #344054;
  background: transparent; border: 0; cursor: pointer;
  text-decoration: none; text-align: left; font-family: inherit;
  transition: background 0.15s ease, color 0.15s ease;
}
.ag-nav-item .material-symbols-outlined { font-size: 20px; color: #667085; transition: color 0.15s ease; }
.ag-nav-item:hover { background: #f4f2fa; }
.ag-nav-item--active { background: #f2edff; color: #5427c7; }
.ag-nav-item--active .material-symbols-outlined { color: #5427c7; }

/* ---------- Main / Header ---------- */
.agent-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.ag-header {
  height: 72px; background: #ffffff; border-bottom: 1px solid #ece9f2;
  display: flex; align-items: center; gap: 16px; padding: 0 28px;
  position: sticky; top: 0; z-index: 20;
}
.ag-burger { display: none; border: 0; background: transparent; cursor: pointer; color: #344054; padding: 6px; }
.ag-header-title h1 { font-size: 28px; font-weight: 700; color: #172033; margin: 0; line-height: 1.15; }
.ag-header-title p { font-size: 14px; color: #667085; margin: 2px 0 0; }
.ag-header-right { margin-left: auto; display: flex; align-items: center; gap: 12px; }
.ag-bell { position: relative; border: 0; background: transparent; color: #667085; cursor: pointer; padding: 6px; border-radius: 10px; }
.ag-bell:hover { background: #f4f2fa; color: #5427c7; }
.ag-bell-dot { position: absolute; top: 7px; right: 8px; width: 7px; height: 7px; border-radius: 50%; background: #e53935; }
.ag-avatar {
  width: 40px; height: 40px; border-radius: 50%;
  background: #ede7ff; color: #5427c7;
  display: grid; place-items: center; font-weight: 700; font-size: 14px;
}
.ag-agent { display: flex; flex-direction: column; line-height: 1.3; }
.ag-agent-name { font-size: 14px; font-weight: 700; color: #172033; }
.ag-agent-status { font-size: 12px; color: #2e9b59; font-weight: 600; }

/* ---------- Contenu ---------- */
.ag-content { padding: 30px 32px 40px; }
.ag-grid { display: grid; grid-template-columns: 1fr 340px; gap: 24px; align-items: start; }
.ag-col-left, .ag-col-right { display: flex; flex-direction: column; gap: 20px; min-width: 0; }

/* ---------- Cartes ---------- */
.ag-card {
  background: #ffffff; border-radius: 16px;
  box-shadow: 0 4px 20px rgba(30, 20, 60, 0.06);
  padding: 24px;
}
.ag-card-title {
  display: flex; align-items: center; gap: 9px;
  font-size: 16px; font-weight: 700; color: #172033;
  margin: 0 0 16px;
}
.ag-card-title .material-symbols-outlined { color: #5427c7; font-size: 21px; }
.ag-input {
  flex: 1; height: 46px; padding: 0 14px; font-size: 14px; font-family: inherit;
  color: #172033; background: #ffffff; border: 1px solid #d9d4e5; border-radius: 10px;
  outline: none; transition: border-color 0.15s ease, box-shadow 0.15s ease; min-width: 0;
}
.ag-input:focus { border-color: #5427c7; box-shadow: 0 0 0 3px rgba(84, 39, 199, 0.13); }
.ag-scanrow { display: flex; gap: 10px; }
.ag-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 9px;
  border-radius: 10px; font-family: inherit; font-size: 15px; font-weight: 600;
  cursor: pointer; transition: background 0.16s ease, opacity 0.15s ease, transform 0.12s ease;
  border: 0;
}
.ag-btn:disabled { opacity: 0.65; cursor: not-allowed; }
.ag-btn--md { height: 44px; padding: 0 20px; }
.ag-btn--xl { width: 100%; height: 50px; font-size: 16px; margin-top: 4px; }
.ag-btn--primary { background: #5427c7; color: #ffffff; }
.ag-btn--primary:hover:not(:disabled) { background: #3f1d9a; }
.ag-btn--ghost { background: #ffffff; color: #5427c7; border: 1px solid #d9d4e5; }
.ag-btn--ghost:hover:not(:disabled) { background: #f0ebff; border-color: #b9a4ef; }
.ag-btn--done { background: #2e9b59; }
.ag-btn--done:hover { background: #2e9b59; }
.ag-linkbtn {
  display: inline-flex; align-items: center; gap: 7px; margin-top: 12px;
  background: transparent; border: 0; color: #5427c7; font-size: 13px; font-weight: 600;
  cursor: pointer; font-family: inherit; padding: 4px 2px;
}
.ag-linkbtn:hover { color: #3f1d9a; }
.ag-linkbtn .material-symbols-outlined { font-size: 18px; }
.ag-error {
  margin-top: 12px; padding: 11px 14px; border-radius: 10px;
  background: #fff0f0; border: 1px solid #f5c4c4; color: #e53935; font-size: 13.5px; line-height: 1.5;
}
.ag-empty { color: #9aa3b2; font-size: 13.5px; margin: 10px 0 0; }
.ag-count-chip {
  margin-left: auto; font-size: 12px; font-weight: 600; color: #5427c7;
  background: #f2edff; padding: 5px 12px; border-radius: 999px;
}

/* ---------- Recherche : résultats ---------- */
.ag-results { margin-top: 14px; display: flex; flex-direction: column; gap: 8px; }
.ag-result {
  display: flex; align-items: center; gap: 12px; width: 100%;
  padding: 10px 12px; border-radius: 12px; border: 1px solid #ece9f2;
  background: #faf9fd; cursor: pointer; text-align: left; font-family: inherit;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.ag-result:hover { border-color: #b9a4ef; background: #f6f2ff; }
.ag-mini-avatar {
  width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;
  background: #ede7ff; color: #5427c7; display: grid; place-items: center;
  font-weight: 700; font-size: 13px;
}
.ag-result-name { flex: 1; min-width: 0; font-size: 14px; font-weight: 600; color: #172033; display: flex; flex-direction: column; }
.ag-result-name small { font-size: 12px; color: #667085; font-weight: 500; }
.ag-result-go { color: #9aa3b2; }

/* ---------- Grande carte de validation ---------- */
.ag-validate { text-align: center; }
.ag-state-circle {
  width: 96px; height: 96px; border-radius: 50%;
  display: grid; place-items: center; margin: 4px auto 18px;
  animation: ag-pop 0.3s ease both;
}
.ag-state-inner {
  width: 72px; height: 72px; border-radius: 50%;
  display: grid; place-items: center;
  color: #ffffff; font-size: 34px; font-weight: 700;
}
.ag-state--allowed, .ag-state--done { background: #eaf8f0; }
.ag-state--allowed .ag-state-inner, .ag-state--done .ag-state-inner { background: #20a464; }
.ag-state--declined { background: #ffeded; }
.ag-state--declined .ag-state-inner { background: #e53935; }
.ag-state--pending { background: #fff6e8; }
.ag-state--pending .ag-state-inner { background: #f4a340; }
.ag-state-title { font-size: 28px; font-weight: 700; color: #172033; margin: 0 0 6px; letter-spacing: 0.5px; }
.ag-state-sub { font-size: 15.5px; color: #667085; margin: 0 auto; line-height: 1.55; max-width: 480px; }

/* ---------- Invité ---------- */
.ag-guest { margin-top: 26px; display: flex; flex-direction: column; align-items: center; gap: 6px; }
.ag-guest-avatar {
  width: 96px; height: 96px; border-radius: 50%;
  background: #ede7ff; color: #5427c7;
  display: grid; place-items: center; font-weight: 700; font-size: 30px;
  margin-bottom: 6px;
}
.ag-guest-name { font-size: 26px; font-weight: 700; color: #172033; }
.ag-guest-sub { font-size: 13px; color: #667085; font-weight: 600; letter-spacing: 0.3px; }
.ag-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 15px; border-radius: 999px; font-size: 12.5px; font-weight: 700;
}
.ag-badge .material-symbols-outlined { font-size: 15px; }
.ag-badge--ok { background: #e8f7ef; color: #218653; }
.ag-badge--no { background: #ffeded; color: #e53935; }
.ag-badge--wait { background: #fff6e8; color: #b97a1f; }

/* ---------- Carte événement ---------- */
.ag-eventbox {
  margin-top: 26px; background: #faf9fd; border: 1px solid #ece8f5;
  border-radius: 12px; padding: 20px;
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px;
}
.ag-evcol { text-align: center; min-width: 0; }
.ag-evicon { font-size: 22px; color: #5427c7; margin-bottom: 6px; }
.ag-evlabel { font-size: 11.5px; font-weight: 700; letter-spacing: 1.5px; color: #8f6fe0; margin-bottom: 5px; }
.ag-evvalue { font-size: 15px; font-weight: 600; color: #172033; line-height: 1.4; }
.ag-evsub { font-size: 13px; color: #667085; margin-top: 3px; }

/* ---------- Personnes + Check-in enregistré ---------- */
.ag-duo { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 20px; }
.ag-people, .ag-donecard {
  background: #faf9fd; border: 1px solid #ece8f5; border-radius: 12px;
  padding: 20px; text-align: center;
}
.ag-people-icon {
  width: 44px; height: 44px; border-radius: 50%; background: #ede7ff; color: #5427c7;
  display: grid; place-items: center; margin: 0 auto 10px;
}
.ag-people-label { font-size: 11.5px; font-weight: 700; letter-spacing: 1.5px; color: #8f6fe0; }
.ag-people-count { font-size: 40px; font-weight: 700; color: #5427c7; line-height: 1.1; margin: 4px 0 2px; }
.ag-people-word { font-size: 15px; font-weight: 700; color: #172033; letter-spacing: 1px; }
.ag-people-sub { font-size: 12.5px; color: #667085; margin-top: 3px; }
.ag-donecard { background: #ecf8f0; border-color: #d4efdf; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 7px; }
.ag-donecard-title { display: flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 700; color: #218653; letter-spacing: 0.8px; }
.ag-donecard-time { font-size: 17px; font-weight: 600; color: #172033; }
.ag-donecard-qty { font-size: 12px; color: #667085; }

/* ---------- Boutons secondaires ---------- */
.ag-secondary { display: flex; gap: 12px; margin-top: 16px; flex-wrap: wrap; }
.ag-secondary .ag-btn { flex: 1; min-width: 150px; height: 48px; }

/* ---------- Arrivées du jour ---------- */
.ag-presentlist { list-style: none; margin: 4px 0 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.ag-presentlist li {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px; border: 1px solid #ece9f2; border-radius: 12px; background: #faf9fd; flex-wrap: wrap;
}
.ag-present-check {
  width: 28px; height: 28px; border-radius: 50%; background: #e8f7ef; color: #218653;
  display: grid; place-items: center; flex-shrink: 0;
}
.ag-present-check .material-symbols-outlined { font-size: 16px; }
.ag-present-name { flex: 1; min-width: 0; font-size: 14px; font-weight: 600; color: #172033; display: flex; flex-direction: column; }
.ag-present-name small { font-size: 12px; color: #667085; font-weight: 500; }
.ag-chip {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600;
}
.ag-chip .material-symbols-outlined { font-size: 14px; }
.ag-chip--violet { background: #f2edff; color: #5427c7; }
.ag-chip--amber { background: #fff6e8; color: #b97a1f; }

/* ---------- Colonne droite : aperçu ---------- */
.ag-preview { position: sticky; top: 96px; }
.ag-preview-img { width: 100%; height: auto; border-radius: 12px; box-shadow: 0 6px 18px rgba(30,20,60,0.12); }
.ag-preview-qr { width: 200px; height: 200px; margin: 6px auto 0; display: block; }
.ag-preview-info { margin-top: 16px; text-align: left; }
.ag-preview-h { font-size: 13px; font-weight: 700; color: #172033; margin: 0 0 6px; }
.ag-preview-desc { font-size: 13px; color: #667085; line-height: 1.55; margin: 0 0 10px; }
.ag-preview-valid { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #218653; }
.ag-preview-valid .material-symbols-outlined { font-size: 17px; }
.ag-preview-clock { font-size: 12px; color: #667085; margin: 12px 0 16px; line-height: 1.6; }
.ag-preview-clock strong { color: #172033; font-weight: 600; }

/* ---------- Visionneuse / Modal caméra ---------- */
.ag-viewer {
  position: fixed; inset: 0; z-index: 100; background: rgba(0, 0, 0, 0.65);
  display: flex; align-items: center; justify-content: center; padding: 18px;
}
.ag-viewer-box {
  background: #ffffff; border-radius: 16px; width: min(560px, 100%); max-height: 92vh;
  display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 24px 70px rgba(0,0,0,0.3);
}
.ag-viewer-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid #ece9f2; font-weight: 700; font-size: 14px; color: #172033; }
.ag-viewer-close { border: 0; background: transparent; cursor: pointer; color: #667085; padding: 4px; border-radius: 8px; }
.ag-viewer-close:hover { background: #f4f2fa; color: #172033; }
.ag-viewer-body { overflow: auto; padding: 18px; display: grid; place-items: center; background: #f8f7fc; }
.ag-viewer-body img { max-width: 100%; max-height: 74vh; width: auto; height: auto; border-radius: 10px; box-shadow: 0 6px 18px rgba(30,20,60,0.18); }
.ag-viewer-foot { padding: 14px 18px; border-top: 1px solid #ece9f2; display: flex; justify-content: flex-end; }
.ag-camera-box { width: min(480px, 100%); }
.ag-camera-zone { background: #000; aspect-ratio: 1; display: grid; place-items: center; }
.ag-camera-video { width: 100%; height: 100%; object-fit: cover; }

/* ---------- Animations ---------- */
@keyframes ag-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes ag-pop {
  from { opacity: 0; transform: scale(0.7); }
  to { opacity: 1; transform: scale(1); }
}
.ag-spin {
  width: 16px; height: 16px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.4); border-top-color: #ffffff; animation: ag-rot 0.7s linear infinite;
}
@keyframes ag-rot { to { transform: rotate(360deg); } }

/* ---------- Responsive ---------- */
@media (max-width: 1100px) {
  .ag-grid { grid-template-columns: 1fr; }
  .ag-preview { position: static; }
}
@media (max-width: 768px) {
  .ag-sidebar {
    position: fixed; left: -250px; top: 0; bottom: 0; z-index: 60;
    transition: left 0.22s ease;
  }
  .ag-sidebar--open { left: 0; }
  .ag-backdrop { position: fixed; inset: 0; z-index: 55; background: rgba(0,0,0,0.35); }
  .ag-burger { display: inline-flex; }
  .ag-header { padding: 0 14px; }
  .ag-agent { display: none; }
  .ag-header-title h1 { font-size: 22px; }
  .ag-content { padding: 18px 14px 32px; }
  .ag-eventbox { grid-template-columns: 1fr; gap: 12px; }
  .ag-duo { grid-template-columns: 1fr; }
  .ag-secondary { flex-direction: column; }
}
</style>