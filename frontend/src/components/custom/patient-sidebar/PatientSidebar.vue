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
import { Icon } from "@iconify/vue"

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
            <SidebarMenuItem key="Home">
              <SidebarMenuButton as-child>
                <a href="/patient/dashboard">
                  <Icon icon="lucide:home" class="size-4" />
                  <span>Home</span>
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
                          <span>View Appointments</span>
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
          <SidebarMenuButton size="lg" as-child>
            <a href="/patient/profile">
              <div class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Icon icon="lucide:user" class="size-4" />
              </div>
              <div class="flex flex-col gap-0.5 leading-none">
                <span class="font-semibold">John Doe</span> <!-- replace with user name -->
                <span class="">john.doe@example.com</span> <!-- replace with user email -->
              </div>
              <Icon icon="lucide:chevrons-up-down" class="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>