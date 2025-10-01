import type { RouteRecordRaw } from 'vue-router'

const authRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: () => import('@/layouts/AuthLayout.vue'),
    meta: {
      title: 'Login'
    },
    children: [
      {
        path: '',
        component: () => import('@/features/auth/pages/Login.vue'),
      }
    ]
  },
  {
    path: '/register',
    component: () => import('@/layouts/AuthLayout.vue'),
    meta: {
      title: 'Sign Up'
    },
    children: [
      {
        path: '',
        component: () => import('@/features/auth/pages/Register.vue'),
      }
    ]
  }
]

export default authRoutes