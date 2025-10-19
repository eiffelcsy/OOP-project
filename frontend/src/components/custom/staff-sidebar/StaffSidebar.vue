<script setup lang="ts">
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
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
  return currentUser.value?.profile?.full_name || "Staff User"
})

const userEmail = computed(() => {
  return currentUser.value?.email || "staff@clinicams.com"
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
            <a href="/staff/dashboard">
              <div class="flex aspect-square size-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Icon icon="lucide:hospital" class="size-6 stroke-1" />
              </div>
              <div class="flex flex-col gap-0.5 leading-none">
                <span class="font-semibold text-xl">ClinicAMS</span>
                <span class="text-xs text-sidebar-muted-foreground">Staff Portal</span>
              </div>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem key="Dashboard">
              <SidebarMenuButton as-child>
                <a href="/staff/dashboard">
                  <Icon icon="lucide:layout-dashboard" class="size-4" />
                  <span>Dashboard</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem key="QueueManagement">
              <SidebarMenuButton as-child>
                <a href="/staff/queue">
                  <Icon icon="lucide:users" class="size-4" />
                  <span>Queue Management</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <Collapsible key="Appointments" title="Appointments" default-open class="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger as-child>
                  <SidebarMenuButton>
                    <Icon icon="lucide:calendar-days" class="size-4" />
                    <span>Appointments</span>
                    <Icon icon="lucide:chevron-right"
                      class="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild>
                        <a href="/staff/appointments">
                          <Icon icon="lucide:calendar" class="size-4" />
                          <span>Today's Appointments</span>
                        </a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild>
                        <a href="/staff/appointments/schedule">
                          <Icon icon="lucide:calendar-plus" class="size-4" />
                          <span>Schedule Walk-in</span>
                        </a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild>
                        <a href="/staff/appointments/all">
                          <Icon icon="lucide:history" class="size-4" />
                          <span>All Appointments</span>
                        </a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>

            <SidebarMenuItem key="Reports">
              <SidebarMenuButton asChild>
                <a href="/staff/reports">
                  <Icon icon="lucide:bar-chart" class="size-4" />
                  <span>Reports</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
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
                  <Icon icon="lucide:user" class="size-4" />
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