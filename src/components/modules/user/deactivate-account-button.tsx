'use client'

import { deactivateMyAccount } from '@/app/actions/user'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AlertTriangle, ShieldOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'

export function DeactivateAccountButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleDeactivate = () => {
    startTransition(async () => {
      try {
        const result = await deactivateMyAccount()

        if (result.success) {
          toast.success(result.message)
          router.push('/login')
          return
        }
      } catch (error) {
        const err = error as Error
        toast.error(err.message)
      }
    })
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Card className="border-destructive/30">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <ShieldOff className="size-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Permanent actions that affect your account access
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Deactivate your account</p>
              <p className="text-xs text-muted-foreground">
                You will lose access to the dashboard until an admin reactivates
                your account
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="shrink-0">
                  Deactivate
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogMedia>
                    <AlertTriangle className="size-5 text-destructive" />
                  </AlertDialogMedia>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will deactivate your account and:
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <ul className="-mt-2 space-y-2 px-6 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 block size-1 shrink-0 rounded-full bg-muted-foreground/50" />
                    You won&apos;t be able to access the dashboard or any
                    authenticated pages
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 block size-1 shrink-0 rounded-full bg-muted-foreground/50" />
                    Your profile and data will be preserved
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 block size-1 shrink-0 rounded-full bg-muted-foreground/50" />
                    An administrator can reactivate your account at any time
                  </li>
                </ul>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={handleDeactivate}
                    disabled={isPending}
                  >
                    {isPending
                      ? 'Deactivating...'
                      : 'Yes, deactivate my account'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
