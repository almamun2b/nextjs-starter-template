'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'

import { NavMain } from '@/components/modules/sidebar/nav-main'
import { NavUser } from '@/components/modules/sidebar/nav-user'
import { PERMISSIONS, type TPermission } from '@/constant/permissions'
import { useAuth } from '@/providers/auth-provider'
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
  type LucideIcon,
  SettingsIcon,
  UserIcon,
  Users,
} from 'lucide-react'

type AppSidebarProps = React.ComponentProps<typeof Sidebar>

interface INavItem {
  title: string
  url: string
  icon: LucideIcon
  /**
   * Permission required to see the link. Keep it identical to the route's
   * entry in `src/lib/auth/route-policy.ts` — a link the proxy would answer
   * with a 403 has no business being in the navigation.
   */
  permission: TPermission
}

const NAV_MAIN_ITEMS: readonly INavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: Layout,
    permission: PERMISSIONS.DASHBOARD_READ,
  },
  {
    title: 'Users',
    url: '/users',
    icon: Users,
    permission: PERMISSIONS.USERS_READ,
  },
]

const NAV_SECONDARY_ITEMS: readonly INavItem[] = [
  {
    title: 'Profile',
    url: '/profile',
    icon: UserIcon,
    permission: PERMISSIONS.PROFILE_READ,
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: SettingsIcon,
    permission: PERMISSIONS.SETTINGS_READ,
  },
  {
    title: 'Change Password',
    url: '/change-password',
    icon: KeyRound,
    permission: PERMISSIONS.PROFILE_PASSWORD,
  },
]

export function AppSidebar(props: AppSidebarProps) {
  const pathname = usePathname()
  const { can } = useAuth()

  const visibleItems = (items: readonly INavItem[]) =>
    items
      .filter((item) => can(item.permission))
      .map((item) => ({
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
          group={{ label: 'Dashboard', items: visibleItems(NAV_MAIN_ITEMS) }}
        />
        <NavMain
          group={{
            label: 'Settings',
            items: visibleItems(NAV_SECONDARY_ITEMS),
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
