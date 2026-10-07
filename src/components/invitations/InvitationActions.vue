<template>
  <div class="flex flex-wrap gap-2">
    <!-- Envoyer (Généré / Brouillon) -->
    <PermGuard :allow="['INVITATION_SEND']">
      <button
        v-if="i.status === 'GENERATED' || i.status === 'DRAFT'"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="busy"
        @click="$emit('send', i)"
      >
        <span class="material-symbols-outlined text-[18px]" :class="{ 'animate-spin': busy }">{{ busy ? 'progress_activity' : 'send' }}</span>
        <span class="hidden sm:inline">Envoyer</span>
      </button>
    </PermGuard>

    <!-- Relancer (Envoyée) -->
    <PermGuard :allow="['INVITATION_RESEND']">
      <button
        v-if="i.status === 'SENT'"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="busy"
        @click="$emit('resend', i)"
      >
        <span class="material-symbols-outlined text-[18px]" :class="{ 'animate-spin': busy }">{{ busy ? 'progress_activity' : 'refresh' }}</span>
        <span class="hidden sm:inline">{{ busy ? 'Envoi…' : 'Relancer' }}</span>
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

    <!-- Lien public : recopier le lien à envoyer à l'invité (WhatsApp, SMS…) -->
    <PermGuard :allow="['INVITATION_SEND']">
      <button
        v-if="i.status !== 'CANCELLED'"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="linkBusy"
        :title="link ? 'Copier le lien de l’invitation' : 'Récupérer le lien de l’invitation'"
        @click="$emit('link', i)"
      >
        <span class="material-symbols-outlined text-[18px]">{{ linkBusy ? 'progress_activity' : 'link' }}</span>
        <span class="hidden sm:inline">Lien</span>
      </button>
    </PermGuard>

    <!-- Partager sur WhatsApp : ouvre WhatsApp directement avec le lien pré-rempli -->
    <PermGuard :allow="['INVITATION_SEND']">
      <button
        v-if="i.status !== 'CANCELLED'"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] text-white hover:brightness-95 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-[#25D366]/30"
        :disabled="linkBusy"
        :title="linkBusy ? 'Récupération du lien…' : 'Partager le lien sur WhatsApp'"
        @click="$emit('whatsapp', i)"
      >
        <span v-if="linkBusy" class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
        <WhatsappIcon v-else class="w-4 h-4" />
        <span class="hidden sm:inline">WhatsApp</span>
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
import WhatsappIcon from '../common/WhatsappIcon.vue'

defineProps<{
  i: any
  /** Lien public déjà connu pour cette invitation ('' = à récupérer). */
  link?: string
  /** Recherche du lien en cours (décodage du QR) → bouton désactivé. */
  linkBusy?: boolean
  /** Envoi / relance en cours pour cette invitation → boutons désactivés. */
  busy?: boolean
}>()

defineEmits<{
  send: [i: any]
  resend: [i: any]
  qr: [i: any]
  link: [i: any]
  whatsapp: [i: any]
  cancel: [i: any]
  delete: [i: any]
}>()
</script>