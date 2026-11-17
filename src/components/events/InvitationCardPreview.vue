<template>
  <div ref="frame" class="card-preview-frame" :style="{ aspectRatio: '852 / 1280' }">
    <div class="card-preview-canvas" :style="{ transform: `scale(${scale})` }" aria-hidden="true">
      <InvitationCardDesign :invitation="invitation" :qr-data-uri="qr" :photo-url="photoUrl || '/images/invitations/preview-reception.jpg'" preview />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import type { PublicInvitation } from '../../api/publicInvitation'
import InvitationCardDesign from '../public-invitation/InvitationCardDesign.vue'
defineProps<{ invitation: PublicInvitation; qr: string; photoUrl?: string | null }>()
const frame = ref<HTMLElement | null>(null)
const scale = ref(0)
let observer: ResizeObserver | undefined
onMounted(() => {
  observer = new ResizeObserver(([entry]) => { scale.value = entry.contentRect.width / 852 })
  if (frame.value) observer.observe(frame.value)
})
onBeforeUnmount(() => observer?.disconnect())
</script>
<style scoped>
.card-preview-frame { position:relative; width:100%; overflow:hidden; border-radius:10px; background:#fcf9f5; }
.card-preview-canvas { width:852px; height:1280px; transform-origin:top left; pointer-events:none; }
</style>
