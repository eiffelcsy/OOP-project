<script setup lang="ts">
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
  SidebarFooter,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  CollapsibleTrigger,
  CollapsibleContent,
  Collapsible,
} from "@/components/ui/collapsible"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Icon } from "@iconify/vue"
import { useAuth } from "@/features/auth/composables/useAuth"
import { useRouter } from "vue-router"
import { computed } from "vue"

const { currentUser, logout } = useAuth()
const router = useRouter()

const userName = computed(() => {
  return currentUser.value?.profile?.full_name || "Admin User"
})

const userEmail = computed(() => {
  return currentUser.value?.email || "admin@clinicams.com"
})

const handleLogout = async () => {
  await logout()
  router.push("/login")
}

</script>

<template>
  <Sidebar>
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="xl" as-child>
            <a href="/admin/dashboard">
              <div class="flex aspect-square size-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Icon icon="lucide:hospital" class="size-6" />
              </div>
              <div class="flex flex-col gap-0.5 leading-none">
                <span class="font-semibold text-xl">ClinicAMS</span>
                <span class="text-xs text-sidebar-muted-foreground">Admin Panel</span>
              </div>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
    <SidebarContent>
      <!-- Overview Section -->
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem key="Dashboard">
              <SidebarMenuButton as-child>
                <a href="/admin/dashboard">
                  <Icon icon="lucide:layout-dashboard" class="size-4" />
                  <span>Dashboard</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <Collapsible key="UserManagement" title="User Management" default-open class="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger as-child>
                  <SidebarMenuButton>
                    <Icon icon="lucide:users" class="size-4" />
                    <span>User Management</span>
                    <Icon icon="lucide:chevron-right"
                      class="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild>
                        <a href="/admin/users">
                          <Icon icon="lucide:user-search" class="size-4" />
                          <span>All Users</span>
                        </a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild>
                        <a href="/admin/users/create">
                          <Icon icon="lucide:user-plus" class="size-4" />
                          <span>Add New User</span>
                        </a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>

            <Collapsible key="ClinicManagement" title="Clinic Management" default-open class="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger as-child>
                  <SidebarMenuButton>
                    <Icon icon="lucide:building" class="size-4" />
                    <span>Clinic Management</span>
                    <Icon icon="lucide:chevron-right"
                      class="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild>
                        <a href="/admin/clinics">
                          <Icon icon="lucide:building-2" class="size-4" />
                          <span>All Clinics</span>
                        </a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild>
                        <a href="/admin/clinics/create">
                          <Icon icon="lucide:plus" class="size-4" />
                          <span>Add New Clinic</span>
                        </a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>

            <Collapsible key="DoctorManagement" title="Doctor Management" default-open class="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger as-child>
                  <SidebarMenuButton>
                    <Icon icon="lucide:briefcase-medical" class="size-4" />
                    <span>Doctor Management</span>
                    <Icon icon="lucide:chevron-right"
                      class="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild>
                        <a href="/admin/doctors">
                          <Icon icon="lucide:briefcase-medical" class="size-4" />
                          <span>Doctors By Clinic</span>
                        </a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild>
                        <a href="/admin/doctors/create">
                          <Icon icon="lucide:plus" class="size-4" />
                          <span>Add New Doctor</span>
                        </a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
    <SidebarSeparator />
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <Popover>
            <PopoverTrigger as-child>
              <SidebarMenuButton size="lg">
                <div class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Icon icon="lucide:user-cog" class="size-4" />
                </div>
                <div class="flex flex-col gap-0.5 leading-none">
                  <span class="font-semibold">{{ userName }}</span>
                  <span class="text-xs">{{ userEmail }}</span>
                </div>
                <Icon icon="lucide:chevrons-up-down" class="ml-auto" />
              </SidebarMenuButton>
            </PopoverTrigger>
            <PopoverContent class="w-56 p-2" align="end">
              <Button 
                variant="ghost" 
                class="w-full justify-start" 
                @click="handleLogout"
              >
                <Icon icon="lucide:log-out" class="mr-2 size-4" />
                Logout
              </Button>
            </PopoverContent>
          </Popover>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>