import { getCurrentUser } from '@/lib/auth/dal'
import { AuthProvider } from '@/providers/auth-provider'
import { ThemeProvider } from '@/providers/theme-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { Metadata } from 'next'
import { Geist_Mono, Roboto } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const robotoSans = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
})

const geistMono = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Pre Order Manager',
  description: 'Pre Order Manager',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Memoized in the DAL, so this render's guards reuse the same profile read.
  const user = await getCurrentUser()

  return (
    <html
      lang="en"
      className={`${robotoSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <AuthProvider initialUser={user}>{children}</AuthProvider>
          </TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
