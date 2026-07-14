'use client'

import { logoutUser } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { useTransition } from 'react'

export function LogoutButton() {
  const [isPending, startTransition] = useTransition()

  const handleLogout = () => {
    startTransition(() => {
      void logoutUser()
    })
  }

  return (
    <Button onClick={handleLogout} disabled={isPending} variant="outline">
      {isPending ? 'Logging out...' : 'Logout'}
    </Button>
  )
}
