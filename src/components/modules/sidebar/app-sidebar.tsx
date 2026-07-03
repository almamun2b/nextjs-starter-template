'use client'

import * as React from 'react'

import { NavMain } from '@/components/modules/sidebar/nav-main'
import { NavUser } from '@/components/modules/sidebar/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import {
  GalleryVerticalEnd,
  Layout,
  Settings,
  UserIcon,
  Users,
} from 'lucide-react'

const data = {
  user: {
    name: 'Mamun',
    email: 'mamun@example.com',
    avatar: null,
  },
  navMain: {
    label: 'Dashboard',
    items: [
      {
        title: 'Dashboard',
        url: '/dashboard',
        icon: Layout,
        isActive: false,
      },
      {
        title: 'Users',
        url: '/users',
        icon: Users,
        isActive: false,
      },
    ],
  },
  navSecondary: {
    label: 'Settings',
    items: [
      {
        title: 'Settings',
        url: '/settings',
        icon: Settings,
        isActive: false,
      },
      {
        title: 'Profile',
        url: '/profile',
        icon: UserIcon,
        isActive: false,
      },
    ],
  },
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex h-16 flex-row border-b">
        <div className="flex items-center gap-2 text-sidebar-accent-foreground">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <GalleryVerticalEnd className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-lg leading-tight">
            <span className="truncate font-medium">Dashboard</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain group={data.navMain} />
        <NavMain group={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
