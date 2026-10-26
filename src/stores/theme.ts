import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  function readSavedTheme(): 'dark' | 'light' | null {
    if (typeof window === 'undefined') return null
    try {
      const saved = window.localStorage.getItem('theme')
      return saved === 'dark' || saved === 'light' ? saved : null
    } catch {
      return null
    }
  }

  function initialDark(): boolean {
    const saved = readSavedTheme()
    if (saved) return saved === 'dark'
    return typeof window !== 'undefined'
      && Boolean(window.matchMedia?.('(prefers-color-scheme: dark)').matches)
  }

  const dark = ref(initialDark())

  function toggle() {
    dark.value = !dark.value
    try {
      window.localStorage.setItem('theme', dark.value ? 'dark' : 'light')
    } catch {
      // Le thème reste utilisable même si le stockage local est indisponible.
    }
  }

  function applyTheme(val: boolean) {
    if (typeof document === 'undefined') return
    document.documentElement.classList.toggle('dark', val)
  }

  watch(dark, applyTheme, { immediate: true })

  const init = () => {
    const saved = readSavedTheme()
    if (saved === 'dark') {
      dark.value = true
    } else if (saved === null) {
      // Première visite : suit la préférence du système d'exploitation.
      if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
        dark.value = true
      }
    }
  }

  return { dark, toggle, init }
})
