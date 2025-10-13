import type { RouteRecordRaw } from 'vue-router'

const adminRoutes: RouteRecordRaw[] = [
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: {
      requiresAuth: true,
      role: 'admin'
    },
    children: [
      {
        path: '',
        redirect: '/admin/dashboard'
      },
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('@/features/dashboard/pages/AdminDashboard.vue'),
        meta: {
          title: 'Dashboard',
          breadcrumb: 'Dashboard'
        }
      },
      {
        path: 'clinics',
        name: 'AdminClinics',
        component: () => import('@/features/clinic-management/pages/AdminClinics.vue'),
        meta: {
          title: 'All Clinics',
          breadcrumb: 'Clinics',
          parentRoute: 'AdminDashboard'
        }
      },
      {
        path: 'clinics/create',
        name: 'AdminCreateClinic',
        component: () => import('@/features/clinic-management/pages/AdminCreateClinic.vue'),
        meta: {
          title: 'Create Clinic',
          breadcrumb: 'Create Clinic',
          parentRoute: 'AdminClinics'
        }
      },
      {
        path: 'clinics/:id',
        name: 'AdminClinicDetails',
        component: () => import('@/features/clinic-management/pages/AdminClinicDetails.vue'),
        meta: {
          title: 'Clinic Details',
          breadcrumb: 'Clinic Details',
          parentRoute: 'AdminClinics'
        }
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('@/features/user-management/pages/AdminUsers.vue'),
        meta: {
          title: 'All Users',
          breadcrumb: 'Users',
          parentRoute: 'AdminDashboard'
        }
      },
      {
        path: 'users/create',
        name: 'AdminCreateUser',
        component: () => import('@/features/user-management/pages/AdminCreateUsers.vue'),
        meta: {
          title: 'Create User',
          breadcrumb: 'Create User',
          parentRoute: 'AdminUsers'
        }
      },
      {
        path: 'users/:id',
        name: 'AdminUserDetails',
        component: () => import('@/features/user-management/pages/AdminUserDetails.vue'),
        meta: {
          title: 'User Details',
          breadcrumb: 'User Details',
          parentRoute: 'AdminUsers'
        }
      }
    ]
  }
]

export default adminRoutes