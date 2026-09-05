<template>
  <div class="mp-toast-root" aria-live="polite">
    <TransitionGroup name="mp-toast">
      <div
        v-for="n in notifications"
        :key="n.id"
        class="mp-toast"
        :class="['mp-toast--' + n.type, { 'mp-toast--closing': closing[n.id] }]"
      >
        <span class="mp-toast-icon material-symbols-outlined" aria-hidden="true">
          {{ icon(n.type) }}
        </span>
        <p class="mp-toast-message">{{ n.message }}</p>
        <button type="button" class="mp-toast-close" @click="dismiss(n.id)">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useNotificationStore, type NotificationType } from '../../stores/notifications'

const store = useNotificationStore()
const notifications = store.items
const closing: Record<number, boolean> = reactive({})

function icon(type: NotificationType) {
  return type === 'success' ? 'check_circle' : type === 'info' ? 'info' : 'error'
}

function dismiss(id: number) {
  closing[id] = true
  setTimeout(() => store.remove(id), 180)
}
</script>

<style>
.mp-toast-root {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 200;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.mp-toast {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 280px;
  max-width: 420px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #e6ddf0;
  box-shadow: 0 10px 30px rgba(40, 25, 80, 0.12);
  color: #1d1733;
  font-size: 13.5px;
  line-height: 1.4;
}

.mp-toast--error {
  border-color: #f5c4c4;
  background: #fff5f5;
  color: #8a1c1c;
}
.mp-toast--success {
  border-color: #c4ecd2;
  background: #f3fdf6;
  color: #146c36;
}
.mp-toast--info {
  border-color: #cfe3ff;
  background: #f5f9ff;
  color: #12407a;
}

.mp-toast-icon {
  font-size: 20px;
  flex-shrink: 0;
}
.mp-toast-message {
  flex: 1;
}
.mp-toast-close {
  background: transparent;
  border: 0;
  cursor: pointer;
  color: inherit;
  opacity: 0.7;
  padding: 4px;
  border-radius: 8px;
  display: grid;
  place-items: center;
}
.mp-toast-close:hover {
  opacity: 1;
  background: rgba(127, 127, 127, 0.12);
}
.mp-toast-close .material-symbols-outlined {
  font-size: 18px;
}

.mp-toast-enter-active,
.mp-toast-leave-active {
  transition: all 0.2s ease;
}
.mp-toast-enter-from,
.mp-toast-leave-to {
  opacity: 0;
  transform: translateX(40px);
}
.mp-toast-leave-active {
  position: absolute;
  right: 16px;
}
</style>
