import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './index.css'
// Use a local copy of vue-sonner CSS to avoid resolution issues in the
// development container/build that prevent deep imports from the package.
import './styles/vue-sonner.css'
import { useAuth } from '@/features/auth/composables/useAuth'

const app = createApp(App)

app.use(router)

// Initialize authentication state early so components can read currentUser
const { initializeAuth } = useAuth()
initializeAuth().catch((err) => console.warn('Failed to initialize auth:', err))

app.mount('#app')
