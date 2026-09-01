'use client'

import { updateUserStatus } from '@/app/actions/user'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { USER_STATUS_OPTIONS } from '@/constant/user'
import { type IUser } from '@/types/user.types'
import { Loader2Icon } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  readUserStatus,
  toStatusParam,
  type TUserStatusValue,
} from '../../_lib/user-enum'

interface UserStatusDialogProps {
  user: IUser
  onClose: () => void
  onSuccess: () => void
}

export function UserStatusDialog({
  user,
  onClose,
  onSuccess,
}: UserStatusDialogProps) {
  const currentStatus = readUserStatus(user.status)
  const [status, setStatus] = useState<TUserStatusValue>(currentStatus)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = () => {
    startTransition(async () => {
      // `updateUserStatus` throws on failure rather than returning an error union.
      try {
        const result = await updateUserStatus(user.id, {
          status: toStatusParam(status),
        })
        if (result.success) {
          toast.success(result.message)
          onSuccess()
          onClose()
          return
        }
        toast.error(result.message)
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to update status.'
        )
      }
    })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change status</DialogTitle>
          <DialogDescription>
            Update the account status for{' '}
            <span className="font-medium">{user.email}</span>.
          </DialogDescription>
        </DialogHeader>

        <Field>
          <FieldLabel htmlFor="user-status">Status</FieldLabel>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as TUserStatusValue)}
          >
            <SelectTrigger id="user-status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {USER_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || status === currentStatus}
          >
            {isPending && <Loader2Icon className="size-3.5 animate-spin" />}
            {isPending ? 'Saving...' : 'Save status'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
