<template>
  <slot v-if="allowed" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { hasAny } from '../../permissions'

const props = defineProps<{ allow: string[] }>()
const auth = useAuthStore()
const allowed = computed(() => hasAny(auth.permissions, ...props.allow))
</script>
