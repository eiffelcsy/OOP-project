<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AdminSidebar } from '@/components/custom/admin-sidebar'
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
  
  const isDashboard = route.name === 'AdminDashboard'
  items.push({
    title: 'Dashboard',
    path: isDashboard ? undefined : '/admin/dashboard',
    isCurrentPage: isDashboard
  })
  
  if (route.name === 'AdminUsers') {
    items.push({
      title: 'User Management',
      path: undefined,
      isCurrentPage: true
    })
  } else if (route.name === 'AdminClinics') {
    items.push({
      title: 'Clinic Management',
      path: undefined,
      isCurrentPage: true
    })
  } else if (route.name === 'AdminSystemAlerts') {
    items.push({
      title: 'System Alerts',
      path: undefined,
      isCurrentPage: true
    })
  } else if (route.name === 'AdminReports') {
    items.push({
      title: 'Reports & Analytics',
      path: undefined,
      isCurrentPage: true
    })
  } else if (route.name === 'AdminSettings') {
    items.push({
      title: 'System Settings',
      path: undefined,
      isCurrentPage: true
    })
  }
  
  return items
})

const navigateTo = (path: string) => {
  router.push(path)
}
</script>

<template>
    <SidebarProvider>
        <AdminSidebar />
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

                <!-- Render Admin features based on the route -->
                <RouterView />
            </main>
        </SidebarInset>
    </SidebarProvider>
</template>
