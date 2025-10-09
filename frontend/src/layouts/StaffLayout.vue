<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { StaffSidebar } from '@/components/custom/staff-sidebar'
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
  const matched = route.matched.filter(r => r.meta?.breadcrumb)
  
  // Build breadcrumb trail
  if (matched.length > 0) {
    const currentRoute = matched[matched.length - 1]
    
    // Recursively build parent chain
    const buildParentChain = (routeName: string): BreadcrumbItem[] => {
      const parentChain: BreadcrumbItem[] = []
      const foundRoute = router.getRoutes().find(r => r.name === routeName)
      
      if (foundRoute && foundRoute.meta?.breadcrumb) {
        // If this route has a parent, recursively get its chain first
        if (foundRoute.meta.parentRoute) {
          parentChain.push(...buildParentChain(foundRoute.meta.parentRoute as string))
        }
        
        // Add this route to the chain
        parentChain.push({
          title: foundRoute.meta.breadcrumb as string,
          path: foundRoute.path,
          isCurrentPage: false
        })
      }
      
      return parentChain
    }
    
    // If current route has a parent, build the full chain
    if (currentRoute.meta?.parentRoute) {
      items.push(...buildParentChain(currentRoute.meta.parentRoute as string))
    }
    
    // Add current route
    items.push({
      title: currentRoute.meta.breadcrumb as string,
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
        <StaffSidebar />
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

                <!-- Render Staff features based on the route -->
                <RouterView />
            </main>
        </SidebarInset>
    </SidebarProvider>
</template>
