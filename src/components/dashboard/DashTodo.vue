<template>
  <section class="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-3 min-w-0" aria-labelledby="todo-title">
    <div class="flex items-center justify-between gap-3">
      <h3 id="todo-title" class="m-0 text-[16px] font-semibold text-slate-900">À faire</h3>
      <span
        v-if="items.length"
        class="text-[12px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700"
      >{{ actionCount }} action{{ actionCount > 1 ? 's' : '' }}</span>
    </div>

    <p v-if="!items.length" class="m-0 flex items-center gap-3 p-3 rounded-xl bg-green-50 text-[14px] text-green-700 font-medium">
      <CircleCheck :size="20" aria-hidden="true" />Tout est en ordre pour cet événement.
    </p>

    <ul v-else class="list-none m-0 p-0 flex flex-col gap-2.5" data-testid="todo">
      <li
        v-for="item in items"
        :key="item.id"
        class="flex items-center gap-3.5 p-3 rounded-xl"
        :class="item.urgent ? 'bg-amber-50' : 'bg-slate-50'"
      >
        <span class="w-9 h-9 rounded-lg grid place-items-center shrink-0" :class="TONE_CHIP[item.tone]">
          <component :is="item.icon" :size="16" :stroke-width="2" aria-hidden="true" />
        </span>
        <div class="flex-1 min-w-0">
          <div class="text-[14px] font-semibold text-slate-900 break-words">{{ item.title }}</div>
          <div v-if="item.detail" class="text-[13px] text-slate-600 break-words">{{ item.detail }}</div>
        </div>
        <router-link
          v-if="item.to"
          :to="item.to"
          class="text-[14px] font-semibold text-primary hover:underline shrink-0 py-2"
        >{{ item.action }}</router-link>
        <button
          v-else-if="item.onClick"
          type="button"
          class="text-[14px] font-semibold text-primary hover:underline shrink-0 py-2"
          @click="item.onClick"
        >{{ item.action }}</button>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import { CircleCheck } from 'lucide-vue-next'
import { TONE_CHIP, type Tone } from './tones'

export interface TodoItem {
  id: string
  title: string
  detail?: string
  icon: Component
  tone: Tone
  urgent?: boolean
  /** Informational items (e.g. the next reminder) are not counted as actions. */
  info?: boolean
  action: string
  to?: string
  onClick?: () => void
}

const props = defineProps<{ items: TodoItem[] }>()
const actionCount = computed(() => props.items.filter((i) => !i.info).length)
</script>
