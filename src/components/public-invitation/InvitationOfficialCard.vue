<template>
  <div ref="renderElement" class="mp-inv-render" aria-hidden="true">
    <div class="nx">
      <!-- Bandeau haut -->
      <header class="nx-header">
        <svg class="nx-header-deco" xmlns="http://www.w3.org/2000/svg" width="852" height="192" viewBox="0 0 852 192" aria-hidden="true">
          <path d="M0,0 L430,0 C300,58 160,88 0,96 Z" fill="rgba(139,110,255,0.20)"></path>
          <path d="M852,26 C690,10 585,86 540,192 L852,192 Z" fill="rgba(124,92,255,0.16)"></path>
          <circle cx="770" cy="30" r="90" fill="rgba(169,139,255,0.12)"></circle>
        </svg>
        <div class="nx-official">
          <span>Invitation</span>
          <span>Officielle</span>
          <i class="nx-bar nx-bar--sm"></i>
        </div>
        <div class="nx-brand">
          <img src="/logo.png" class="nx-brand-logo" alt="" />
          <div class="nx-brand-name">Eventia<span>Easy</span></div>
          <div class="nx-brand-tag">Des événements, plus simplement</div>
        </div>
        <div class="nx-script">
          <span>Vivez</span>
          <span>Partagez</span>
          <span>Célébrez</span>
          <i class="nx-bar nx-bar--sm"></i>
        </div>
      </header>

      <!-- Visuel événement -->
      <div class="nx-banner">
        <div v-if="cardBgUrl" class="nx-banner-bg" :style="{ backgroundImage: 'url(' + cardBgUrl + ')' }"></div>
        <div class="nx-banner-shade"></div>
        <div class="nx-banner-inner">
          <div class="nx-banner-left">
            <div class="nx-event"><template v-for="(w, wi) in cardTitleWords" :key="wi"><span :class="{ 'nx-event-accent': w.accent }">{{ w.text }}</span>{{ wi < cardTitleWords.length - 1 ? ' ' : '' }}</template></div>
            <i class="nx-bar"></i>
            <div class="nx-event-sub">{{ cardEventSub }}</div>
          </div>
          <div class="nx-banner-tags">
            <div v-for="t in cardTags" :key="t" class="nx-tag">{{ t }}</div>
            <i class="nx-bar nx-bar--sm nx-bar--right"></i>
          </div>
        </div>
      </div>

      <!-- Arche blanche + avatar -->
      <div class="nx-arc"></div>
      <div class="nx-avatar">{{ guestInitials }}</div>

      <!-- Invité + présence confirmée -->
      <div class="nx-inviteof">Invitation de</div>
      <div :class="guestNameClass">{{ guestFullName }}</div>
      <div class="nx-pillrow">
        <div class="nx-pill"><span class="nx-pill-check"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#ffffff" aria-hidden="true"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></span><span class="nx-pill-text">Présence confirmée</span></div>
      </div>
      <div class="nx-thanks">Merci de faire partie de cet événement !</div>

      <!-- Date / Heure / Lieu -->
      <div class="nx-infos">
        <div v-if="dateValue" class="nx-info">
          <span class="nx-info-ico"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#5427c7" aria-hidden="true"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg></span>
          <span class="nx-info-label">Date</span>
          <span class="nx-info-value">{{ dateValue }}</span>
          <span v-if="dayOfWeekText" class="nx-info-sub">{{ dayOfWeekText }}</span>
        </div>
        <div v-if="timeValue" class="nx-info">
          <span class="nx-info-ico"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#5427c7" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg></span>
          <span class="nx-info-label">Heure</span>
          <span class="nx-info-value">{{ timeValue }}</span>
          <span class="nx-info-sub">Heure locale</span>
        </div>
        <div v-if="venueValue || venueSub" class="nx-info">
          <span class="nx-info-ico"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#5427c7" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></span>
          <span class="nx-info-label">Lieu</span>
          <span v-if="venueValue" class="nx-info-value">{{ venueValue }}</span>
          <span v-if="venueSub" class="nx-info-sub">{{ venueSub }}</span>
        </div>
      </div>

      <div class="nx-sep"></div>

      <!-- Ticket QR -->
      <div class="nx-ticket">
        <i class="nx-hole nx-hole--l"></i>
        <i class="nx-hole nx-hole--r"></i>
        <div v-if="qrDataUri" class="nx-ticket-qr"><img :src="qrDataUri" alt="QR" /></div>
        <i class="nx-ticket-div"></i>
        <div class="nx-ticket-text">
          <div class="nx-ticket-title">Présentez ce QR code à l'accueil</div>
          <div class="nx-ticket-sub">Ce QR code permet de confirmer rapidement votre présence.</div>
        </div>
      </div>

      <!-- Atouts (selon le type d'événement) -->
      <div class="nx-feats">
        <div v-for="(f, i) in cardFeats" :key="i" class="nx-feat">
          <svg class="nx-feat-ico" xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="#5427c7" aria-hidden="true">
            <path v-if="f.icon === 'groups'" d="M12 12.75c1.63 0 3.07.39 4.24.9 1.08.48 1.76 1.56 1.76 2.73V18H6v-1.61c0-1.18.68-2.26 1.76-2.73 1.17-.52 2.61-.91 4.24-.91zM4 13c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm16 0c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-8-9c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z" />
            <path v-else-if="f.icon === 'bulb'" d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" />
            <path v-else-if="f.icon === 'share'" d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
            <path v-else d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z" />
          </svg>
          <div class="nx-feat-title">{{ f.title }}</div>
          <div class="nx-feat-sub">{{ f.sub }}</div>
        </div>
      </div>

      <!-- Pied de carte -->
      <footer class="nx-footer">
        <div class="nx-footer-band"></div>
        <div class="nx-footer-blob"></div>
        <div class="nx-footer-heart">♥</div>
        <div class="nx-footer-script">Merci de confirmer votre présence !</div>
        <div class="nx-footer-brand">
          <img src="/logo.png" class="nx-footer-logo" alt="" />
          <div>
            <div class="nx-footer-name">Eventia<span>Easy</span></div>
            <div class="nx-footer-tag">Des événements, plus simplement</div>
          </div>
        </div>
        <div class="nx-footer-caps">
          <span>Simple</span>
          <span>Rapide</span>
          <span>Efficace</span>
          <i class="nx-bar nx-bar--sm nx-bar--right"></i>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import type { PublicInvitation } from '../../api/publicInvitation'
import { useInvitationPresentation } from './presentation'

const props = defineProps<{
  invitation: PublicInvitation
  qrDataUri: string
  cardBgUrl: string
}>()
const inv = toRef(props, 'invitation')
const { title, guestFullName, dateValue, dayOfWeekText, timeValue, venueValue, venueSub } = useInvitationPresentation(inv)
const renderElement = ref<HTMLElement | null>(null)
defineExpose({ renderElement })

/* Nom affiché : taille réduite automatiquement si trop long (jamais de débordement) */
const guestNameClass = computed(() => {
  const n = guestFullName.value
  if (n.length > 34) return 'nx-guest nx-guest--xs'
  if (n.length > 24) return 'nx-guest nx-guest--sm'
  return 'nx-guest'
})

/* ---------- Données du modèle « invitation officielle » ---------- */
const guestInitials = computed(() => {
  const a = inv.value?.guestFirstName?.trim()?.charAt(0) ?? ''
  const b = inv.value?.guestLastName?.trim()?.charAt(0) ?? ''
  return `${a}${b}`.toUpperCase() || '♥'
})

/* Titre raccourci : le visuel du bandeau ne doit jamais déborder */
const cardTitle = computed(() => {
  const t = title.value
  return t.length > 90 ? `${t.slice(0, 87).trimEnd()}…` : t
})

/* Titre découpé en mots : le dernier mot passe en violet clair, comme la maquette */
const cardTitleWords = computed(() => {
  const words = cardTitle.value.split(/\s+/).filter(Boolean)
  return words.map((w, idx) => ({ text: w, accent: words.length > 1 && idx === words.length - 1 }))
})

/* Sous-titre du visuel : message de l'organisateur, sinon accroche par défaut */
const cardEventSub = computed(() => {
  const m = inv.value?.message?.trim()
  if (m) return m.length > 110 ? `${m.slice(0, 107).trimEnd()}…` : m
  return 'Vivez un moment inoubliable avec nous !'
})

/* Mots-clés du bandeau + atouts en bas de carte, selon le type d'événement */
const CARD_TAGS: Record<string, string[]> = {
  WEDDING: ['Mariage', 'Amour', 'Famille', 'Célébration'],
  COLLATION: ['Collation', 'Partage', 'Amitié', 'Célébration'],
  BIRTHDAY: ['Anniversaire', 'Joie', 'Amitié', 'Célébration'],
  GRADUATION: ['Diplôme', 'Réussite', 'Avenir', 'Célébration'],
  PARTY: ['Fête', 'Musique', 'Danse', 'Célébration'],
  CONFERENCE: ['Événements', 'Formation', 'Réseautage', 'Opportunités'],
  OTHER: ['Événements', 'Partage', 'Rencontre', 'Opportunités'],
}
const CARD_FEATS: Record<string, string[]> = {
  WEDDING: ['Célébrer|votre union', 'Partager|votre bonheur', 'Rencontrer|vos proches', 'Garder|des souvenirs'],
  COLLATION: ['Célébrer|cette belle étape', 'Partager|un moment convivial', 'Rencontrer|vos proches', 'Garder|des souvenirs'],
  BIRTHDAY: ['Fêter|cette nouvelle année', 'Souffler|vos bougies', 'Danser|avec vos proches', 'Garder|des souvenirs'],
  GRADUATION: ['Célébrer|votre diplôme', 'Partager|votre réussite', 'Rêver|votre avenir', 'Saisir|de nouvelles opportunités'],
  PARTY: ["Danser|jusqu'au bout de la nuit", 'Chanter|vos titres préférés', 'Rencontrer|de nouvelles têtes', 'Garder|des souvenirs'],
  CONFERENCE: ['Échanger|avec des professionnels', 'Apprendre|de nouvelles compétences', 'Élargir|votre réseau', 'Saisir|de nouvelles opportunités'],
  OTHER: ['Vivre|un moment unique', 'Partager|votre joie', 'Rencontrer|vos proches', 'Garder|des souvenirs'],
}
const eventType = computed(() => (inv.value as { eventType?: string } | null)?.eventType ?? '')
const cardTags = computed<string[]>(() => CARD_TAGS[eventType.value] ?? CARD_TAGS.OTHER ?? [])
const cardFeats = computed(() => {
  const list = CARD_FEATS[eventType.value] ?? CARD_FEATS.OTHER ?? []
  const icons = ['groups', 'bulb', 'share', 'bars'] as const
  return list.map((f, i) => {
    const [t, s] = f.split('|')
    return { title: t ?? '', sub: s ?? '', icon: icons[i] ?? 'bars' }
  })
})
</script>
