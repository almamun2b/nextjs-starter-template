'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'

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
  KeyRound,
  Layout,
  SettingsIcon,
  UserIcon,
  Users,
} from 'lucide-react'

type AppSidebarProps = React.ComponentProps<typeof Sidebar>

const NAV_MAIN_ITEMS = [
  { title: 'Dashboard', url: '/dashboard', icon: Layout },
  { title: 'Users', url: '/users', icon: Users },
]

const NAV_SECONDARY_ITEMS = [
  { title: 'Profile', url: '/profile', icon: UserIcon },
  { title: 'Settings', url: '/settings', icon: SettingsIcon },
  { title: 'Change Password', url: '/change-password', icon: KeyRound },
]

export function AppSidebar(props: AppSidebarProps) {
  const pathname = usePathname()
  const withActiveState = (items: typeof NAV_MAIN_ITEMS) =>
    items.map((item) => ({
      ...item,
      isActive: pathname === item.url || pathname.startsWith(`${item.url}/`),
    }))

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
        <NavMain
          group={{ label: 'Dashboard', items: withActiveState(NAV_MAIN_ITEMS) }}
        />
        <NavMain
          group={{
            label: 'Settings',
            items: withActiveState(NAV_SECONDARY_ITEMS),
          }}
          className="mt-auto"
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
