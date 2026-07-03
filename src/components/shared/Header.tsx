import { Home } from 'lucide-react'
import Link from 'next/link'
import { Button } from '../ui/button'

const Header = async () => {
  const navMenus = [{ label: 'Home', href: '/', icon: null }]
  const isLoggedIn = true
  return (
    <nav className="fixed z-50 h-14 w-full border bg-background dark:border-slate-700/70">
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
