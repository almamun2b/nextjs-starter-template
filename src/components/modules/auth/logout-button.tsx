'use client'

import { logoutUser } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

export function LogoutButton() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleLogout = () => {
    startTransition(async () => {
      try {
        const result = await logoutUser()
        if (result.success) {
          router.push('/login')
        }
      } catch (error) {
        console.error(error)
      }
    })
  }

  return (
    <Button onClick={handleLogout} disabled={isPending} variant="outline">
      {isPending ? 'Logging out...' : 'Logout'}
    </Button>
  )
}
