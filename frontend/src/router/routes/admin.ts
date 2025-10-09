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
      }
    ]
  }
]

export default adminRoutes