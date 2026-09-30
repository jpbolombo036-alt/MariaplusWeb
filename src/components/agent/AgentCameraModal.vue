<template>
  <Teleport to="body">
    <div v-if="open" class="ag-viewer" @click.self="$emit('close')">
      <div class="ag-viewer-box ag-camera-box">
        <div class="ag-viewer-head">
          <span>Scanner le QR code</span>
          <button type="button" class="ag-viewer-close" @click="$emit('close')">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="ag-camera-zone">
          <video ref="videoEl" class="ag-camera-video" playsinline muted></video>
        </div>
        <div class="ag-viewer-foot">
          <p v-if="error" class="ag-error">{{ error }}</p>
          <p v-else-if="loading" class="ag-empty">Activation de la caméra…</p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ open: boolean; loading: boolean; error: string }>()
defineEmits<{ close: [] }>()

const videoEl = ref<HTMLVideoElement | null>(null)
defineExpose({ videoEl })
</script>
