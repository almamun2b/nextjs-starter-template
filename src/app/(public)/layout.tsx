import { Footer } from '@/components/shared/Footer'
import { Header } from '@/components/shared/Header'

export default function CommonLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <Header />
      <main className="container mx-auto min-h-dvh px-6">{children}</main>
      <Footer />
    </>
  )
}
