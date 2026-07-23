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
import type { IUser } from '@/types/user.types'
import {
  GalleryVerticalEnd,
  Layout,
  Settings,
  UserIcon,
  Users,
} from 'lucide-react'

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: IUser | null
}

const navMain = {
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
}

const navSecondary = {
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
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
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
        <NavMain group={navMain} />
        <NavMain group={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
