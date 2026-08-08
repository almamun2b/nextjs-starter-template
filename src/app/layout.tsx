import { me } from '@/app/actions/user'
import { AuthProvider } from '@/context/auth-context'
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
  variable: '--font-geist-mono',
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
  const userResult = await me().catch(() => null)
  const user = userResult?.success && userResult.data ? userResult.data : null

  return (
    <html
      lang="en"
      className={`${robotoSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <TooltipProvider>
          <AuthProvider initialUser={user}>{children}</AuthProvider>
        </TooltipProvider>
        <Toaster />
      </body>
    </html>
  )
}
