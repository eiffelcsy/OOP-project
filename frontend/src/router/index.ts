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
    
    // Queue Display Route (public access for waiting area)
    {
      path: '/queue-display/:queueId',
      name: 'QueueDisplay',
      component: () => import('@/features/queue-display/pages/QueueDisplay.vue'),
      meta: {
        title: 'Queue Display'
      }
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