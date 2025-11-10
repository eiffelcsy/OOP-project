import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/features/auth/composables/useAuth'
import { supabase } from '@/lib/supabase'

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

// Navigation guard for route protection
router.beforeEach(async (to, from, next) => {
  const { isAuthenticated, isPatient, isStaff, isAdmin, isLoading, refreshUser } = useAuth()
  
  // If auth is still loading, wait for it to initialize
  // Also check session directly from Supabase as a fallback
  if (isLoading.value || !isAuthenticated.value) {
    const { data: { session } } = await supabase.auth.getSession()
    
    // If we have a session but auth state isn't loaded yet, refresh it
    if (session && !isAuthenticated.value) {
      await refreshUser()
    }
  }

  // Check if route requires authentication
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiredRole = to.meta.role as string | undefined

  // Public routes that don't require auth (auth pages and queue display)
  const isAuthRoute = to.path.startsWith('/login') || 
                      to.path.startsWith('/register') || 
                      to.path.startsWith('/forgot-password') || 
                      to.path.startsWith('/reset-password') || 
                      to.path.startsWith('/contact')
  const isPublicRoute = to.path.startsWith('/queue-display')

  // If user is authenticated and trying to access auth pages, redirect to appropriate dashboard
  if (isAuthenticated.value && isAuthRoute) {
    if (isPatient.value) {
      return next('/patient/dashboard')
    } else if (isStaff.value) {
      return next('/staff/dashboard')
    } else if (isAdmin.value) {
      return next('/admin/dashboard')
    }
  }

  // If route requires authentication
  if (requiresAuth) {
    // Check if user is authenticated
    if (!isAuthenticated.value) {
      // Redirect to login with return URL
      return next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    }

    // Check role-based access
    if (requiredRole) {
      const hasRequiredRole = 
        (requiredRole === 'patient' && isPatient.value) ||
        (requiredRole === 'staff' && isStaff.value) ||
        (requiredRole === 'admin' && isAdmin.value)

      if (!hasRequiredRole) {
        // User doesn't have required role, redirect to their dashboard
        if (isPatient.value) {
          return next('/patient/dashboard')
        } else if (isStaff.value) {
          return next('/staff/dashboard')
        } else if (isAdmin.value) {
          return next('/admin/dashboard')
        } else {
          // Unknown role, redirect to login
          return next('/login')
        }
      }
    }
  }

  // Allow navigation
  next()
})

export default router