<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PatientSidebar } from '@/components/custom/patient-sidebar'
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'

const route = useRoute()
const router = useRouter()

interface BreadcrumbItem {
  title: string
  path?: string
  isCurrentPage: boolean
}

const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
  const items: BreadcrumbItem[] = []
  
  const isDashboard = route.name === 'PatientDashboard'
  items.push({
    title: 'Dashboard',
    path: isDashboard ? undefined : '/patient/dashboard',
    isCurrentPage: isDashboard
  })
  
  if (route.name === 'PatientAppointments') {
    items.push({
      title: 'My Appointments',
      path: undefined,
      isCurrentPage: true
    })
  } else if (route.name === 'BookAppointment') {
    items.push({
      title: 'My Appointments',
      path: '/patient/appointments',
      isCurrentPage: false
    })
    items.push({
      title: 'Book Appointment',
      path: undefined,
      isCurrentPage: true
    })
  }
//   } else if (route.name === 'PatientMedicalRecords') {
//     items.push({
//       title: 'Medical Records',
//       path: undefined,
//       isCurrentPage: true
//     })
//   }
  
  return items
})

const navigateTo = (path: string) => {
  router.push(path)
}
</script>

<template>
    <SidebarProvider>
        <PatientSidebar />
        <SidebarInset>
            <main>
                <header class="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger class="-ml-1" />
                    <Separator orientation="vertical" class="mr-2 !h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <template v-for="(item, index) in breadcrumbItems" :key="index">
                                <BreadcrumbItem class="hidden md:block">
                                    <BreadcrumbLink 
                                        v-if="!item.isCurrentPage && item.path"
                                        @click="navigateTo(item.path)"
                                        class="cursor-pointer"
                                    >
                                        {{ item.title }}
                                    </BreadcrumbLink>
                                    <BreadcrumbPage v-else>
                                        {{ item.title }}
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator 
                                    v-if="index < breadcrumbItems.length - 1" 
                                    class="hidden md:block"
                                />
                            </template>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>

                <!-- Render Patient features based on the route -->
                <RouterView />
            </main>
        </SidebarInset>
    </SidebarProvider>
</template>