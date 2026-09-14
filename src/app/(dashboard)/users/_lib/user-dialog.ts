import { type IUser } from '@/types/user.types'

/** Every row-level action that opens a dialog. */
export type TUserDialogAction =
  | 'view'
  | 'edit'
  | 'role'
  | 'status'
  | 'delete-soft'
  | 'delete-hard'

export interface TUserDialogState {
  action: TUserDialogAction
  user: IUser
}
