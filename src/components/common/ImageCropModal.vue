<template>
  <div class="fixed inset-0 bg-black/60 z-[70] grid place-items-center px-4" @click.self="close">
    <div class="w-full max-w-xl bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-2xl overflow-hidden">
      <div class="flex items-center justify-between px-5 py-4 border-b border-outline-variant">
        <h3 class="text-[15px] font-bold text-on-surface">{{ title }}</h3>
        <button type="button" class="text-on-surface-variant hover:text-on-surface" @click="close">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div class="p-4">
        <Cropper
          ref="cropperRef"
          :src="src"
          :stencil-props="{ aspectRatio, movable: true, resizable: true }"
          image-restriction="fit-area"
          class="h-72 md:h-96 bg-surface-container rounded-xl overflow-hidden"
        />
        <p class="text-[11.5px] text-on-surface-variant mt-3 text-center">
          Glissez pour positionner • Molette pour zoomer • Image optimisée automatiquement à la confirmation
        </p>
      </div>
      <div class="flex justify-end gap-2 px-5 py-4 border-t border-outline-variant">
        <button type="button" class="px-4 h-10 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors" @click="close">Annuler</button>
        <button type="button" :disabled="busy" class="px-5 h-10 rounded-xl bg-primary text-on-primary font-semibold inline-flex items-center gap-2 disabled:opacity-60" @click="confirm">
          <span v-if="busy" class="material-symbols-outlined text-base animate-spin">progress_activity</span>
          <span v-else class="material-symbols-outlined text-base">crop</span>
          Confirmer
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'

const props = withDefaults(
  defineProps<{
    /** URL (object URL) de l'image à recadrer. */
    src: string
    title?: string
    /** Ratio largeur/hauteur imposé (1 = carré, 16/9 = bannière). */
    aspectRatio?: number
    /** Largeur max de l'image générée (px) — compression automatique. */
    maxWidth?: number
  }>(),
  { title: 'Recadrer l\u2019image', aspectRatio: 1, maxWidth: 1200 },
)

const emit = defineEmits<{ (e: 'close'): void; (e: 'confirm', blob: Blob): void }>()

const cropperRef = ref<{ getResult: () => { canvas?: HTMLCanvasElement | null } } | null>(null)
const busy = ref(false)

function close() {
  if (!busy.value) emit('close')
}

/** Génère un JPEG recadré + redimensionné (maxWidth) et le renvoie au parent. */
async function confirm() {
  const canvas = cropperRef.value?.getResult()?.canvas
  if (!canvas) {
    emit('close')
    return
  }
  busy.value = true
  try {
    const scale = Math.min(1, props.maxWidth / canvas.width)
    const out = document.createElement('canvas')
    out.width = Math.max(1, Math.round(canvas.width * scale))
    out.height = Math.max(1, Math.round(canvas.height * scale))
    const ctx = out.getContext('2d')
    if (!ctx) throw new Error('canvas indisponible')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, out.width, out.height)
    ctx.drawImage(canvas, 0, 0, out.width, out.height)
    const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, 'image/jpeg', 0.88))
    if (!blob) throw new Error('génération image impossible')
    emit('confirm', blob)
  } catch {
    emit('close')
  } finally {
    busy.value = false
  }
}
</script>
