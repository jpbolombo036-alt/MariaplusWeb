<template>
  <div class="v-card p-5 sm:p-6 mb-6">
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div class="flex items-center gap-3 min-w-0">
        <button
          v-if="back"
          type="button"
          aria-label="Retour"
          class="h-10 w-10 shrink-0 rounded-lg border border-slate-200 bg-white text-slate-600 inline-flex items-center justify-center hover:bg-slate-50 transition-colors"
          @click="$router.push(back)"
        >
          <span class="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <div class="min-w-0">
          <h1 class="text-[22px] font-bold text-slate-900 tracking-tight truncate">{{ title }}</h1>
          <p v-if="subtitle" class="text-[13px] text-slate-500 mt-0.5 font-medium">{{ subtitle }}</p>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; subtitle?: string; back?: string }>()
</script>
