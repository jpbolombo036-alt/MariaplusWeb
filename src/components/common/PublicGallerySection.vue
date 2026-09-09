<template>
  <section v-if="gallery && gallery.photos.length" class="mp-inv-section">
    <h2 class="mp-inv-section-title">Galerie</h2>
    <p v-if="gallery.description" class="mp-inv-message">{{ gallery.description }}</p>
    <div class="grid grid-cols-2 gap-3 mt-4">
      <button v-for="photo in gallery.photos" :key="photo.id" type="button" class="overflow-hidden rounded-xl" @click="selected = photo.imageUrl">
        <img :src="absolute(photo.imageUrl)" :alt="photo.caption || 'Photo de l’événement'" class="w-full aspect-square object-cover" loading="lazy" />
      </button>
    </div>
    <div v-if="selected" class="fixed inset-0 z-50 bg-black/80 p-4 flex items-center justify-center" @click.self="selected = null">
      <button class="absolute top-4 right-4 text-white text-3xl" @click="selected = null">×</button>
      <img :src="absolute(selected)" alt="Photo de l’événement" class="max-h-[90vh] max-w-full rounded-xl object-contain" />
    </div>
  </section>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getPublicGallery, type Gallery } from '../../api/gallery'
import { ApiConfig } from '../../api/config'
const props = defineProps<{ token: string }>()
const gallery = ref<Gallery | null>(null)
const selected = ref<string | null>(null)
const absolute = (url: string) => url.startsWith('http') ? url : `${ApiConfig.baseUrl}${url}`
onMounted(async () => { try { gallery.value = await getPublicGallery(props.token) } catch { gallery.value = null } })
</script>
