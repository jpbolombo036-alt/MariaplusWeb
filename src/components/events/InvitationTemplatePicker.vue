<template>
  <fieldset class="template-picker" :disabled="disabled">
    <legend>Modèle de la carte d’invitation</legend>
    <p class="template-help">Un même modèle pour tous vos invités, avec leur nom et leur QR personnel.</p>
    <div class="template-grid">
      <label v-for="template in invitationCardTemplates" :key="template.id" class="template-option" :class="{ selected: modelValue === template.id }">
        <input type="radio" :name="groupName" :value="template.id" :checked="modelValue === template.id" @change="$emit('update:modelValue', template.id)" />
        <InvitationCardPreview :invitation="{ ...preview, invitationCardTemplate: template.id }" :qr="demoQr" :photo-url="photoUrl" />
        <span class="template-name">{{ template.name }}</span>
        <span class="template-description">{{ template.description }}</span>
      </label>
    </div>
    <div class="template-preview-action"><span>Aperçus avec un invité fictif{{ photoUrl ? '.' : ' et une photo illustrative.' }}</span><button type="button" @click="dialog?.showModal()">Agrandir l’aperçu</button></div>
    <p v-if="published" class="template-notice">Un changement s’applique aux prochaines cartes générées. Les images déjà téléchargées par les invités conservent leur ancien visuel.</p>
  </fieldset>
  <dialog ref="dialog" class="template-dialog" @click="closeOnBackdrop">
    <div class="template-dialog-header"><h2>Aperçu · {{ invitationCardTemplates.find(item => item.id === modelValue)?.name }}</h2><button type="button" @click="dialog?.close()">Fermer</button></div>
    <p class="template-help">Démonstration : ce QR ne donne accès à aucun événement.</p>
    <InvitationCardPreview :invitation="{ ...preview, invitationCardTemplate: modelValue }" :qr="demoQr" :photo-url="photoUrl" />
  </dialog>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import QRCode from 'qrcode'
import type { PublicInvitation } from '../../api/publicInvitation'
import { invitationCardTemplates, type InvitationCardTemplate } from '../../models/invitationCard'
import InvitationCardPreview from './InvitationCardPreview.vue'
defineProps<{ modelValue: InvitationCardTemplate; preview: PublicInvitation; photoUrl?: string | null; published?: boolean; disabled?: boolean }>()
defineEmits<{ 'update:modelValue': [value: InvitationCardTemplate] }>()
const dialog = ref<HTMLDialogElement | null>(null)
const demoQr = ref('')
const groupName = `card-template-${Math.random().toString(36).slice(2)}`
onMounted(async () => { demoQr.value = await QRCode.toDataURL('EVENTIAEASY-DEMONSTRATION-SANS-ACCES', { width:260, margin:4 }) })
function closeOnBackdrop(event: MouseEvent) { if (event.target === dialog.value) { const box = dialog.value!.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.value?.close() } }
</script>
<style scoped>
.template-picker { border:0; padding:22px 0; min-width:0; border-top:1px solid #e2e5eb; }
.template-picker legend { font-weight:700; font-size:16px; padding:0 8px 0 0; }
.template-help { color:#687083; font-size:12px; line-height:1.5; margin:3px 0 18px; }
.template-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; }
.template-option { display:flex; flex-direction:column; position:relative; cursor:pointer; padding:8px; border:2px solid #e8e7ed; border-radius:15px; min-width:0; transition:border-color .15s; }
.template-option:hover { border-color:#b3a0d8; }
.template-option.selected { border-color:#703bc4; background:#f7f2ff; }
.template-option:focus-within { outline:2px solid #703bc4; outline-offset:3px; }
.template-option input { align-self:flex-end; margin:2px 2px 8px; accent-color:#703bc4; width:17px; height:17px; }
.template-name { font-size:14px; font-weight:700; margin:12px 3px 5px; color:#272135; }
.template-description { font-size:11px; line-height:1.5; color:#746d7d; margin:0 3px 5px; }
.template-preview-action { display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-top:15px; font-size:11px; color:#746d7d; }
.template-preview-action button { color:#6936b6; font-weight:700; }
.template-notice { border-left:3px solid #bf944d; padding:10px 12px; font-size:12px; color:#805e28; margin:16px 0 0; background:#fff9ed; line-height:1.5; }
.template-dialog { border:0; border-radius:18px; padding:22px; width:min(610px,94vw); max-height:92dvh; overflow:auto; background:#fff; color:#20172f; }
.template-dialog::backdrop { background:rgb(20 12 37 / .65); }
.template-dialog-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:9px; }
.template-dialog-header h2 { font-size:17px; font-weight:700; }
.template-dialog-header button { padding:8px 12px; border:1px solid #ddd5e8; border-radius:8px; font-size:12px; }
@media(max-width:520px) { .template-grid { gap:7px; } .template-option { padding:5px; border-radius:10px; } .template-description { display:none; } .template-name { font-size:12px; margin:9px 1px 3px; } }
</style>
