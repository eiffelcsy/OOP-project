import { createRouter, createWebHistory } from 'vue-router'

import authRoutes from './routes/auth'
import patientRoutes from './routes/patient'
import staffRoutes from './routes/staff'
import adminRoutes from './routes/admin'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    
    ...authRoutes,
    ...patientRoutes,
    ...staffRoutes,
    ...adminRoutes,
    
    // TODO: Catch-all 404 route
    // {
    //   path: '/:pathMatch(.*)*',
    //   name: 'NotFound',
    //   component: () => import('@/pages/NotFound.vue')
    // }
  ],
})

export default router