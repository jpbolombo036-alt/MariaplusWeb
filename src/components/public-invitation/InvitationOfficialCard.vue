<template>
  <div ref="renderElement" class="mp-inv-render" aria-hidden="true">
    <InvitationCardDesign :invitation="invitation" :qr-data-uri="qrDataUri" :photo-url="cardBgUrl" />
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import type { PublicInvitation } from '../../api/publicInvitation'
import InvitationCardDesign from './InvitationCardDesign.vue'
defineProps<{ invitation: PublicInvitation; qrDataUri: string; cardBgUrl: string }>()
const renderElement = ref<HTMLElement | null>(null)
defineExpose({ renderElement })
</script>
