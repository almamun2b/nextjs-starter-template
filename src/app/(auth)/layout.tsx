export default function CommonLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <main className="container mx-auto min-h-dvh px-6">{children}</main>
}
