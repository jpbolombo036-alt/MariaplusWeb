<template>
  <div class="mp-inv-page">
    <div class="mp-inv-card">

      <!-- État : chargement -->
      <div v-if="loading" class="mp-inv-centered">
        <span class="mp-spinner"></span>
        <p class="mp-inv-centered-text">Chargement de votre invitation…</p>
      </div>

      <!-- État : invitation indisponible / expirée / annulée / erreur -->
      <div v-else-if="unavailable" class="mp-inv-centered mp-inv-unavailable">
        <span class="mp-inv-unavailable-icon material-symbols-outlined">mark_email_unread</span>
        <h1 class="mp-inv-unavailable-title">Invitation indisponible</h1>
        <p class="mp-inv-unavailable-text">{{ unavailableText }}</p>
        <span class="mp-inv-heart mp-inv-heart--violet">♥</span>
      </div>

      <!-- Carte d'invitation -->
      <template v-else-if="inv">
        <!-- ================= COUVERTURE ================= -->
        <div class="mp-inv-cover">
          <template v-if="photos.length">
            <div ref="carouselEl" class="mp-inv-photos" @scroll.passive="onCarouselScroll">
              <img
                v-for="(p, idx) in photos"
                :key="idx"
                :src="absoluteUrl(p)"
                :alt="'Photo de l’événement'"
                class="mp-inv-photo"
              />
            </div>
            <div v-if="photos.length > 1" class="mp-inv-dots">
              <button
                v-for="(p, idx) in photos"
                :key="'d' + idx"
                type="button"
                class="mp-inv-dot"
                :class="{ 'mp-inv-dot--active': carouselIdx === idx }"
                :aria-label="'Voir la photo ' + (idx + 1)"
                @click="goToCarousel(idx)"
              ></button>
            </div>
          </template>
          <div v-else class="mp-inv-cover-fallback"></div>
          <div class="mp-inv-cover-shade"></div>

          <div class="mp-inv-logo">
            <img src="/logo.png" alt="" class="mp-inv-logo-img" />
            <span class="mp-inv-logo-text">MariagePlus</span>
          </div>

          <div class="mp-inv-cover-content">
            <span v-if="typeLabel" class="mp-inv-type">{{ typeLabel }}</span>
            <h1 class="mp-inv-title">{{ title }}</h1>
            <span class="mp-inv-heart">♥</span>
            <p class="mp-inv-tagline">
              Nous avons le plaisir de vous inviter à partager ce moment exceptionnel avec nous.
            </p>
          </div>
        </div>

        <!-- ================= CORPS ================= -->
        <div class="mp-inv-body">

          <!-- Informations de l'événement -->
          <section v-if="hasEventInfo" class="mp-inv-section">
            <h2 class="mp-inv-section-title">
              <span class="mp-inv-sep mp-inv-sep--left"></span>
              Informations de l’événement
              <span class="mp-inv-sep mp-inv-sep--right"></span>
            </h2>

            <div class="mp-inv-infos">
              <div v-if="dateValue" class="mp-inv-info">
                <span class="mp-inv-info-icon"><span class="material-symbols-outlined">calendar_month</span></span>
                <span class="mp-inv-info-label">DATE</span>
                <span class="mp-inv-info-value">{{ dateValue }}</span>
                <span v-if="dayOfWeekText" class="mp-inv-info-sub">{{ dayOfWeekText }}</span>
              </div>

              <div v-if="timeValue" class="mp-inv-info">
                <span class="mp-inv-info-icon"><span class="material-symbols-outlined">schedule</span></span>
                <span class="mp-inv-info-label">HEURE</span>
                <span class="mp-inv-info-value">{{ timeValue }}</span>
                <span class="mp-inv-info-sub">Heure locale</span>
              </div>

              <div v-if="venueValue" class="mp-inv-info">
                <span class="mp-inv-info-icon"><span class="material-symbols-outlined">location_on</span></span>
                <span class="mp-inv-info-label">LIEU</span>
                <span class="mp-inv-info-value">{{ venueValue }}</span>
                <span v-if="venueSub" class="mp-inv-info-sub">{{ venueSub }}</span>
              </div>
            </div>

            <p v-if="inv.message" class="mp-inv-message">{{ inv.message }}</p>
          </section>

          <!-- Votre invitation -->
          <section class="mp-inv-you">
            <h3 class="mp-inv-you-title">
              <span class="material-symbols-outlined">mail</span>
              Votre invitation
            </h3>
            <p class="mp-inv-you-text">
              Bonjour {{ firstNameText }}, nous serions heureux de vous compter parmi nous.
            </p>
            <p class="mp-inv-you-count">
              <span class="material-symbols-outlined">group</span>
              Invitation valable pour <strong>{{ maxAccepted }}</strong> personne(s)
            </p>
          </section>

          <!-- ================= RSVP ================= -->
          <section class="mp-inv-section mp-inv-rsvp">
            <h2 class="mp-inv-section-title">Confirmez votre présence</h2>
            <span class="mp-inv-heart mp-inv-heart--violet">♥</span>

            <!-- État succès -->
            <div v-if="success" class="mp-inv-success" :class="success">
              <span class="mp-inv-success-icon">✓</span>
              <h3 class="mp-inv-success-title">Merci pour votre réponse !</h3>
              <p class="mp-inv-success-text">{{ successText }}</p>
              <p v-if="success === 'ACCEPTED'" class="mp-inv-success-count">
                <span class="material-symbols-outlined">group</span>
                {{ confirmedCount }} personne(s) confirmée(s)
              </p>
              <div v-if="success === 'ACCEPTED' && qrDataUri" class="mp-inv-qr">
                <img :src="qrDataUri" alt="Code QR d’entrée à l’événement" />
                <button type="button" class="mp-inv-link" @click="downloadQr">
                  Télécharger le code QR d’entrée
                </button>
              </div>
              <button type="button" class="mp-inv-link" @click="editAnswer">Modifier ma réponse</button>
            </div>

            <!-- Choix ACCEPTED / DECLINED -->
            <div v-else class="mp-inv-choices">
              <button
                type="button"
                class="mp-inv-choice"
                :class="{ 'mp-inv-choice--ok': choice === 'ACCEPTED' }"
                @click="choice = 'ACCEPTED'"
              >
                <span class="mp-inv-choice-icon">✓</span>
                <span class="mp-inv-choice-title">Je serai présent(e)</span>
                <span class="mp-inv-choice-desc">Nous avons hâte de vous accueillir !</span>
              </button>
              <button
                type="button"
                class="mp-inv-choice"
                :class="{ 'mp-inv-choice--no': choice === 'DECLINED' }"
                @click="choice = 'DECLINED'"
              >
                <span class="mp-inv-choice-icon">✕</span>
                <span class="mp-inv-choice-title">Je ne pourrai pas venir</span>
                <span class="mp-inv-choice-desc">Désolé, je ne pourrai pas être des vôtres.</span>
              </button>
            </div>

            <!-- Formulaire ACCEPTED -->
            <form v-if="choice === 'ACCEPTED'" class="mp-inv-form" novalidate @submit.prevent="submitAccepted">
              <label class="mp-inv-label" for="mp-attendees">
                Nombre de personnes présentes <span class="mp-inv-label-muted">(vous inclus)</span>
              </label>
              <div class="mp-inv-stepper">
                <button type="button" class="mp-inv-step-btn" :disabled="attendees <= 1" aria-label="Retirer une personne" @click="attendees--">−</button>
                <span class="mp-inv-step-value">{{ attendees }}</span>
                <button type="button" class="mp-inv-step-btn" :disabled="attendees >= maxAccepted" aria-label="Ajouter une personne" @click="attendees++">+</button>
              </div>
              <p class="mp-inv-hint">Vous pouvez inviter jusqu'à {{ maxAccepted }} personne(s) au total.</p>

              <template v-if="drinks.length">
                <label class="mp-inv-label" for="mp-drink">
                  Votre boisson préférée <span class="mp-inv-label-muted">(optionnel)</span>
                </label>
                <select id="mp-drink" v-model="drinkChoice" class="mp-inv-input" :disabled="drinksLoading">
                  <option value="">Choisir une boisson…</option>
                  <option v-for="d in drinks" :key="d.id" :value="d.name">{{ d.name }}</option>
                </select>
              </template>

              <label class="mp-inv-label" for="mp-note">
                Message pour les mariés <span class="mp-inv-label-muted">(optionnel)</span>
              </label>
              <textarea id="mp-note" v-model="note" class="mp-inv-input" rows="4" maxlength="250" placeholder="Écrivez un petit mot…"></textarea>
              <span class="mp-inv-count">{{ note.length }} / 250</span>

              <button type="submit" class="mp-inv-btn mp-inv-btn--primary" :disabled="sending || attendees < 1">
                <span v-if="sending" class="mp-spinner mp-spinner--sm"></span>
                <span v-else class="mp-inv-btn-icon">✓</span>
                {{ sending ? 'Envoi en cours…' : 'Confirmer ma présence' }}
              </button>
            </form>

            <!-- Formulaire DECLINED -->
            <form v-else-if="choice === 'DECLINED'" class="mp-inv-form" novalidate @submit.prevent="submitDecline">
              <button type="submit" class="mp-inv-btn mp-inv-btn--decline" :disabled="sending">
                <span v-if="sending" class="mp-spinner mp-spinner--sm"></span>
                <span v-else class="mp-inv-btn-icon">✕</span>
                {{ sending ? 'Envoi en cours…' : 'Confirmer mon absence' }}
              </button>
            </form>

            <!-- Erreur -->
            <p v-if="errorMessage" class="mp-inv-error">{{ errorMessage }}</p>
          </section>

          <!-- Besoin d'aide ? (uniquement si le backend fournit les coordonnées) -->
          <section v-if="helpPhone || helpEmail" class="mp-inv-help">
            <div class="mp-inv-help-text">
              <h3 class="mp-inv-help-title">Besoin d'aide ?</h3>
              <p class="mp-inv-help-desc">
                Si vous avez des questions concernant cet événement, n'hésitez pas à contacter l'organisateur.
              </p>
            </div>
            <div class="mp-inv-help-actions">
              <a v-if="helpPhone" :href="'tel:' + helpPhone" class="mp-inv-help-action">
                <span class="material-symbols-outlined">call</span>{{ helpPhone }}
              </a>
              <a v-if="helpEmail" :href="'mailto:' + helpEmail" class="mp-inv-help-action">
                <span class="material-symbols-outlined">mail</span>{{ helpEmail }}
              </a>
            </div>
          </section>
        </div>

        <!-- ================= FOOTER ================= -->
        <footer class="mp-inv-footer">
          <p class="mp-inv-footer-brand">
            <span class="mp-inv-footer-heart">♥</span>
            Propulsé par <strong class="mp-inv-footer-strong">MariagePlus</strong>
          </p>
          <p v-if="deadlineText" class="mp-inv-footer-deadline">
            Merci de répondre avant le {{ deadlineText }}
          </p>
        </footer>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import QRCode from 'qrcode'
import { ApiConfig } from '../api/config'
import {
  getPublicInvitation,
  listPublicDrinks,
  submitPublicRsvp,
  type PublicInvitation,
} from '../api/publicInvitation'

const route = useRoute()
const token = String(route.params.token ?? '')

/* ---------- États ---------- */
const loading = ref(true)
const unavailable = ref(false)
const unavailableText = ref('')
const inv = ref<PublicInvitation | null>(null)
const choice = ref<'ACCEPTED' | 'DECLINED' | ''>('')
const success = ref<'ACCEPTED' | 'DECLINED' | ''>('')
const attendees = ref(1)
const note = ref('')
const drinkChoice = ref('')
const drinks = ref<{ id: number; name: string }[]>([])
const drinksLoading = ref(false)
const sending = ref(false)
const errorMessage = ref('')
const qrDataUri = ref('')

/* ---------- Données dérivées (source de vérité = backend) ---------- */
const maxAccepted = computed(() => {
  const n = inv.value?.maxAccepted
  return n != null && n > 0 ? n : 1
})

const firstNameText = computed(() => {
  const fn = inv.value?.guestFirstName?.trim()
  return fn ? fn : 'cher invité'
})

const title = computed(
  () => inv.value?.weddingDisplayName?.trim() || inv.value?.eventName?.trim() || 'Notre invitation',
)

/* Type — affiché uniquement si le backend l'expose (eventType). Sinon, badge masqué. */
const TYPE_LABELS: Record<string, string> = {
  WEDDING: 'Mariage',
  COLLATION: 'Collation',
  BIRTHDAY: 'Anniversaire',
  GRADUATION: 'Diplôme',
  PARTY: 'Fête',
  CONFERENCE: 'Conférence',
  OTHER: 'Événement',
}
const typeLabel = computed(() => {
  const t = (inv.value as unknown as { eventType?: string })?.eventType
  return t ? TYPE_LABELS[t] ?? t : ''
})

/* Date / heure / lieu (formatage UI de données déjà fournies par le backend) */
const MONTHS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

function parseFrenchDate(s: string): Date | null {
  const m = s.trim().match(/^(\d{1,2})\s+([a-zà-ÿ]+)\s+(\d{4})$/i)
  if (!m) return null
  const idx = MONTHS_FR.findIndex((mo) => mo.toLowerCase() === m[2]?.toLowerCase())
  if (idx < 0) return null
  return new Date(Number(m[3]), idx, Number(m[1]))
}

const dateValue = computed(() => inv.value?.eventDate?.trim() || '')
const dayOfWeekText = computed(() => {
  if (!dateValue.value) return ''
  const d = parseFrenchDate(dateValue.value)
  if (!d) return ''
  try {
    return new Intl.DateTimeFormat('fr-FR', { weekday: 'long' }).format(d)
  } catch {
    return ''
  }
})
const timeValue = computed(() => {
  const t = inv.value?.eventStartTime?.trim()
  if (!t) return ''
  const m = t.match(/^(\d{1,2})h(\d{2})$/)
  return m ? `${m[1]}:${m[2]}` : t
})
const venueParts = computed(() =>
  (inv.value?.eventVenue?.trim() || '').split(',').map((s) => s.trim()).filter(Boolean),
)
const venueValue = computed(() => venueParts.value[0] || '')
const venueSub = computed(() => (venueParts.value.length > 1 ? venueParts.value.slice(1).join(' · ') : ''))
const hasEventInfo = computed(() => Boolean(dateValue.value || timeValue.value || venueValue.value))

/* Coordonnées organisateur & date limite — uniquement si le backend les fournit. */
const helpPhone = computed(() => String((inv.value as unknown as { organizerPhone?: string })?.organizerPhone ?? ''))
const helpEmail = computed(() => String((inv.value as unknown as { organizerEmail?: string })?.organizerEmail ?? ''))
const deadlineText = computed(() => {
  const d = (inv.value as unknown as { rsvpDeadline?: string })?.rsvpDeadline
  if (!d) return ''
  const parsed = parseFrenchDate(String(d)) || new Date(String(d))
  if (isNaN(parsed.getTime())) return String(d)
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(parsed)
})

/* ---------- Succès ---------- */
const confirmedCount = computed(() => inv.value?.rsvpNumberOfAttendees ?? 0)
const successText = computed(() =>
  success.value === 'ACCEPTED'
    ? 'Votre présence a bien été confirmée.'
    : 'Votre réponse a bien été enregistrée. Merci pour votre retour.',
)

function editAnswer() {
  success.value = ''
  choice.value = ''
  errorMessage.value = ''
  if (inv.value?.rsvpNumberOfAttendees) {
    attendees.value = Math.min(Math.max(inv.value.rsvpNumberOfAttendees, 1), maxAccepted.value)
  }
  note.value = ''
}

/* ---------- Carrousel photos : couple / marié / mariée ---------- */
const carouselEl = ref<HTMLElement | null>(null)
const carouselIdx = ref(0)
const photos = computed<string[]>(() => {
  const list = [inv.value?.couplePhotoUrl, inv.value?.groomPhotoUrl, inv.value?.bridePhotoUrl]
  return list.filter((u): u is string => !!u && u.trim() !== '')
})

function absoluteUrl(u?: string | null): string {
  if (!u) return ''
  if (/^https?:\/\//i.test(u)) return u
  if (u.startsWith('/')) return ApiConfig.baseUrl + u
  return u
}

function onCarouselScroll() {
  const el = carouselEl.value
  if (!el) return
  carouselIdx.value = Math.round(el.scrollLeft / el.clientWidth)
}
function goToCarousel(idx: number) {
  const el = carouselEl.value
  if (!el) return
  el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' })
}

const AUTOPLAY_MS = 4500
let autoTimer: number | null = null
function startAutoplay() {
  stopAutoplay()
  if (photos.value.length < 2) return
  autoTimer = window.setInterval(() => {
    const el = carouselEl.value
    if (!el) return
    const next = (carouselIdx.value + 1) % photos.value.length
    el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' })
  }, AUTOPLAY_MS)
}
function stopAutoplay() {
  if (autoTimer !== null) {
    clearInterval(autoTimer)
    autoTimer = null
  }
}

/* ---------- Chargement ---------- */
async function genQr(): Promise<string> {
  if (!inv.value?.publicToken) return ''
  return QRCode.toDataURL(inv.value.publicToken, { width: 260, margin: 1 })
}

async function loadDrinks() {
  drinksLoading.value = true
  try {
    drinks.value = await listPublicDrinks(token)
  } catch {
    // non bloquant : la boisson reste facultative
  } finally {
    drinksLoading.value = false
  }
}

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    inv.value = await getPublicInvitation(token)
    const st = inv.value?.status
    if (st === 'CANCELLED') {
      unavailable.value = true
      unavailableText.value = "Cette invitation a été annulée par l'organisateur."
    } else if (st === 'EXPIRED') {
      unavailable.value = true
      unavailableText.value = 'Cette invitation a expiré.'
    } else if (inv.value?.rsvpStatus === 'ACCEPTED') {
      success.value = 'ACCEPTED'
      qrDataUri.value = await genQr()
    } else if (inv.value?.rsvpStatus === 'DECLINED') {
      success.value = 'DECLINED'
    } else {
      success.value = ''
    }
    drinkChoice.value = inv.value?.rsvpDrinkChoice || ''
    startAutoplay()
  } catch (e: any) {
    unavailable.value = true
    if (!e?.response) {
      unavailableText.value = 'Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.'
    } else if (e.response.status === 404) {
      unavailableText.value = "Cette invitation n'est plus accessible ou n'existe pas."
    } else if (e.response.status === 410) {
      unavailableText.value = 'Cette invitation a expiré.'
    } else {
      unavailableText.value = 'Une erreur est survenue. Merci de réessayer plus tard.'
    }
  } finally {
    loading.value = false
  }
}

/* ---------- Soumission ---------- */
async function submitAccepted() {
  if (attendees.value < 1 || attendees.value > maxAccepted.value) {
    errorMessage.value = `Le nombre doit être compris entre 1 et ${maxAccepted.value}.`
    return
  }
  sending.value = true
  errorMessage.value = ''
  try {
    await submitPublicRsvp(token, 'ACCEPTED', attendees.value, drinkChoice.value || undefined)
    inv.value = await getPublicInvitation(token)
    success.value = 'ACCEPTED'
    qrDataUri.value = await genQr()
  } catch (e: any) {
    const msg = String(e?.response?.data?.error || '')
    if (/limit|capacit|maximum|dépass|dépasse|places/i.test(msg)) {
      errorMessage.value = 'La limite de participants pour cette invitation est atteinte.'
    } else if (!e?.response) {
      errorMessage.value = 'Erreur réseau. Vérifiez votre connexion et réessayez.'
    } else {
      errorMessage.value = 'Erreur serveur. Merci de réessayer.'
    }
  } finally {
    sending.value = false
  }
}

async function submitDecline() {
  sending.value = true
  errorMessage.value = ''
  try {
    await submitPublicRsvp(token, 'DECLINED', 0)
    inv.value = await getPublicInvitation(token)
    success.value = 'DECLINED'
    qrDataUri.value = ''
  } catch (e: any) {
    errorMessage.value = e?.response ? 'Erreur serveur. Merci de réessayer.' : 'Erreur réseau. Vérifiez votre connexion et réessayez.'
  } finally {
    sending.value = false
  }
}

function downloadQr() {
  if (!qrDataUri.value) return
  const link = document.createElement('a')
  link.href = qrDataUri.value
  link.download = `qr-invitation-${token}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/* ---------- Cycle de vie ---------- */
watch(maxAccepted, (max) => {
  if (attendees.value > max) attendees.value = max
})
onMounted(() => {
  load()
  loadDrinks() // boissons disponibles pour l'événement (sélecteur dans le formulaire ACCEPTED)
})
onBeforeUnmount(stopAutoplay)
</script>

<style>
/* ============================================================
   Page publique d'invitation — design premium MariagePlus
   Classes préfixées .mp-inv-* (global) pour ne pas entrer en
   conflit avec le dashboard. Mode sombre via html.dark.
   ============================================================ */

.mp-inv-page {
  min-height: 100vh;
  background: #f8f7fc;
  padding: 40px 16px 48px;
  font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
  color: #1d1733;
  animation: mp-fade-in 0.3s ease both;
}

.mp-inv-card {
  max-width: 860px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 15px 50px rgba(40, 25, 80, 0.10);
  overflow: hidden;
}

/* ---------- Chargement / indisponible ---------- */
.mp-inv-centered {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 14px;
  padding: 72px 28px;
  min-height: 320px;
  animation: mp-fade-in 0.25s ease both;
}
.mp-inv-centered-text {
  font-size: 15px;
  color: #667085;
}
.mp-spinner {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 3px solid #e7e3f0;
  border-top-color: #5427c7;
  animation: mp-spin 0.8s linear infinite;
}
.mp-spinner--sm { width: 16px; height: 16px; border-width: 2px; }
.mp-inv-unavailable-icon {
  font-size: 40px;
  color: #5427c7;
}
.mp-inv-unavailable-title {
  font-family: 'Playfair Display', serif;
  font-size: 26px;
  font-weight: 700;
  color: #1d1733;
}
.mp-inv-unavailable-text {
  font-size: 15px;
  line-height: 1.6;
  color: #667085;
  max-width: 420px;
}

/* ---------- Couverture ---------- */
.mp-inv-cover {
  position: relative;
  height: 320px;
  overflow: hidden;
  border-radius: 24px 24px 0 0;
}
.mp-inv-photos {
  position: absolute;
  inset: 0;
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.mp-inv-photos::-webkit-scrollbar { display: none; }
.mp-inv-photo {
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
  object-fit: cover;
  scroll-snap-align: center;
}
.mp-inv-cover-fallback {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #5427c7 0%, #3f1d9a 55%, #2a1166 100%);
}
.mp-inv-cover-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(20, 8, 48, 0.28) 0%, rgba(20, 8, 48, 0.05) 38%, rgba(20, 8, 48, 0.62) 100%);
}
.mp-inv-dots {
  position: absolute;
  bottom: 168px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 6px;
}
.mp-inv-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.55);
  transition: all 0.2s ease;
  padding: 0;
  border: 0;
}
.mp-inv-dot--active { width: 18px; background: #ffffff; }

.mp-inv-logo {
  position: absolute;
  top: 18px;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.mp-inv-logo-img { width: 22px; height: 22px; object-fit: contain; }
.mp-inv-logo-text {
  color: #ffffff;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.2px;
  text-shadow: 0 1px 6px rgba(20, 8, 48, 0.45);
}

.mp-inv-cover-content {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 28px 12px;
}
.mp-inv-type {
  background: #5427c7;
  color: #ffffff;
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  margin-bottom: 14px;
}
.mp-inv-title {
  font-family: 'Playfair Display', serif;
  font-size: 40px;
  font-weight: 700;
  line-height: 1.12;
  color: #ffffff;
  text-shadow: 0 2px 16px rgba(20, 8, 48, 0.5);
  margin: 0;
}
.mp-inv-heart {
  color: #ffffff;
  font-size: 18px;
  margin: 10px 0 8px;
  line-height: 1;
  text-shadow: 0 1px 8px rgba(20, 8, 48, 0.5);
}
.mp-inv-heart--violet { color: #5427c7; margin: 10px auto 22px; text-shadow: none; }
.mp-inv-tagline {
  color: #ffffff;
  font-size: 16px;
  line-height: 1.6;
  max-width: 600px;
  margin: 0;
  text-shadow: 0 1px 10px rgba(20, 8, 48, 0.55);
}

/* ---------- Corps ---------- */
.mp-inv-body { padding: 36px 40px 0; }

.mp-inv-section {
  padding: 12px 0 8px;
}
.mp-inv-section-title {
  font-family: 'Playfair Display', serif;
  font-size: 22px;
  font-weight: 700;
  text-align:center;
  color: #1d1733;
  margin:0 0 6px;
}

/* Séparateurs décoratifs autour du titre */
.mp-inv-sep {
  display:inline-block;
  width:26px;
  height:2px;
  border-radius:2px;
  vertical-align:middle;
  margin:0 10px 4px;
  background:#cbb8f5;
}
.mp-inv-sep--left,
.mp-inv-sep--right { background: linear-gradient(90deg, rgba(84,39,199,0) 0%, #8f6fe0 100%); }
.mp-inv-sep--right { transform: scaleX(-1); }

/* ---------- Informations DATE / HEURE / LIEU ---------- */
.mp-inv-infos {
  display:grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  margin-top: 26px;
}
.mp-inv-info {
  display:flex;
  flex-direction:column;
  align-items:center;
  text-align:center;
  gap: 3px;
  padding: 14px 8px;
}
.mp-inv-info-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #f0ebff;
  color: #5427c7;
  display:grid;
  place-items:center;
  margin-bottom: 8px;
}
.mp-inv-info-icon .material-symbols-outlined { font-size: 26px; }
.mp-inv-info-label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1.2px;
  color: #8f6fe0;
}
.mp-inv-info-value {
  font-size: 15px;
  font-weight: 600;
  color: #1d1733;
  line-height: 1.35;
}
.mp-inv-info-sub {
  font-size: 13px;
  color: #667085;
}
.mp-inv-message {
  margin: 22px auto 4px;
  max-width: 620px;
  text-align:center;
  font-size: 16px;
  line-height: 1.7;
  color: #4b4468;
  font-style: italic;
}

/* ---------- Votre invitation ---------- */
.mp-inv-you {
  margin-top: 26px;
  background: #f9f6ff;
  border: 1px solid #e6dfff;
  border-radius: 14px;
  padding: 22px;
  text-align:center;
}
.mp-inv-you-title {
  display:flex;
  align-items:center;
  justify-content:center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: #5427c7;
  margin: 0 0 10px;
}
.mp-inv-you-title .material-symbols-outlined { font-size: 18px; }
.mp-inv-you-text {
  font-size: 15px;
  line-height: 1.6;
  color: #1d1733;
  margin: 0 0 12px;
}
.mp-inv-you-count {
  display:inline-flex;
  align-items:center;
  gap: 6px;
  font-size: 14px;
  color: #667085;
  background: #ffffff;
  border: 1px solid #e6dfff;
  padding: 7px 14px;
  border-radius: 999px;
  margin: 0;
}
.mp-inv-you-count .material-symbols-outlined { font-size: 16px; color: #8f6fe0; }
.mp-inv-you-count strong { color: #5427c7; }

/* ---------- Choix RSVP ---------- */
.mp-inv-choices {
  display:grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: 20px;
}
.mp-inv-choice {
  display:flex;
  flex-direction:column;
  align-items:center;
  text-align:center;
  gap: 6px;
  padding: 22px 16px 20px;
  border-radius: 14px;
  border: 1.5px solid #d9d5e5;
  background: #ffffff;
  cursor:pointer;
  transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
}
.mp-inv-choice:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(40,25,80,0.08); }
.mp-inv-choice--ok {
  border-color: #2e9b59;
  background: #f5fcf7;
}
.mp-inv-choice--no {
  border-color: #e53935;
  background: #fff7f7;
}
.mp-inv-choice-icon {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display:grid;
  place-items:center;
  font-size: 16px;
  color: #667085;
  background: #f0ebff;
  transition: all 0.18s ease;
}
.mp-inv-choice--ok .mp-inv-choice-icon {
  background: #2e9b59;
  color: #ffffff;
}
.mp-inv-choice--no .mp-inv-choice-icon {
  background: #e53935;
  color: #ffffff;
}
.mp-inv-choice-title {
  font-size: 15px;
  font-weight: 700;
  color: #1d1733;
}
.mp-inv-choice--ok .mp-inv-choice-title { color: #2e9b59; }
.mp-inv-choice--no .mp-inv-choice-title { color: #e53935; }
.mp-inv-choice-desc {
  font-size: 13px;
  color: #667085;
  line-height: 1.5;
}

/* ---------- Formulaire ---------- */
.mp-inv-form {
  margin-top: 22px;
  text-align: left;
  display:flex;
  flex-direction:column;
  gap: 8px;
  animation: mp-rise 0.22s ease both;
}
.mp-inv-label {
  font-size: 13px;
  font-weight: 600;
  color: #1d1733;
  margin-top: 6px;
}
.mp-inv-label-muted { color: #9aa3b2; font-weight: 400; }
.mp-inv-stepper {
  display:flex;
  align-items:center;
  justify-content:space-between;
  width: 100%;
  max-width: 220px;
  height: 48px;
  border: 1px solid #d8d3e8;
  border-radius: 10px;
  background: #ffffff;
  overflow: hidden;
}
.mp-inv-step-btn {
  width: 52px;
  height: 100%;
  font-size: 22px;
  font-weight: 600;
  color: #5427c7;
  background: transparent;
  border: 0;
  cursor: pointer;
  transition: background 0.15s ease;
}
.mp-inv-step-btn:hover:not(:disabled) { background: #f0ebff; }
.mp-inv-step-btn:disabled { color: #c9c4d9; cursor: not-allowed; }
.mp-inv-step-value {
  font-size: 17px;
  font-weight: 700;
  color: #1d1733;
}

.mp-inv-hint {
  font-size: 13px;
  color: #667085;
  margin: 2px 0 6px;
}
.mp-inv-input {
  width: 100%;
  height: 46px;
  padding: 0 14px;
  font-size: 14px;
  font-family: inherit;
  color: #1d1733;
  background: #ffffff;
  border: 1px solid #d8d3e8;
  border-radius: 10px;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
textarea.mp-inv-input {
  height: auto;
  padding-top: 12px;
  padding-bottom: 12px;
  resize: vertical;
}
.mp-inv-input::placeholder { color: #9aa3b2; }
.mp-inv-input:focus {
  border-color: #5427c7;
  box-shadow: 0 0 0 3px rgba(84, 39, 199, 0.14);
}
.mp-inv-count {
  align-self: flex-end;
  font-size: 12px;
  color: #9aa3b2;
  margin-top: -2px;
}
.mp-inv-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 50px;
  border: 0;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  margin-top: 12px;
  transition: background 0.18s ease, transform 0.12s ease, opacity 0.15s ease;
}
.mp-inv-btn:active:not(:disabled) { transform: translateY(1px); }
.mp-inv-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.mp-inv-btn--primary { background: #5427c7; color: #ffffff; }
.mp-inv-btn--primary:hover:not(:disabled) { background: #3f1d9a; }
.mp-inv-btn--decline { background: #fff0f0; color: #e53935; border: 1px solid #f5c4c4; }
.mp-inv-btn--decline:hover:not(:disabled) { background: #ffe3e3; }

/* ---------- Erreur ---------- */
.mp-inv-error {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 10px;
  background: #fff0f0;
  border: 1px solid #f5c4c4;
  color: #e53935;
  font-size: 14px;
  line-height: 1.5;
  animation: mp-fade-in 0.2s ease both;
}

/* ---------- Succès ---------- */
.mp-inv-success {
  margin-top: 22px;
  padding: 30px 22px;
  border-radius: 14px;
  text-align: center;
  border: 1.5px solid #2e9b59;
  background: #ecf8f0;
  animation: mp-rise 0.25s ease both;
}
.mp-inv-success.DECLINED {
  border-color: #e53935;
  background: #fff0f0;
}
.mp-inv-success-icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #2e9b59;
  color: #fff;
  font-size: 24px;
  display: grid;
  place-items: center;
  margin: 0 auto 12px;
}
.mp-inv-success.DECLINED .mp-inv-success-icon { background: #e53935; }
.mp-inv-success-title {
  font-family: 'Playfair Display', serif;
  font-size: 20px;
  font-weight: 700;
  color: #1d1733;
  margin: 0 0 6px;
}
.mp-inv-success-text { font-size: 15px; color: #4b4468; margin: 0; }
.mp-inv-success-count {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 12px 0 0;
  font-size: 14px;
  font-weight: 600;
  color: #2e9b59;
  background: #ffffff;
  padding: 8px 16px;
  border-radius: 999px;
}
.mp-inv-qr {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.mp-inv-qr img {
  width: 120px;
  height: 120px;
  border-radius: 10px;
  background: #ffffff;
  padding: 6px;
  box-shadow: 0 4px 14px rgba(40, 25, 80, 0.12);
}
.mp-inv-link {
  background: transparent;
  border: 0;
  color: #5427c7;
  font-size: 13px;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
  font-family: inherit;
  padding: 4px 6px;
}
.mp-inv-link:hover { color: #3f1d9a; }

/* ---------- Besoin d'aide ---------- */
.mp-inv-help {
  margin-top: 26px;
  padding: 20px 22px;
  border-radius: 14px;
  background: #f8f7fc;
  border: 1px solid #e7e3f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.mp-inv-help-title {
  font-size: 15px;
  font-weight: 700;
  color: #1d1733;
  margin: 0 0 4px;
}
.mp-inv-help-desc {
  font-size: 13px;
  color: #667085;
  margin: 0;
  line-height: 1.5;
}
.mp-inv-help-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.mp-inv-help-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 14px;
  border-radius: 999px;
  background: #ffffff;
  border: 1px solid #e6dfff;
  color: #5427c7;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.mp-inv-help-action:hover { border-color: #5427c7; background: #f0ebff; }
.mp-inv-help-action .material-symbols-outlined { font-size: 17px; }

/* ---------- Footer ---------- */
.mp-inv-footer {
  margin-top: 34px;
  padding: 22px 20px 26px;
  text-align: center;
  background: transparent;
}
.mp-inv-footer-brand {
  font-size: 13px;
  color: #667085;
  margin: 0;
}
.mp-inv-footer-strong { color: #5427c7; }
.mp-inv-footer-heart { color: #e53935; margin-right: 6px; }
.mp-inv-footer-deadline {
  font-size: 12px;
  color: #9aa3b2;
  margin: 6px 0 0;
}

/* ---------- Animations ---------- */
@keyframes mp-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes mp-rise {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes mp-spin {
  to { transform: rotate(360deg); }
}

/* ---------- Mode sombre (palette dédiée, sans tout inverser) ---------- */
html.dark .mp-inv-page { background: #100d18; color: #f7f5ff; }
html.dark .mp-inv-card { background: #191522; box-shadow: 0 15px 50px rgba(0, 0, 0, 0.45); }
html.dark .mp-inv-section-title,
html.dark .mp-inv-unavailable-title,
html.dark .mp-inv-choice-title,
html.dark .mp-inv-success-title,
html.dark .mp-inv-you-text,
html.dark .mp-inv-help-title,
html.dark .mp-inv-label,
html.dark .mp-inv-info-value,
html.dark .mp-inv-step-value { color: #f7f5ff; }
html.dark .mp-inv-unavailable-text,
html.dark .mp-inv-centered-text,
html.dark .mp-inv-info-sub,
html.dark .mp-inv-choice-desc,
html.dark .mp-inv-hint,
html.dark .mp-inv-help-desc,
html.dark .mp-inv-footer-brand { color: #b8b2c7; }
html.dark .mp-inv-success-text,
html.dark .mp-inv-message { color: #c9c2dd; }
html.dark .mp-inv-message { font-style: italic; }
html.dark .mp-inv-label-muted { color: #8f88a3; }
html.dark .mp-inv-you {
  background: #211b2d;
  border-color: #342d45;
}
html.dark .mp-inv-you-count {
  background: #191522;
  border-color: #342d45;
  color: #b8b2c7;
}
html.dark .mp-inv-choice {
  background: #191522;
  border-color: #342d45;
}
html.dark .mp-inv-choice:hover { box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35); }
html.dark .mp-inv-choice--ok { background: #1b2a22; border-color: #2e9b59; }
html.dark .mp-inv-choice--ok .mp-inv-choice-title { color: #4cc97a; }
html.dark .mp-inv-choice--no { background: #2b1d1d; border-color: #e53935; }
html.dark .mp-inv-choice--no .mp-inv-choice-title { color: #f07a77; }
html.dark .mp-inv-info-icon { background: #211b2d; }
html.dark .mp-inv-stepper { border-color: #342d45; background: #191522; }
html.dark .mp-inv-step-btn:hover:not(:disabled) { background: #211b2d; }
html.dark .mp-inv-input {
  background: #211b2d !important;
  border-color: #342d45 !important;
  color: #f7f5ff !important;
}
html.dark textarea.mp-inv-input {
  background: #211b2d !important;
  border-color: #342d45 !important;
  color: #f7f5ff !important;
}
html.dark .mp-inv-input::placeholder { color: #8f88a3; }
html.dark .mp-inv-input:focus { border-color: #8b5cf6 !important; box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.25); }
html.dark .mp-inv-help { background: #211b2d; border-color: #342d45; }
html.dark .mp-inv-help-action {
  background: #191522;
  border-color: #342d45;
}
html.dark .mp-inv-help-action:hover { border-color: #8b5cf6; background: #211b2d; }
html.dark .mp-inv-count { color: #8f88a3; }
html.dark .mp-inv-footer-deadline { color: #8f88a3; }
html.dark .mp-inv-unavailable-icon,
html.dark .mp-inv-footer-strong,
html.dark .mp-inv-link { color: #8b5cf6; }
html.dark .mp-inv-btn--primary { background: #8b5cf6; }
html.dark .mp-inv-btn--primary:hover:not(:disabled) { background: #9776ff; }
html.dark .mp-inv-btn--decline { background: #2b1d1d; color: #f07a77; border-color: #4a2a2a; }
html.dark .mp-inv-btn--decline:hover:not(:disabled) { background: #362222; }
html.dark .mp-inv-error { background: #2b1d1d; border-color: #4a2a2a; color: #f07a77; }
html.dark .mp-inv-success { background: #1b2a22; border-color: #2e9b59; }
html.dark .mp-inv-success.DECLINED { background: #2b1d1d; border-color: #e53935; }
html.dark .mp-inv-success-count { background: #191522; }
html.dark .mp-inv-qr img { background: #ffffff; }

/* ---------- Responsive mobile ---------- */
@media (max-width: 640px) {
  .mp-inv-page {
    padding: 0 0 28px;
  }
  .mp-inv-card {
    border-radius: 18px;
    box-shadow: none;
  }
  .mp-inv-cover {
    height: 230px;
    border-radius: 0;
  }
  .mp-inv-dots { bottom: 116px; }
  .mp-inv-logo-text { font-size: 20px; }
  .mp-inv-type { margin-bottom: 10px; }
  .mp-inv-title { font-size: 30px; }
  .mp-inv-tagline { font-size: 15px; }
  .mp-inv-body { padding: 26px 20px 0; }
  .mp-inv-infos { grid-template-columns: 1fr; gap: 10px; margin-top: 18px; }
  .mp-inv-info { padding: 10px 8px; }
  .mp-inv-info-icon { width: 48px; height: 48px; }
  .mp-inv-choices { grid-template-columns: 1fr; gap: 12px; }
  .mp-inv-section-title { font-size: 20px; }
  .mp-inv-help { flex-direction: column; align-items: flex-start; }
}
</style>