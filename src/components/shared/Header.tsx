import { ThemeToggle } from '@/components/shared/theme-toggle'
import { getIsLoggedIn } from '@/lib/session'
import { Home } from 'lucide-react'
import Link from 'next/link'
import { Button } from '../ui/button'

const Header = async () => {
  const isLoggedIn = await getIsLoggedIn()
  const navMenus = [{ label: 'Home', href: '/', icon: null }]
  return (
    <nav className="fixed z-50 h-14 w-full border bg-background">
      <div className="container mx-auto flex h-full items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Home className="size-8 text-primary" />
          <span className="text-lg font-semibold">My Site</span>
        </Link>

        <div className="flex items-center gap-4">
          {navMenus.map((menu) => (
            <Button
              variant="link"
              className="px-1 text-foreground"
              asChild
              key={menu.label}
            >
              <Link href={menu.href}>{menu.label}</Link>
            </Button>
          ))}
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            {isLoggedIn ? (
              <Button asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href="/login">Login</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export { Header }
