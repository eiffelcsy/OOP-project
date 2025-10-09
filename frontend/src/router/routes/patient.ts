import type { RouteRecordRaw } from 'vue-router'

const patientRoutes: RouteRecordRaw[] = [
  {
    path: '/patient',
    component: () => import('@/layouts/PatientLayout.vue'),
    meta: {
      requiresAuth: true,
      role: 'patient'
    },
    children: [
      {
        path: '',
        redirect: '/patient/dashboard'
      },
      {
        path: 'dashboard',
        name: 'PatientDashboard',
        component: () => import('@/features/dashboard/pages/PatientDashboard.vue'),
        meta: {
          title: 'Dashboard',
          breadcrumb: 'Dashboard'
        }
      },
      {
        path: 'appointments',
        name: 'PatientAppointments',
        component: () => import('@/features/appointments/pages/ViewAppointments.vue'),
        meta: {
          title: 'My Appointments',
          breadcrumb: 'Appointments'
        }
      },
      {
        path: 'appointments/book',
        name: 'BookAppointment',
        component: () => import('@/features/appointments/pages/BookAppointment.vue'),
        meta: {
          title: 'Book Appointment',
          breadcrumb: 'Book Appointment',
          parentRoute: 'PatientAppointments'
        }
      },
      {
        path: 'medical-records',
        name: 'PatientMedicalRecords',
        component: () => import('@/features/medical-records/pages/PatientMedicalRecords.vue'),
        meta: {
          title: 'Medical Records',
          breadcrumb: 'Medical Records'
        }
      }
    ]
  }
]

export default patientRoutes