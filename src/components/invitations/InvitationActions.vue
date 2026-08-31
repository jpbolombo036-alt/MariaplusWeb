<template>
  <div class="flex flex-wrap gap-2">
    <!-- Envoyer (Généré / Brouillon) -->
    <PermGuard :allow="['INVITATION_SEND']">
      <button
        v-if="i.status === 'GENERATED' || i.status === 'DRAFT'"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
        @click="$emit('send', i)"
      >
        <span class="material-symbols-outlined text-[18px]">send</span>
        <span class="hidden sm:inline">Envoyer</span>
      </button>
    </PermGuard>

    <!-- Relancer (Envoyée) -->
    <PermGuard :allow="['INVITATION_RESEND']">
      <button
        v-if="i.status === 'SENT'"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
        @click="$emit('resend', i)"
      >
        <span class="material-symbols-outlined text-[18px]">refresh</span>
        <span class="hidden sm:inline">Relancer</span>
      </button>
    </PermGuard>

    <!-- QR -->
    <PermGuard :allow="['INVITATION_SEND']">
      <button
        v-if="i.status === 'SENT' || i.status === 'GENERATED' || i.status === 'DRAFT'"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors text-sm font-medium"
        @click="$emit('qr', i)"
      >
        <span class="material-symbols-outlined text-[18px]">qr_code</span>
        <span class="hidden sm:inline">QR</span>
      </button>
    </PermGuard>

    <!-- Annuler -->
    <PermGuard :allow="['INVITATION_CANCEL']">
      <button
        v-if="i.status !== 'CANCELLED'"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors text-sm font-medium"
        @click="$emit('cancel', i)"
      >
        <span class="material-symbols-outlined text-[18px]">block</span>
        <span class="hidden sm:inline">Annuler</span>
      </button>
    </PermGuard>

    <!-- Supprimer -->
    <PermGuard :allow="['INVITATION_DELETE']">
      <button
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm font-medium"
        @click="$emit('delete', i)"
      >
        <span class="material-symbols-outlined text-[18px]">delete</span>
        <span class="hidden sm:inline">Supprimer</span>
      </button>
    </PermGuard>
  </div>
</template>

<script setup lang="ts">
import PermGuard from '../common/PermGuard.vue'

defineProps<{
  i: any
}>()

defineEmits<{
  send: [i: any]
  resend: [i: any]
  qr: [i: any]
  cancel: [i: any]
  delete: [i: any]
}>()
</script>