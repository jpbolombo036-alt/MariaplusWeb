<template>
  <div class="mp-inv-cover">
    <template v-if="photos.length">
      <div ref="carouselEl" class="mp-inv-photos" @scroll.passive="onCarouselScroll">
        <div v-for="(p, idx) in photos" :key="idx" class="mp-inv-slide">
          <!-- Fond flouté (reprend la photo en couverture pleine) -->
          <img :src="absoluteUrl(p)" alt="" class="mp-inv-slide-bg" aria-hidden="true" />
          <!-- Photo entière visible, jamais recadrée -->
          <img :src="absoluteUrl(p)" :alt="'Photo de l’événement'" class="mp-inv-slide-img" />
        </div>
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
      <span class="mp-inv-logo-text">EventiaEasy</span>
    </div>

    <div class="mp-inv-cover-content">
      <span class="mp-inv-hero-kicker">Invitation privée</span>
      <span v-if="typeLabel" class="mp-inv-type">{{ typeLabel }}</span>
      <h1 class="mp-inv-title">{{ title }}</h1>
      <span class="mp-inv-hero-rule"><i></i><span>✦</span><i></i></span>
      <p class="mp-inv-tagline">
        Nous avons le plaisir de vous inviter à partager ce moment précieux avec nous.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, toRef } from 'vue'
import type { PublicInvitation } from '../../api/publicInvitation'
import { absoluteUrl, useInvitationPresentation } from './presentation'

const props = defineProps<{ invitation: PublicInvitation }>()
const { title, typeLabel, photos } = useInvitationPresentation(toRef(props, 'invitation'))
const carouselEl = ref<HTMLElement | null>(null)
const carouselIdx = ref(0)

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

onMounted(startAutoplay)
onBeforeUnmount(stopAutoplay)
</script>
