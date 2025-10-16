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
  return currentUser.value?.profile?.full_name || "Patient User"
})

const userEmail = computed(() => {
  return currentUser.value?.email || "patient@clinicams.com"
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
            <a href="/patient/dashboard">
              <div class="flex aspect-square size-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Icon icon="lucide:hospital" class="size-6" />
              </div>
              <div class="flex flex-col gap-0.5 leading-none">
                <span class="font-semibold text-xl">ClinicAMS</span>
                <span class="text-xs text-sidebar-muted-foreground">Patient Platform</span>
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
                <a href="/patient/dashboard">
                  <Icon icon="lucide:layout-dashboard" class="size-4" />
                  <span>Dashboard</span>
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
                        <a href="/patient/appointments">
                          <Icon icon="lucide:eye" class="size-4" />
                          <span>My Appointments</span>
                        </a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild>
                        <a href="/patient/appointments/book">
                          <Icon icon="lucide:calendar-plus" class="size-4" />
                          <span>Book Appointment</span>
                        </a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
            <SidebarMenuItem key="MedicalRecords">
              <SidebarMenuButton asChild>
                <a href="/patient/medical-records">
                  <Icon icon="lucide:file-text" class="size-4" />
                  <span>Medical Records</span>
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