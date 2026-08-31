<template>
  <div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
    <div class="px-6 py-4 flex items-center justify-between" :class="headerClass">
      <div>
        <p class="text-[11px] font-bold uppercase tracking-widest text-slate-500">{{ section }}</p>
        <h3 class="text-[15px] font-bold text-slate-800 mt-0.5">{{ title }}</h3>
        <p v-if="subtitle" class="text-[13px] text-slate-500 mt-0.5">{{ subtitle }}</p>
      </div>
      <button class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
        <span class="material-symbols-outlined text-[16px]">refresh</span>
        Actualiser
      </button>
    </div>

    <div class="px-6 py-5">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  section: string
  title: string
  subtitle?: string
  headerClass?: string
}>()
</script>
