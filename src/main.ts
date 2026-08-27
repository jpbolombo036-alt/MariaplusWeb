import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import './style.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)

// Aide : sur expiration de session (interceptor refresh), remettre l'UI au login.
window.addEventListener('mp:session-expired', () => {
  const auth = useAuthStore()
  auth.expireSession()
  router.push({ name: 'login' })
})

app.mount('#app')
