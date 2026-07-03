'use client'

import { Home } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../../ui/breadcrumb'

interface BreadcrumbSegment {
  label: string
  href: string
  isCurrentPage?: boolean
}

const AppBreadcrumb = () => {
  const pathname = usePathname()

  const generateBreadcrumbs = (path: string): BreadcrumbSegment[] => {
    const segments = path.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbSegment[] = []

    if (path.startsWith('/dashboard') || segments.length > 0) {
      breadcrumbs.push({
        label: 'Home',
        href: '/',
      })
    }

    let currentPath = ''
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`
      const isLast = index === segments.length - 1

      const label = getSegmentLabel(segment)

      breadcrumbs.push({
        label,
        href: currentPath,
        isCurrentPage: isLast,
      })
    })

    return breadcrumbs
  }

  const getSegmentLabel = (segment: string): string => {
    const labelMappings: Record<string, string> = {
      dashboard: 'Dashboard',
      edit: 'Edit',
    }

    if (labelMappings[segment]) {
      return labelMappings[segment]
    }

    if (segment.match(/^[a-f0-9-]{36}$/) || segment.match(/^\d+$/)) {
      return 'Details'
    }

    return segment
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const breadcrumbs = generateBreadcrumbs(pathname)

  if (pathname === '/' || breadcrumbs.length <= 1) {
    return null
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((breadcrumb, index) => (
          <div key={breadcrumb.href} className="flex items-center">
            <BreadcrumbItem>
              {breadcrumb.isCurrentPage ? (
                <BreadcrumbPage className="flex items-center gap-1">
                  {breadcrumb.label === 'Home' && <Home className="h-4 w-4" />}
                  {breadcrumb.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link
                    href={breadcrumb.href}
                    className="flex items-center gap-1"
                  >
                    {breadcrumb.label === 'Home' && (
                      <Home className="h-4 w-4" />
                    )}
                    {breadcrumb.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export { AppBreadcrumb }
