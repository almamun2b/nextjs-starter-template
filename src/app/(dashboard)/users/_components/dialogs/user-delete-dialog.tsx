'use client'

import { deleteUserHard, deleteUserSoft } from '@/app/actions/user'
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
} from '@/components/ui/alert-dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { type IUser } from '@/types/user.types'
import { AlertTriangleIcon, Loader2Icon } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

interface UserDeleteDialogProps {
  user: IUser
  /** `soft` deactivates and is reversible; `hard` permanently removes. */
  mode: 'soft' | 'hard'
  onClose: () => void
  onSuccess: () => void
}

export function UserDeleteDialog({
  user,
  mode,
  onClose,
  onSuccess,
}: UserDeleteDialogProps) {
  const [confirmText, setConfirmText] = useState('')
  const [isPending, startTransition] = useTransition()

  const isHard = mode === 'hard'
  // Permanent deletion demands typing the email — a deliberate speed bump.
  const canConfirm = isHard ? confirmText.trim() === user.email : true

  const handleConfirm = () => {
    startTransition(async () => {
      // Both delete actions throw on failure rather than returning an error union.
      try {
        const result = isHard
          ? await deleteUserHard(user.id)
          : await deleteUserSoft(user.id)

        if (result.success) {
          toast.success(result.message)
          onSuccess()
          onClose()
          return
        }
        toast.error(result.message)
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to delete user.'
        )
      }
    })
  }

  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !isPending) onClose()
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <AlertTriangleIcon className="text-destructive" />
          </AlertDialogMedia>
          <AlertDialogTitle>
            {isHard ? 'Permanently delete user' : 'Delete user'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isHard ? (
              <>
                This permanently removes{' '}
                <span className="font-medium">{user.email}</span> and all of
                their data. This action cannot be undone.
              </>
            ) : (
              <>
                <span className="font-medium">{user.email}</span> will be
                deleted and lose access. This can be reversed by an
                administrator.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isHard && (
          <Field>
            <FieldLabel htmlFor="confirm-email">
              Type <span className="font-mono">{user.email}</span> to confirm
            </FieldLabel>
            <Input
              id="confirm-email"
              value={confirmText}
              autoComplete="off"
              onChange={(event) => setConfirmText(event.target.value)}
              placeholder={user.email}
            />
          </Field>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending || !canConfirm}
            onClick={(event) => {
              // Keep the dialog open so the pending state is actually visible.
              event.preventDefault()
              handleConfirm()
            }}
          >
            {isPending && <Loader2Icon className="size-3.5 animate-spin" />}
            {isPending
              ? 'Deleting...'
              : isHard
                ? 'Delete permanently'
                : 'Delete user'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
