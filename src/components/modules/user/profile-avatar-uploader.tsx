'use client'

import { deleteMyAvatar, updateMyAvatarOnly } from '@/app/actions/user'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
  AVATAR_ACCEPT_ATTRIBUTE,
  AVATAR_ACCEPTED_TYPES,
  AVATAR_MAX_BYTES,
  AVATAR_MAX_LABEL,
} from '@/constant/user'
import { getUserDisplayName, getUserInitials } from '@/lib/user-format'
import { cn } from '@/lib/utils'
import { type IUser } from '@/types/user.types'
import { Trash2Icon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'

interface ProfileAvatarUploaderProps {
  user: IUser
  className?: string
}

export function ProfileAvatarUploader({
  user,
  className,
}: ProfileAvatarUploaderProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [preview, setPreview] = useState<string | null>(null)
  const previewUrlRef = useRef<string | null>(null)
  // Set while an upload's server response is confirmed but the `user` prop
  // hasn't caught up yet (it re-syncs from AuthProvider after router.refresh()).
  const awaitingRefreshRef = useRef(false)

  const [inputError, setInputError] = useState<string | null>(null)
  const [isRemoveOpen, setIsRemoveOpen] = useState(false)

  const [isUploading, startUpload] = useTransition()
  const [isRemoving, startRemove] = useTransition()
  const isBusy = isUploading || isRemoving

  const releasePreview = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
  }

  // Once the server-confirmed avatar catches up with what we uploaded, drop
  // the local preview rather than holding it forever.
  useEffect(() => {
    if (preview && awaitingRefreshRef.current) {
      releasePreview()
      setPreview(null)
      awaitingRefreshRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.avatar?.url, user.avatar?.updatedAt])

  // Revoke on unmount regardless of when it happens.
  useEffect(() => releasePreview, [])

  const avatarSrc = useMemo(() => {
    if (preview) return preview
    const avatar = user.avatar
    if (!avatar?.url) return null
    const stamp = new Date(avatar.updatedAt).getTime()
    return Number.isNaN(stamp) ? avatar.url : `${avatar.url}?v=${stamp}`
  }, [preview, user.avatar])

  const displayName = getUserDisplayName(user)
  const initials = getUserInitials(user)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputError(null)
    const file = event.target.files?.[0]
    // Reset so picking the same file again still fires a change event.
    event.target.value = ''
    if (!file) return

    if (!AVATAR_ACCEPTED_TYPES.includes(file.type as never)) {
      setInputError('Choose a PNG, JPEG, or WebP image.')
      return
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setInputError(`Image must be ${AVATAR_MAX_LABEL} or smaller.`)
      return
    }

    releasePreview()
    const nextUrl = URL.createObjectURL(file)
    previewUrlRef.current = nextUrl
    setPreview(nextUrl)

    startUpload(async () => {
      try {
        const result = await updateMyAvatarOnly({ avatar: file })

        if (result.success) {
          toast.success(result.message)
          awaitingRefreshRef.current = true
          router.refresh()
          return
        }
        toast.error(result.message)
        releasePreview()
        setPreview(null)
      } catch {
        toast.error('Could not upload your photo. Please try again.')
        releasePreview()
        setPreview(null)
      }
    })
  }

  const handleRemove = () => {
    startRemove(async () => {
      try {
        const result = await deleteMyAvatar()
        if (result.success) {
          toast.success(result.message)
          setIsRemoveOpen(false)
          router.refresh()
          return
        }
        toast.error(result.message)
      } catch {
        toast.error('Could not remove your photo. Please try again.')
      }
    })
  }

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div className="relative size-16 shrink-0" aria-busy={isBusy}>
        <Avatar className="size-16">
          {avatarSrc && <AvatarImage src={avatarSrc} alt="" />}
          <AvatarFallback className="text-base font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        {isBusy && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-full bg-background/70">
            <Spinner className="size-5" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="profile-avatar-input" className="sr-only">
          Profile photo for {displayName}
        </label>
        <input
          ref={inputRef}
          id="profile-avatar-input"
          type="file"
          accept={AVATAR_ACCEPT_ATTRIBUTE}
          className="sr-only"
          disabled={isBusy}
          onChange={handleFileChange}
        />
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isBusy}
            onClick={() => inputRef.current?.click()}
          >
            {user.avatar ? 'Change photo' : 'Upload photo'}
          </Button>
          {user.avatar && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isBusy}
              onClick={() => setIsRemoveOpen(true)}
              className="text-destructive hover:text-destructive"
            >
              Remove
            </Button>
          )}
        </div>
        {/* Reserved height so an inline error never shifts what's below it. */}
        <p className="min-h-4 text-xs text-destructive">{inputError}</p>
      </div>

      <AlertDialog
        open={isRemoveOpen}
        onOpenChange={(open) => !isRemoving && setIsRemoveOpen(open)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2Icon className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Remove profile photo?</AlertDialogTitle>
            <AlertDialogDescription>
              Your photo will be deleted and your initials will be shown
              instead. You can upload a new one at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isRemoving}
              onClick={(event) => {
                // Keep the dialog open so the pending state is visible.
                event.preventDefault()
                handleRemove()
              }}
            >
              {isRemoving && <Spinner className="size-3.5" />}
              {isRemoving ? 'Removing...' : 'Remove photo'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
