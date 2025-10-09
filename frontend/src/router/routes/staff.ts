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
        name: 'StaffTodaysAppointments',
        component: () => import('@/features/appointments/pages/TodaysAppointments.vue'),
        meta: {
          title: 'Appointments',
          breadcrumb: 'Appointments'
        }
      },
      {
        path: 'appointments/schedule',
        name: 'ScheduleWalkIn',
        component: () => import('@/features/appointments/pages/ScheduleWalkIn.vue'),
        meta: {
          title: 'Schedule Walk-in',
          breadcrumb: 'Schedule Walk-in',
          parentRoute: 'StaffTodaysAppointments'
        }
      },
      {
        path: 'reports',
        name: 'StaffReports',
        component: () => import('@/features/reports/pages/StaffReports.vue'),
        meta: {
          title: 'Reports',
          breadcrumb: 'Reports'
        }
      }
    ]
  }
]

export default staffRoutes

