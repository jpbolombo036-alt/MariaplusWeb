<template>
  <div>
    <!-- En-tête style Prosoc -->
    <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-5">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 class="text-[22px] font-bold text-slate-900 tracking-tight">Invitations</h2>
          <p class="text-[13px] text-slate-500 mt-0.5 font-medium">{{ invitations.length }} invitation(s)</p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <label v-if="auth.isSuperAdmin" class="h-10 px-3 rounded-lg border border-slate-200 bg-white text-[12px] font-semibold text-slate-600 inline-flex items-center gap-2 whitespace-nowrap cursor-pointer select-none" :title="waEnabled ? 'Désactiver les envois WhatsApp pour toute la plateforme' : 'Réactiver les envois WhatsApp'">
            <input type="checkbox" class="w-4 h-4 accent-[#25D366] cursor-pointer" :checked="waEnabled" @change="toggleWhatsapp" />
            Envoi WhatsApp
          </label>
          <PermGuard :allow="['INVITATION_SEND']">
            <button :disabled="!waEnabled" :title="waEnabled ? 'Envoyer les invitations par WhatsApp' : 'Désactivé par le super-administrateur'" class="h-10 px-4 sm:px-5 rounded-lg bg-[#25D366] text-white text-[13px] font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap flex-1 sm:flex-none shadow-lg shadow-[#25D366]/30 hover:brightness-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed" @click="waEnabled && $router.push(`/dashboard/events/${id}/invitations/send`)">
              <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Envoyer sur WhatsApp
            </button>
          </PermGuard>
          <PermGuard :allow="['INVITATION_SEND']">
            <button :disabled="!waEnabled" :title="waEnabled ? 'Envoyer en masse par WhatsApp' : 'Désactivé par le super-administrateur'" class="h-10 px-4 sm:px-5 rounded-lg border border-primary text-primary text-[13px] font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap flex-1 sm:flex-none hover:bg-primary/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed" @click="waEnabled && (bulkOpen = true)">
              <span class="material-symbols-outlined text-[18px]">forward_to_inbox</span> Envoyer en masse
            </button>
          </PermGuard>
          <PermGuard :allow="['INVITATION_CREATE']">
            <button class="h-10 px-4 sm:px-5 rounded-lg bg-primary text-white text-[13px] font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap flex-1 sm:flex-none shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all" @click="$router.push(`/dashboard/events/${id}/invitations/new`)">
              <span class="material-symbols-outlined text-[18px]">add</span> Inviter
            </button>
          </PermGuard>
        </div>
      </div>
    </div>

    <!-- Recherche style Prosoc -->
    <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-5">
      <div class="flex items-center gap-3">
        <select v-model="statusFilter" class="h-11 px-3 rounded-lg border border-slate-200 bg-white text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-slate-700 transition-all">
          <option value="">Tous</option>
          <option value="DRAFT">Brouillon</option>
          <option value="GENERATED">Générée</option>
          <option value="SENT">Envoyée</option>
          <option value="CANCELLED">Annulée</option>
        </select>
        <div class="flex-1 relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <span class="material-symbols-outlined text-[20px]">search</span>
          </span>
          <input v-model="query" placeholder="Code ou invité…" class="h-11 pl-10 pr-4 rounded-lg border border-slate-200 bg-white text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 w-full transition-all" />
        </div>
      </div>
    </div>

    <p v-if="loading" class="text-on-surface-variant">Chargement…</p>
    <div v-else-if="filtered.length === 0" class="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl p-10 text-center">
      <div class="w-16 h-16 mx-auto rounded-full bg-surface-container-high grid place-items-center mb-4"><span class="material-symbols-outlined text-3xl text-on-surface-variant">mail</span></div>
      <h3 class="font-semibold text-on-surface">Aucune invitation</h3>
      <p class="text-sm text-on-surface-variant mt-1">Créez une invitation pour un invité puis envoyez-la.</p>
    </div>

    <div v-else>
      <!-- Desktop : tableau -->
      <div class="hidden md:block bg-surface-container-lowest border border-outline-variant/50 rounded-2xl overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-surface-container text-left text-on-surface-variant">
            <tr>
              <th class="px-5 py-3.5">Invité</th>
              <th class="px-5 py-3.5">Code</th>
              <th class="px-5 py-3.5">Statut</th>
              <th class="px-5 py-3.5">Relances</th>
              <th class="px-5 py-3.5">Ouvert</th>
              <th class="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant">
            <tr v-for="i in filtered" :key="i.id" class="text-on-surface hover:bg-surface-container/40">
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-3">
                  <span class="w-8 h-8 rounded-full grid place-items-center text-xs font-bold text-white shrink-0" :style="{ background: avatarColor(i.id) }">{{ initialsFor(i) }}</span>
                  <span>{{ guestNameFor(i) }}</span>
                </div>
              </td>
              <td class="px-5 py-3.5 font-mono text-xs">{{ i.invitationCode }}</td>
              <td class="px-5 py-3.5"><StatusBadge :status="i.status" /></td>
              <td class="px-5 py-3.5">{{ i.reminderCount }}</td>
              <td class="px-5 py-3.5">{{ i.openedAt ? 'Oui' : 'Non' }}</td>
              <td class="px-5 py-3.5 text-right">
                <div class="inline-flex items-center gap-1">
                  <PermGuard :allow="['INVITATION_SEND']">
                    <button v-if="i.status==='GENERATED' || i.status==='DRAFT'" class="px-2 py-1 text-primary hover:bg-primary/10 rounded-lg disabled:opacity-50" :disabled="busyId === i.id" title="Envoyer" @click="send(i)"><span class="material-symbols-outlined text-base" :class="{ 'animate-spin': busyId === i.id }">{{ busyId === i.id ? 'progress_activity' : 'send' }}</span></button>
                  </PermGuard>
                  <PermGuard :allow="['INVITATION_RESEND']">
                    <button v-if="i.status==='SENT'" class="px-2 py-1 text-primary hover:bg-primary/10 rounded-lg inline-flex items-center gap-1 disabled:opacity-50" :disabled="busyId === i.id" title="Relancer" @click="resend(i)"><span class="material-symbols-outlined text-base" :class="{ 'animate-spin': busyId === i.id }">{{ busyId === i.id ? 'progress_activity' : 'refresh' }}</span></button>
                  </PermGuard>
                  <PermGuard :allow="['INVITATION_SEND']">
                    <button v-if="i.status==='SENT' || i.status==='GENERATED' || i.status==='DRAFT'" class="px-2 py-1 text-primary hover:bg-primary/10 rounded-lg" title="QR" @click="showQr(i)"><span class="material-symbols-outlined text-base">qr_code</span></button>
                  </PermGuard>
                  <PermGuard :allow="['INVITATION_SEND']">
                    <button v-if="i.status!=='CANCELLED'" class="px-2 py-1 text-primary hover:bg-primary/10 rounded-lg disabled:opacity-50" :disabled="linkBusy === i.id" :title="links[i.id] ? 'Copier le lien de l’invitation' : 'Récupérer le lien de l’invitation'" @click="openLink(i)"><span class="material-symbols-outlined text-base">{{ linkBusy === i.id ? 'progress_activity' : 'link' }}</span></button>
                  </PermGuard>
                  <PermGuard :allow="['INVITATION_CANCEL']">
                    <button v-if="i.status!=='CANCELLED'" class="px-2 py-1 text-amber-500 hover:bg-amber-50 rounded-lg" title="Annuler" @click="cancel(i)"><span class="material-symbols-outlined text-base">block</span></button>
                  </PermGuard>
                  <PermGuard :allow="['INVITATION_DELETE']">
                    <button class="px-2 py-1 text-error hover:bg-error/10 rounded-lg" title="Supprimer" @click="remove(i)"><span class="material-symbols-outlined text-base">delete</span></button>
                  </PermGuard>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile : cartes -->
      <div class="md:hidden space-y-3">
        <div
          v-for="i in filtered"
          :key="i.id"
          class="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-4"
        >
          <!-- En-tête carte : avatar + nom + statut -->
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-3 min-w-0">
              <span class="w-10 h-10 rounded-full grid place-items-center text-sm font-bold text-white shrink-0" :style="{ background: avatarColor(i.id) }">{{ initialsFor(i) }}</span>
              <div class="min-w-0">
                <p class="font-semibold text-on-surface truncate">{{ guestNameFor(i) }}</p>
                <p class="text-xs text-on-surface-variant font-mono">{{ i.invitationCode }}</p>
              </div>
            </div>
            <StatusBadge :status="i.status" />
          </div>

          <!-- Infos -->
          <div class="flex items-center gap-4 text-xs text-on-surface-variant mb-4">
            <span class="inline-flex items-center gap-1">
              <span class="material-symbols-outlined text-[14px]">refresh</span>
              {{ i.reminderCount }} relance(s)
            </span>
            <span class="inline-flex items-center gap-1">
              <span class="material-symbols-outlined text-[14px]">visibility</span>
              {{ i.openedAt ? 'Ouverte' : 'Non ouverte' }}
            </span>
          </div>

          <!-- Actions -->
          <InvitationActions
            :i="i"
            :link="links[i.id] || ''"
            :link-busy="linkBusy === i.id"
            :busy="busyId === i.id"
            @send="send"
            @resend="resend"
            @qr="showQr"
            @link="openLink"
            @cancel="cancel"
            @delete="remove"
          />
        </div>
      </div>
    </div>

    <!-- Détail QR -->
    <div v-if="qrOpen" class="fixed inset-0 bg-black/40 z-50 grid place-items-center px-4" @click.self="qrOpen=false">
      <div class="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-sm text-center">
        <img v-if="qrDataUri" :src="qrDataUri" class="w-56 h-56 mx-auto" alt="QR" />
        <p class="mt-2 text-sm text-on-surface-variant">QR de l'invitation</p>
        <div class="mt-4 flex justify-center gap-2">
          <PermGuard :allow="['INVITATION_UPDATE']">
            <button class="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-sm" @click="rotate">Faire pivoter</button>
          </PermGuard>
          <button class="px-3 py-1.5 rounded-lg border border-outline-variant text-sm" @click="qrOpen=false">Fermer</button>
        </div>
      </div>
    </div>

    <!-- Partage lien public -->
    <div v-if="shareOpen" class="fixed inset-0 bg-black/40 z-50 grid place-items-center px-4" @click.self="shareOpen=false">
      <div class="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-lg">
        <h3 class="text-lg font-bold text-on-surface mb-2">Partager l'invitation</h3>
        <p class="text-sm text-on-surface-variant mb-4">Copiez ce lien et envoyez-le à l'invité :</p>
        <div class="flex items-center gap-2">
          <input :value="shareUrl" readonly class="flex-1 px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm text-on-surface" />
          <button
            class="px-4 py-2 rounded-lg text-sm font-semibold transition-all inline-flex items-center gap-1.5 shrink-0"
            :class="shareCopied ? 'bg-emerald-600 text-white shadow-sm' : 'bg-primary text-on-primary hover:bg-primary-dark'"
            @click="copyShare"
          >
            <span class="material-symbols-outlined text-[18px]">{{ shareCopied ? 'check' : 'content_copy' }}</span>
            {{ shareCopied ? 'Copié !' : 'Copier' }}
          </button>
        </div>
        <div class="mt-3 flex items-center justify-between gap-3">
          <p class="text-xs text-on-surface-variant">Email envoyé : <strong>{{ shareEmailSent ? 'Oui' : 'Non' }}</strong></p>
          <a
            :href="shareUrl"
            target="_blank"
            rel="noopener"
            class="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
          >
            <span class="material-symbols-outlined text-[16px]">open_in_new</span> Ouvrir le lien
          </a>
        </div>
        <div class="mt-5 flex justify-end">
          <button class="px-4 py-2 rounded-lg border border-outline-variant text-sm" @click="shareOpen=false">Fermer</button>
        </div>
      </div>
    </div>

    <!-- Envoi en masse WhatsApp -->
    <BulkSendPanel :event-id="id" :open="bulkOpen" :guests="guests" @close="bulkOpen=false" @completed="load" />
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  listInvitations, createInvitation, sendInvitation, resendInvitation, cancelInvitation, deleteInvitation,
  getQr, rotateQr, inviteUrlFromPayload, extractPublicToken, type Invitation,
} from '../../api/invitations'
import { listGuests, type Guest } from '../../api/guests'
import { publicInvitationExists } from '../../api/publicInvitation'
import { apiErrorMessage } from '../../api/http'
import { decodeQrPayload } from '../../utils/qr'
import { withTimeout } from '../../utils/withTimeout'
import PermGuard from '../../components/common/PermGuard.vue'
import StatusBadge from '../../components/common/StatusBadge.vue'
import InvitationActions from '../../components/invitations/InvitationActions.vue'
import BulkSendPanel from '../../components/invitations/BulkSendPanel.vue'
import { useNotificationStore } from '../../stores/notifications'
import { useAuthStore } from '../../stores/auth'
import { usePlatformStore } from '../../stores/platform'
import { updateWhatsappSettings } from '../../api/admin'

const route = useRoute()
const id = Number(route.params.id)
const notifications = useNotificationStore()
const invitations = ref<Invitation[]>([])
const guests = ref<Guest[]>([])
const loading = ref(true)
const query = ref('')
const statusFilter = ref('')
const qrOpen = ref(false)
const qrDataUri = ref('')
const qrInv = ref<Invitation | null>(null)
const shareOpen = ref(false)
const shareUrl = ref('')
const shareEmailSent = ref(false)
const shareCopied = ref(false)
const bulkOpen = ref(false)
const auth = useAuthStore()
const waEnabled = ref(true)
// Liens publics déjà obtenus, par invitation : permet de recopier un lien sans
// relancer l'envoi. `linkBusy` = recherche du lien en cours (décodage du QR).
const links = ref<Record<number, string>>({})
const linkBusy = ref<number | null>(null)
// Envoi / relance en cours (id de l'invitation) : désactive les boutons et
// affiche un indicateur, pour qu'un appel lent ne ressemble pas à un bouton mort.
const busyId = ref<number | null>(null)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  const st = statusFilter.value
  return invitations.value.filter((i) => {
    if (st && i.status !== st) return false
    if (q && !guestNameFor(i).toLowerCase().includes(q) && !i.invitationCode.toLowerCase().includes(q)) return false
    return true
  })
})

const guest = (i: Invitation) => guests.value.find((g) => g.id === i.guestId)
const guestNameFor = (i: Invitation) => {
  const g = guest(i)
  return g ? `${g.firstName} ${g.lastName}` : `#${i.guestId}`
}
const initialsFor = (i: Invitation) => {
  const g = guest(i)
  return g ? `${g.firstName.charAt(0)}${g.lastName.charAt(0)}`.toUpperCase() : '?'
}
const avatarPalette = ['#5b2ecc', '#176b5b', '#f4a340', '#1f2937', '#7c3aed', '#0e7490']
const avatarColor = (n: number) => avatarPalette[n % avatarPalette.length]

const platform = usePlatformStore()
onMounted(async () => {
  load()
  await platform.load()
  waEnabled.value = platform.canSendWhatsapp
})
async function toggleWhatsapp() {
  const next = !waEnabled.value
  try {
    await updateWhatsappSettings(next)
    waEnabled.value = next
    notifications.push(
      next ? 'Envoi WhatsApp réactivé sur la plateforme.' : 'Envoi WhatsApp désactivé sur toute la plateforme.',
      'success',
    )
  } catch {
    // toast d'erreur déjà affiché par l'intercepteur HTTP
  }
}
async function load() {
  try {
    const [inv, g] = await Promise.all([listInvitations(id), listGuests(id)])
    invitations.value = inv
    guests.value = g
  } finally {
    loading.value = false
  }
}
/** Ouvre la modale « Partager l'invitation » avec le lien fourni. */
function openShare(url: string, emailSent: boolean) {
  shareUrl.value = url
  shareEmailSent.value = emailSent
  shareCopied.value = false
  shareOpen.value = true
}

/**
 * Retrouve le lien public d'une invitation SANS la renvoyer : le backend ne
 * l'expose que dans la réponse de /send ou /resend. En dernier recours on lit le
 * QR de l'invitation (endpoint de lecture seule) et on reconstruit le lien à
 * partir du jeton qu'il contient — après vérification auprès de l'API publique,
 * afin de ne jamais proposer un lien cassé.
 */
async function linkFromQr(i: Invitation): Promise<string> {
  const qr = await getQr(id, i.id)
  if (!qr.dataUri) return ''
  // Décodage et vérification bornés dans le temps : le décodeur QR (image) et le
  // sondage réseau ne doivent jamais laisser le bouton sans réaction.
  const payload = await withTimeout(decodeQrPayload(qr.dataUri), 5000, '')
  if (!payload) return ''
  const url = inviteUrlFromPayload(payload)
  const token = extractPublicToken(url)
  if (!url || !token) return ''
  const exists = await withTimeout(publicInvitationExists(token), 5000, false)
  return exists ? url : ''
}

/** Action « Lien » : recopie un lien déjà connu, sinon tente de le retrouver. */
async function openLink(i: Invitation) {
  const known = links.value[i.id]
  if (known) {
    openShare(known, false)
    return
  }
  linkBusy.value = i.id
  try {
    const url = await withTimeout(linkFromQr(i), 12000, '')
    if (url) {
      links.value[i.id] = url
      openShare(url, false)
      return
    }
    notifications.push(
      "Lien introuvable pour cette invitation : le serveur n'a renvoyé aucune URL publique. " +
        'Vérifiez la configuration du backend (URL publique du front) puis réessayez.',
      'error',
      8000,
    )
  } finally {
    linkBusy.value = null
  }
}

/** Envoi / relance d'une invitation, puis affichage du lien à partager. */
async function submit(i: Invitation, mode: 'send' | 'resend') {
  const isSend = mode === 'send'
  busyId.value = i.id
  try {
    const result = isSend ? await sendInvitation(id, i.id) : await resendInvitation(id, i.id)
    const url = result.publicInviteUrl || ''
    if (url) {
      links.value[i.id] = url
      openShare(url, result.emailSent || false)
      notifications.push(isSend ? 'Invitation envoyée.' : 'Invitation relancée.', 'success')
      return
    }
    // Aucun lien dans la réponse : on tente de le reconstruire (QR) au lieu de ne
    // rien afficher — c'était le comportement silencieux qui « perdait » le lien.
    const fallback = await withTimeout(linkFromQr(i), 12000, '')
    if (fallback) {
      links.value[i.id] = fallback
      openShare(fallback, result.emailSent || false)
      notifications.push(isSend ? 'Invitation envoyée.' : 'Invitation relancée.', 'success')
      return
    }
    // Le traitement a bien abouti, mais le backend n'expose pas le lien : on le dit
    // clairement (au lieu de paraître « inactif ») et la liste est rafraîchie.
    notifications.push(
      isSend
        ? "Invitation envoyée, mais le serveur n'a renvoyé aucun lien public à copier."
        : "Invitation relancée, mais le serveur n'a renvoyé aucun lien public à copier.",
      'info',
      9000,
    )
  } catch (e) {
    // `skipNotification` est posé sur /send et /resend : on affiche ici un message
    // unique qui couvre AUSSI les échecs réseau (que l'intercepteur ne notifie pas).
    const reason = apiErrorMessage(e)
    // Le backend refuse parfois l'envoi pour une raison métier (ex. invité sans
    // email alors que l'invitation a été envoyée via WhatsApp en masse). Dans ce
    // cas on récupère le lien public (QR, lecture seule) pour ne pas laisser
    // l'organisateur sans solution, puis on explique le refus.
    const fallback = await withTimeout(linkFromQr(i), 12000, '')
    if (fallback) {
      links.value[i.id] = fallback
      openShare(fallback, false)
    }
    let hint = ''
    if (/adresse email/i.test(reason)) {
      hint = ' Ajoutez un email à l’invité (onglet Invités), ou copiez le lien pour l’envoyer par WhatsApp.'
    } else if (/limite de relances/i.test(reason)) {
      hint = ' Plafond de relances défini côté serveur : transmettez le lien manuellement.'
    }
    notifications.push(
      `${isSend ? "Échec de l'envoi" : 'Échec de la relance'} : ${reason}${hint}` +
        (fallback ? ' Le lien de l’invitation est affiché ci-dessus.' : ''),
      'error',
      10000,
    )
  } finally {
    busyId.value = null
    // Rafraîchit la liste APRÈS l'affichage du lien : un échec de rafraîchissement
    // ne doit plus empêcher la modale de s'ouvrir.
    load().catch(() => {})
  }
}

const send = (i: Invitation) => submit(i, 'send')
const resend = (i: Invitation) => submit(i, 'resend')
async function cancel(i: Invitation) {
  if (!confirm(`Annuler l'invitation ?`)) return
  await cancelInvitation(id, i.id)
  await load()
}
async function remove(i: Invitation) {
  if (!confirm(`Supprimer l'invitation ?`)) return
  await deleteInvitation(id, i.id)
  invitations.value = invitations.value.filter((x) => x.id !== i.id)
}
async function showQr(i: Invitation) {
  const q = await getQr(id, i.id)
  qrDataUri.value = q.dataUri
  qrInv.value = i
  qrOpen.value = true
}
async function rotate() {
  if (!qrInv.value) return
  const q = await rotateQr(id, qrInv.value.id)
  qrDataUri.value = q.dataUri
  await load()
}
async function copyShare() {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    shareCopied.value = true
    notifications.push('Lien copié !', 'success')
    setTimeout(() => { shareCopied.value = false }, 2000)
  } catch {
    notifications.push('Impossible de copier le lien.', 'error')
  }
}
</script>

<style scoped>
.input { @apply block w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest outline-none focus:border-primary text-on-surface; }
</style>

