'use client'

import { deleteMyAvatar, updateMyAvatarOnly } from '@/app/actions/user'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Loader2Icon, TrashIcon, UploadIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef, useTransition } from 'react'
import { toast } from 'sonner'

interface AvatarUploaderProps {
  avatarUrl: string | null
  initials: string
}

export function AvatarUploader({ avatarUrl, initials }: AvatarUploaderProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, startUpload] = useTransition()
  const [isRemoving, startRemove] = useTransition()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    startUpload(async () => {
      const result = await updateMyAvatarOnly({ avatar: file })

      if (result.success) {
        toast.success(result.message)
        router.refresh()
        return
      }
      toast.error(result.message)
    })
  }

  const handleRemove = () => {
    startRemove(async () => {
      try {
        const result = await deleteMyAvatar()
        toast.success(result.message)
        router.refresh()
      } catch (error) {
        toast.error((error as Error).message)
      }
    })
  }

  const isPending = isUploading || isRemoving

  return (
    <div className="flex items-center gap-4">
      <Avatar className="size-14 rounded-full ring-2 ring-border">
        {avatarUrl && <AvatarImage src={avatarUrl} alt={initials} />}
        <AvatarFallback className="rounded-full text-base font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-1.5">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2Icon className="size-3.5 animate-spin" />
            ) : (
              <UploadIcon className="size-3.5" />
            )}
            {isUploading ? 'Uploading...' : 'Change avatar'}
          </Button>
          {avatarUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={handleRemove}
            >
              <TrashIcon className="size-3.5" />
              {isRemoving ? 'Removing...' : 'Remove'}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">JPG, PNG or GIF.</p>
      </div>
    </div>
  )
}
