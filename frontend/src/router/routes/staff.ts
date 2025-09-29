import type { RouteRecordRaw } from 'vue-router'

const staffRoutes: RouteRecordRaw[] = [
  {
    path: '/staff',
    component: () => import('@/layouts/StaffLayout.vue'),
    meta: {
      requiresAuth: true,
      role: 'staff'
    },
    children: [
      {
        path: '',
        redirect: '/staff/dashboard'
      },
      {
        path: 'dashboard',
        name: 'StaffDashboard',
        component: () => import('@/features/dashboard/pages/StaffDashboard.vue'),
        meta: {
          title: 'Dashboard',
          breadcrumb: 'Dashboard'
        }
      },
      {
        path: 'queue',
        name: 'QueueManagement',
        component: () => import('@/features/queue/pages/QueueManagement.vue'),
        meta: {
          title: 'Queue Management',
          breadcrumb: 'Queue Management'
        }
      },
      {
        path: 'appointments',
        name: 'StaffAppointments',
        component: () => import('@/features/appointments/pages/StaffAppointments.vue'),
        meta: {
          title: 'Appointments',
          breadcrumb: 'Appointments'
        }
      }
    ]
  }
]

export default staffRoutes
