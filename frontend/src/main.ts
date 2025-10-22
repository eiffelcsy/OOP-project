import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './index.css'
import 'vue-sonner/style.css'
import { useAuth } from '@/features/auth/composables/useAuth'

const app = createApp(App)

app.use(router)

const { initializeAuth } = useAuth()
initializeAuth().catch((err) => console.warn('Failed to initialize auth:', err))

app.mount('#app')
