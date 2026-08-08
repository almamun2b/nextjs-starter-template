import { Badge, type badgeVariants } from '@/components/ui/badge'
import { USER_ROLE_OPTIONS, USER_STATUS_OPTIONS } from '@/constant/user'
import { normalizeEnumValue } from '@/lib/enum'
import { UserRole, UserStatus } from '@/types/user.types'
import type { VariantProps } from 'class-variance-authority'

type TBadgeVariant = VariantProps<typeof badgeVariants>['variant']

const ROLE_LABELS = Object.fromEntries(
  USER_ROLE_OPTIONS.map((option) => [option.value, option.label])
)

const STATUS_LABELS = Object.fromEntries(
  USER_STATUS_OPTIONS.map((option) => [option.value, option.label])
)

const ROLE_VARIANTS: Record<string, TBadgeVariant> = {
  SUPER_ADMIN: 'default',
  ADMIN: 'secondary',
  USER: 'outline',
}

const STATUS_VARIANTS: Record<string, TBadgeVariant> = {
  ACTIVE: 'default',
  PENDING: 'secondary',
  INACTIVE: 'outline',
  SUSPENDED: 'destructive',
  BANNED: 'destructive',
  DELETED: 'destructive',
}

export function RoleBadge({ role }: { role: UserRole | string }) {
  const value = normalizeEnumValue(UserRole, role) ?? 'USER'
  return (
    <Badge variant={ROLE_VARIANTS[value] ?? 'outline'}>
      {ROLE_LABELS[value] ?? value}
    </Badge>
  )
}

export function StatusBadge({ status }: { status: UserStatus | string }) {
  const value = normalizeEnumValue(UserStatus, status) ?? 'PENDING'
  return (
    <Badge variant={STATUS_VARIANTS[value] ?? 'outline'}>
      {STATUS_LABELS[value] ?? value}
    </Badge>
  )
}
