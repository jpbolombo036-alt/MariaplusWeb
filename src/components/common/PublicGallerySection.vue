<template>
  <section v-if="gallery && gallery.photos.length" class="mp-inv-section mp-gallery">
    <div class="mp-gallery-head">
      <div>
        <p class="mp-gallery-kicker">Souvenirs</p>
        <h2 class="mp-inv-section-title">Galerie</h2>
        <p v-if="gallery.description" class="mp-inv-message">{{ gallery.description }}</p>
      </div>
      <button v-if="!galleryOpen" type="button" class="mp-gallery-open" @click="galleryOpen = true">Ouvrir la galerie</button>
      <button v-else type="button" class="mp-gallery-open" @click="galleryOpen = false">Fermer la galerie</button>
    </div>

    <div v-if="galleryOpen" class="mp-gallery-masonry">
      <button v-for="(photo, index) in gallery.photos" :key="photo.id" type="button" class="mp-gallery-tile" @click="open(index)">
        <img :src="absolute(photo.imageUrl)" :alt="photo.caption || 'Photo de l’événement'" loading="lazy" />
        <span v-if="photo.caption" class="mp-gallery-caption">{{ photo.caption }}</span>
      </button>
    </div>

    <div v-if="selectedIndex !== null" class="mp-gallery-lightbox" role="dialog" aria-modal="true" @click.self="close">
      <button class="mp-gallery-close" aria-label="Fermer" @click="close">×</button>
      <button class="mp-gallery-nav mp-gallery-prev" aria-label="Photo précédente" @click="previous">‹</button>
      <figure class="mp-gallery-viewer">
        <img :src="absolute(selectedPhoto?.imageUrl || '')" :alt="selectedPhoto?.caption || 'Photo de l’événement'" />
        <figcaption>{{ selectedPhoto?.caption || `${(selectedIndex ?? 0) + 1} / ${gallery.photos.length}` }}</figcaption>
      </figure>
      <button class="mp-gallery-nav mp-gallery-next" aria-label="Photo suivante" @click="next">›</button>
      <div class="mp-gallery-actions">
        <button @click="download">Télécharger</button>
        <button @click="share">Partager</button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { getPublicGallery, type Gallery } from '../../api/gallery'
import { ApiConfig } from '../../api/config'

const props = defineProps<{ token: string }>()
const gallery = ref<Gallery | null>(null)
const galleryOpen = ref(false)
const selectedIndex = ref<number | null>(null)
const absolute = (url: string) => url.startsWith('http') ? url : `${ApiConfig.baseUrl}${url}`
const selectedPhoto = computed(() => selectedIndex.value === null ? null : gallery.value?.photos[selectedIndex.value] ?? null)

function open(index: number) { selectedIndex.value = index }
function close() { selectedIndex.value = null }
function next() { if (gallery.value?.photos.length) selectedIndex.value = ((selectedIndex.value ?? 0) + 1) % gallery.value.photos.length }
function previous() { if (gallery.value?.photos.length) selectedIndex.value = ((selectedIndex.value ?? 0) - 1 + gallery.value.photos.length) % gallery.value.photos.length }
function onKeydown(e: KeyboardEvent) { if (selectedIndex.value === null) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') next(); if (e.key === 'ArrowLeft') previous() }
async function share() { const url = absolute(selectedPhoto.value?.imageUrl || ''); if (navigator.share) await navigator.share({ title: 'Photo de l’événement', url }); else await navigator.clipboard?.writeText(url) }
function download() { const url = absolute(selectedPhoto.value?.imageUrl || ''); const a = document.createElement('a'); a.href = url; a.download = 'photo-evenement'; a.target = '_blank'; a.click() }
onMounted(async () => { window.addEventListener('keydown', onKeydown); try { gallery.value = await getPublicGallery(props.token) } catch { gallery.value = null } })
onBeforeUnmount(() => { window.removeEventListener('keydown', onKeydown) })
</script>

<style scoped>
.mp-gallery { position:relative; }
.mp-gallery-head { display:flex; align-items:flex-end; justify-content:space-between; gap:16px; margin-bottom:18px; }
.mp-gallery-kicker { margin:0 0 4px; color:#8b5e3c; font-size:11px; letter-spacing:.18em; text-transform:uppercase; font-weight:700; }
.mp-gallery-count { color:#8d8790; font-size:12px; white-space:nowrap; }
.mp-gallery-open { border:0; border-radius:22px; padding:10px 17px; color:#fff; background:#6d28d9; font-size:12px; font-weight:700; box-shadow:0 5px 14px rgba(109,40,217,.2); }
.mp-gallery-masonry { columns:2 150px; column-gap:10px; }
.mp-gallery-tile { position:relative; display:block; width:100%; margin:0 0 10px; padding:0; border:0; border-radius:14px; overflow:hidden; background:#f1edf0; break-inside:avoid; cursor:zoom-in; }
.mp-gallery-tile img { display:block; width:100%; height:auto; transition:transform .35s ease; }
.mp-gallery-tile:hover img { transform:scale(1.035); }
.mp-gallery-caption { position:absolute; left:0; right:0; bottom:0; padding:22px 10px 9px; color:#fff; text-align:left; font-size:11px; background:linear-gradient(transparent,rgba(0,0,0,.65)); }
.mp-gallery-lightbox { position:absolute; inset:0; z-index:10; min-height:420px; display:flex; align-items:center; justify-content:center; padding:48px 45px 82px; background:transparent; isolation:isolate; }
.mp-gallery-lightbox::before { content:""; position:absolute; inset:0; z-index:0; border-radius:14px; background:rgba(15,12,18,.96); }
.mp-gallery-lightbox > * { z-index:1; }
.mp-gallery-viewer { position:relative; max-width:92vw; max-height:82vh; margin:0; text-align:center; }
.mp-gallery-viewer img { max-width:92vw; max-height:76vh; border-radius:10px; object-fit:contain; box-shadow:0 12px 50px rgba(0,0,0,.35); }
.mp-gallery-viewer figcaption { margin-top:10px; color:#eee; font-size:13px; }
.mp-gallery-close,.mp-gallery-nav { position:absolute; border:0; color:#fff; background:rgba(255,255,255,.12); cursor:pointer; }
.mp-gallery-close { top:16px; right:18px; width:40px; height:40px; border-radius:50%; font-size:28px; }
.mp-gallery-nav { top:50%; width:42px; height:58px; margin-top:-29px; border-radius:12px; font-size:42px; line-height:40px; }
.mp-gallery-prev { left:12px; }.mp-gallery-next { right:12px; }
.mp-gallery-actions { position:absolute; bottom:18px; display:flex; gap:10px; }
.mp-gallery-actions button { border:1px solid rgba(255,255,255,.3); border-radius:20px; padding:8px 15px; color:#fff; background:rgba(255,255,255,.1); font-size:12px; }
</style>
