import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const dark = ref(false)

  function toggle() {
    dark.value = !dark.value
  }

  watch(dark, (val) => {
    if (val) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', val ? 'dark' : 'light')
  }, { immediate: true })

  const init = () => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') {
      dark.value = true
    }
  }

  return { dark, toggle, init }
})
