import { PERMISSIONS, type TPermission } from '@/constant/permissions'
import { can, explainDenial } from '@/lib/auth/permissions'
import { type IUser } from '@/types/user.types'
import { type TUserDialogAction } from './user-dialog'

/*
 * ---------------------------------------------------------------------------
 * Per-row abilities for the users table.
 *
 * Two distinct questions per action, because they call for different UI:
 *
 *  - `held` — does the viewer's *role* allow this at all? If not the control
 *    is hidden; offering an ADMIN a "Delete permanently" item they can never
 *    use is just noise.
 *  - `allowed` / `reason` — is it allowed against *this row*? If not the
 *    control stays visible but disabled and says why, because the same viewer
 *    can perform it on other rows and a silently dead item reads as a bug.
 *
 * Both come from `@/lib/auth/permissions`, the same module the Server Actions
 * guard themselves with, so the menu and the server always agree.
 * ---------------------------------------------------------------------------
 */

interface IAbility {
  /** The viewer's role permits this action in principle. */
  held: boolean
  /** The viewer may perform it on this specific row. */
  allowed: boolean
  /** Why not, when `allowed` is false. */
  reason: string | null
}

type TUserAbilities = Record<TUserDialogAction, IAbility>

/** Which permission backs each row action. */
const ACTION_PERMISSIONS: Record<TUserDialogAction, TPermission> = {
  view: PERMISSIONS.USERS_READ,
  edit: PERMISSIONS.USERS_UPDATE,
  status: PERMISSIONS.USERS_UPDATE_STATUS,
  role: PERMISSIONS.USERS_UPDATE_ROLE,
  'delete-soft': PERMISSIONS.USERS_DELETE,
  'delete-hard': PERMISSIONS.USERS_DELETE_HARD,
}

const resolveAbility = (
  viewer: IUser | null,
  target: IUser,
  permission: TPermission
): IAbility => {
  const reason = explainDenial(viewer, target, permission)
  return { held: can(viewer, permission), allowed: reason === null, reason }
}

const buildUserAbilities = (
  viewer: IUser | null,
  target: IUser
): TUserAbilities =>
  Object.fromEntries(
    Object.entries(ACTION_PERMISSIONS).map(([action, permission]) => [
      action,
      resolveAbility(viewer, target, permission),
    ])
  ) as TUserAbilities

export {
  ACTION_PERMISSIONS,
  buildUserAbilities,
  type IAbility,
  type TUserAbilities,
}
