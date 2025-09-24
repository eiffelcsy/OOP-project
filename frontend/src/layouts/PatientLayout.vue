<script setup lang="ts">
import { PatientSidebar } from '@/components/custom/patient-sidebar'
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
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
                            <BreadcrumbItem class="hidden md:block">
                                <BreadcrumbPage>
                                    Dashboard
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>

                <!-- Render Patient features based on the route -->
                <RouterView />
            </main>
        </SidebarInset>
    </SidebarProvider>
</template>