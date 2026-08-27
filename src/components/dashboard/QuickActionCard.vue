<template>
  <div class="bg-white border border-outline-variant/60 rounded-card p-5 shadow-card flex flex-col">
    <span class="font-semibold text-on-surface mb-4">Actions Rapides</span>
    <div class="grid grid-cols-2 gap-3 flex-1">
      <button
        v-for="a in actions"
        :key="a.label"
        class="flex flex-col items-center justify-center gap-1.5 h-16 px-2 rounded-[10px] bg-surface-container-low text-on-surface border border-outline-variant/60 hover:border-primary/40 hover:text-primary transition-colors"
      >
        <span class="material-symbols-outlined text-primary text-[20px]">{{ a.icon }}</span>
        <span class="text-[11px] font-medium leading-tight text-center">{{ a.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const actions = [
  { label: 'Ajouter un invité', icon: 'person_add' },
  { label: 'Nouvelle invitation', icon: 'mail_add' },
  { label: 'Scanner QR', icon: 'qr_code_scanner' },
  { label: 'Gérer Tables', icon: 'table_restaurant' },
]
</script>
