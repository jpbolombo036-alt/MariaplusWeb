<template>
  <section v-if="hasEventInfo" class="mp-inv-section">
    <div class="mp-inv-section-heading">
      <span class="mp-inv-section-kicker">Les détails</span>
      <h2 class="mp-inv-section-title">
        Informations de l’événement
      </h2>
    </div>

    <div class="mp-inv-infos">
      <div v-if="dateValue" class="mp-inv-info mp-inv-info--date">
        <span class="mp-inv-info-icon"><span class="material-symbols-outlined">calendar_month</span></span>
        <span class="mp-inv-info-label">DATE</span>
        <span class="mp-inv-info-value">{{ dateValue }}</span>
        <span v-if="dayOfWeekText" class="mp-inv-info-sub">{{ dayOfWeekText }}</span>
      </div>

      <div v-if="timeValue" class="mp-inv-info mp-inv-info--time">
        <span class="mp-inv-info-icon"><span class="material-symbols-outlined">schedule</span></span>
        <span class="mp-inv-info-label">HEURE</span>
        <span class="mp-inv-info-value">{{ timeValue }}</span>
        <span class="mp-inv-info-sub">Heure locale</span>
      </div>

      <component
        :is="venueMapUrl ? 'a' : 'div'"
        v-if="venueValue"
        :href="venueMapUrl || undefined"
        :target="venueMapUrl ? '_blank' : undefined"
        :rel="venueMapUrl ? 'noopener noreferrer' : undefined"
        class="mp-inv-info mp-inv-info--place mp-inv-info-link"
        :aria-label="venueMapUrl ? `Ouvrir ${venueValue} dans Google Maps` : undefined"
      >
        <span class="mp-inv-info-icon"><span class="material-symbols-outlined">location_on</span></span>
        <span class="mp-inv-info-label">LIEU</span>
        <span class="mp-inv-info-value">{{ venueValue }}</span>
        <span v-if="venueSub" class="mp-inv-info-sub">{{ venueSub }}</span>
      </component>

    </div>

    <a
      v-if="venueMapUrl"
      :href="venueMapUrl"
      class="mp-inv-map-link"
      target="_blank"
      rel="noopener noreferrer"
    >
      <span class="material-symbols-outlined">map</span>
      Voir l’itinéraire
    </a>

    <p v-if="invitation.message" class="mp-inv-message">{{ invitation.message }}</p>
  </section>

  <!-- ============ DRESS CODE : palette + référence tissu ============ -->
  <section v-if="dressColors.length || dressImageUrl" class="mp-inv-section mp-inv-dress-section">
    <div class="mp-inv-section-heading">
      <span class="mp-inv-section-kicker">Dress code</span>
      <h2 class="mp-inv-section-title">Tenue &amp; harmonie</h2>
      <p class="mp-inv-section-lead">Une palette pensée pour créer une belle unité le jour de la célébration.</p>
    </div>

    <div class="mp-inv-dress-grid">
      <div v-if="dressColors.length" class="mp-inv-dress-panel">
        <div class="mp-inv-dress-panel-title">
          <span class="material-symbols-outlined">palette</span>
          <span>Palette conseillée</span>
        </div>
        <div class="mp-inv-color-list">
          <div v-for="c in dressColors" :key="c.value" class="mp-inv-color-item">
            <span
              class="mp-inv-color-swatch"
              :style="{ backgroundColor: safeColorHex(c.hex) }"
              :title="c.description || c.label"
            ></span>
            <span class="mp-inv-color-name">{{ c.label }}</span>
            <span v-if="c.description" class="mp-inv-color-description">{{ c.description }}</span>
          </div>
        </div>
      </div>

      <div v-if="dressImageUrl" class="mp-inv-fabric-card">
        <div class="mp-inv-dress-panel-title">
          <span class="material-symbols-outlined">texture</span>
          <span>Référence tissu</span>
        </div>
        <div class="mp-inv-fabric-image">
          <img :src="absoluteUrl(dressImageUrl)" alt="Référence du pagne à porter" loading="lazy" />
        </div>
        <p class="mp-inv-fabric-caption">Le pagne présenté sert de référence pour votre tenue.</p>
      </div>
    </div>
  </section>

  <!-- Programme de la journée (sessions de l'événement — additif) -->
  <section v-if="programSessions.length" class="mp-inv-section">
    <div class="mp-inv-section-heading">
      <span class="mp-inv-section-kicker">Le déroulé</span>
      <h2 class="mp-inv-section-title">
        Programme
      </h2>
    </div>
    <div class="mp-inv-program">
      <div v-for="(s, i) in programSessions" :key="i" class="mp-inv-program-item">
        <span class="mp-inv-program-dot" aria-hidden="true">{{ i + 1 }}</span>
        <div class="mp-inv-program-body">
          <div
            v-if="sessionTime(s) || (s.type && sessionTypeLabel(s.type))"
            class="mp-inv-program-top"
          >
            <span v-if="sessionTime(s)" class="mp-inv-program-time">{{ sessionTime(s) }}</span>
            <span v-if="s.type && sessionTypeLabel(s.type)" class="mp-inv-program-badge">
              {{ sessionTypeLabel(s.type) }}
            </span>
          </div>
          <p class="mp-inv-program-name">{{ s.name }}</p>
          <p v-if="sessionDateLabel(s)" class="mp-inv-program-date">{{ sessionDateLabel(s) }}</p>
          <p v-if="sessionPlace(s)" class="mp-inv-program-place">
            <span class="material-symbols-outlined">location_on</span>{{ sessionPlace(s) }}
          </p>
          <a
            v-if="sessionMapUrl(s)"
            :href="sessionMapUrl(s)"
            class="mp-inv-program-map"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span class="material-symbols-outlined">map</span>Itinéraire
          </a>
          <p v-if="s.description" class="mp-inv-program-desc">{{ s.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { toRef } from 'vue'
import type { PublicInvitation } from '../../api/publicInvitation'
import {
  absoluteUrl, safeColorHex, sessionTime, sessionDateLabel, sessionPlace,
  sessionMapUrl, sessionTypeLabel, useInvitationPresentation,
} from './presentation'

const props = defineProps<{ invitation: PublicInvitation }>()
const {
  hasEventInfo, dateValue, dayOfWeekText, timeValue, venueValue, venueSub,
  venueMapUrl, dressColors, dressImageUrl, programSessions,
} = useInvitationPresentation(toRef(props, 'invitation'))
</script>
