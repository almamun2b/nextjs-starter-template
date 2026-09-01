'use client'

import { updateUserRole } from '@/app/actions/user'
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
import { USER_ROLE_OPTIONS } from '@/constant/user'
import { type IUser } from '@/types/user.types'
import { Loader2Icon } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  readUserRole,
  toRoleParam,
  type TUserRoleValue,
} from '../../_lib/user-enum'

interface UserRoleDialogProps {
  user: IUser
  onClose: () => void
  onSuccess: () => void
}

export function UserRoleDialog({
  user,
  onClose,
  onSuccess,
}: UserRoleDialogProps) {
  const currentRole = readUserRole(user.role)
  const [role, setRole] = useState<TUserRoleValue>(currentRole)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = () => {
    startTransition(async () => {
      // `updateUserRole` throws on failure rather than returning an error union.
      try {
        const result = await updateUserRole(user.id, {
          role: toRoleParam(role),
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
          error instanceof Error ? error.message : 'Failed to update role.'
        )
      }
    })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change role</DialogTitle>
          <DialogDescription>
            Update the role for{' '}
            <span className="font-medium">{user.email}</span>.
          </DialogDescription>
        </DialogHeader>

        <Field>
          <FieldLabel htmlFor="user-role">Role</FieldLabel>
          <Select
            value={role}
            onValueChange={(value) => setRole(value as TUserRoleValue)}
          >
            <SelectTrigger id="user-role" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {USER_ROLE_OPTIONS.map((option) => (
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
            disabled={isPending || role === currentRole}
          >
            {isPending && <Loader2Icon className="size-3.5 animate-spin" />}
            {isPending ? 'Saving...' : 'Save role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
