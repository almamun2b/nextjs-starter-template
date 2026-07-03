import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function Hero() {
  return (
    <section className="flex flex-col items-center justify-center pt-40 text-center">
      <h1 className="text-5xl font-extrabold tracking-tight">Welcome</h1>
      <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
        A complete solution to manage product — filter, sort, paginate, and
        control preorder lifecycles with ease.
      </p>
      <div className="mt-8">
        <Button size="lg" asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    </section>
  )
}
