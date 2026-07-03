import { Separator } from '@/components/ui/separator'
import { Mail, Phone, SquareStar } from 'lucide-react'
import Link from 'next/link'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  const footerSections = [
    {
      title: 'Services',
      links: [
        { name: 'Service 1', href: '/' },
        { name: 'Service 2', href: '/' },
      ],
    },
    {
      title: 'Company',
      links: [
        { name: 'About Us', href: '/' },
        { name: 'Contact Us', href: '/' },
      ],
    },
  ]

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-12 md:px-6">
        <div className="mb-12 grid grid-cols-1 gap-8 sm:grid-cols-1 md:grid-cols-12">
          <div className="md:col-span-6">
            <div className="max-w-105 space-y-6">
              <Link href="/" className="mb-4 inline-flex items-center gap-2">
                <SquareStar className="size-8 text-primary" />
                <h2 className="text-xl font-bold">My Site</h2>
              </Link>
              <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                Manage your pre orders and stay organized.
              </p>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>hello@preorder.com</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>+1 (555) 123-4567</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:col-span-6 md:grid-cols-2 md:justify-end">
            {footerSections.map((section) => (
              <div key={section.title}>
                <h3 className="mb-4 font-semibold">{section.title}</h3>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-primary hover:underline"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <Separator className="mb-8" />

        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="text-center text-sm text-muted-foreground md:text-left">
            <p>© {currentYear} My Site. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export { Footer }
