import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { useThemeStore } from './stores/theme'
import './style.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)

const theme = useThemeStore()
theme.init()

// Aide : sur expiration de session (interceptor refresh), remettre l'UI au login.
window.addEventListener('mp:session-expired', () => {
  const auth = useAuthStore()
  auth.expireSession()
  router.push({ name: 'login' })
})

app.mount('#app')
