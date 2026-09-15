'use server'

import { PERMISSIONS } from '@/constant/permissions'
import { CACHE_TAGS } from '@/constant/tags'
import { $fetch } from '@/lib/$fetch'
import {
  fetchProfile,
  requireAssignableRole,
  requireCanActOnUser,
  requirePermission,
  userEndpoint,
} from '@/lib/auth/dal'
import { handleFetchError } from '@/lib/error'
import { readUserRole } from '@/lib/user-format'
import type { IErrorResponse, IResponse } from '@/types/response.types'
import type {
  TChangePasswordInput,
  TCreateUserInput,
  TUpdateProfileInput,
  TUpdateProfileWithAvatarInput,
  TUpdateRoleInput,
  TUpdateStatusInput,
  TUserDeleteResponse,
  TUserQueryOptions,
  TUserResponse,
  TUsersResponse,
  UpdateAvatarInput,
} from '@/types/user.types'
import { updateTag } from 'next/cache'

/*
 * Reads (`getAllUsers`, `getUserById`, `me`) throw on failure so the calling
 * Server Component decides what to render. Mutations return
 * `T | IErrorResponse` — see `src/lib/error.ts` for why they never throw.
 *
 * `updateTag` (not `revalidateTag`) because the user must see their own write
 * on the very next render, not a stale-while-revalidate copy.
 */

/** Profile changes show up both on the profile and in the users list. */
const updateProfileTags = (): void => {
  updateTag(CACHE_TAGS.PROFILE)
  updateTag(CACHE_TAGS.USERS)
}

const updateUserTags = (id: string): void => {
  updateTag(CACHE_TAGS.USERS)
  updateTag(CACHE_TAGS.USER(id))
}

const getAllUsers = async (
  params: TUserQueryOptions
): Promise<TUsersResponse> => {
  await requirePermission(PERMISSIONS.USERS_READ)
  const { data: response } = await $fetch.get<
    TUsersResponse,
    TUserQueryOptions
  >('/users', {
    params,
    next: { tags: [CACHE_TAGS.USERS] },
  })
  return response
}

const createUserManually = async (
  data: TCreateUserInput
): Promise<TUserResponse | IErrorResponse> => {
  const actor = await requirePermission(PERMISSIONS.USERS_CREATE)
  // The constraint is on the value being assigned, not on a target record:
  // an ADMIN may create accounts, but not peers or superiors.
  requireAssignableRole(
    actor,
    readUserRole(data.role),
    PERMISSIONS.USERS_CREATE
  )
  try {
    const { data: response } = await $fetch.post<
      TUserResponse,
      TCreateUserInput
    >('/users', { body: data })
    updateTag(CACHE_TAGS.USERS)
    return response
  } catch (error) {
    return handleFetchError(error)
  }
}

/**
 * Deliberately unguarded: this *is* the session read every guard is built on,
 * so calling `verifySession()` here would recurse. It is self-scoped — the
 * backend derives the subject from the cookie — and delegates to the DAL so
 * layout, pages, and guards share one memoized call per render pass.
 */
const me = async (): Promise<TUserResponse> => fetchProfile()

const updateMyProfile = async (
  data: TUpdateProfileInput
): Promise<TUserResponse | IErrorResponse> => {
  await requirePermission(PERMISSIONS.PROFILE_UPDATE)
  try {
    const { data: response } = await $fetch.patch<
      TUserResponse,
      TUpdateProfileInput
    >('/users/me', { body: data })
    updateProfileTags()
    return response
  } catch (error) {
    return handleFetchError(error)
  }
}

const updateMyProfileWihAvatar = async (
  data: TUpdateProfileWithAvatarInput
): Promise<TUserResponse | IErrorResponse> => {
  await requirePermission(PERMISSIONS.PROFILE_UPDATE)
  const formData = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      if (value instanceof Blob) {
        formData.append(key, value)
      } else {
        formData.append(key, String(value))
      }
    }
  })
  try {
    const { data: response } = await $fetch.patch<TUserResponse, FormData>(
      '/users/me/profile',
      { body: formData }
    )
    updateProfileTags()
    return response
  } catch (error) {
    return handleFetchError(error)
  }
}

const updateMyAvatarOnly = async (
  data: UpdateAvatarInput
): Promise<TUserResponse | IErrorResponse> => {
  await requirePermission(PERMISSIONS.PROFILE_UPDATE)
  const formData = new FormData()
  formData.append('avatar', data.avatar)
  try {
    const { data: response } = await $fetch.patch<TUserResponse, FormData>(
      '/users/me/avatar',
      { body: formData }
    )
    updateProfileTags()
    return response
  } catch (error) {
    return handleFetchError(error)
  }
}

const deleteMyAvatar = async (): Promise<TUserResponse | IErrorResponse> => {
  await requirePermission(PERMISSIONS.PROFILE_UPDATE)
  try {
    const { data: response } =
      await $fetch.delete<TUserResponse>('/users/me/avatar')
    updateProfileTags()
    return response
  } catch (error) {
    return handleFetchError(error)
  }
}

const changeMyPassword = async (
  data: TChangePasswordInput
): Promise<IResponse | IErrorResponse> => {
  await requirePermission(PERMISSIONS.PROFILE_PASSWORD)
  try {
    const { data: response } = await $fetch.patch<
      IResponse,
      TChangePasswordInput
    >('/users/me/change-password', { body: data })
    return response
  } catch (error) {
    return handleFetchError(error)
  }
}

const deactivateMyAccount = async (): Promise<
  TUserResponse | IErrorResponse
> => {
  await requirePermission(PERMISSIONS.PROFILE_DEACTIVATE)
  try {
    const { data: response } = await $fetch.patch<TUserResponse>(
      '/users/me/deactivate'
    )
    updateProfileTags()
    return response
  } catch (error) {
    return handleFetchError(error)
  }
}

const reactivateMyAccount = async (): Promise<
  TUserResponse | IErrorResponse
> => {
  await requirePermission(PERMISSIONS.PROFILE_DEACTIVATE)
  try {
    const { data: response } = await $fetch.patch<TUserResponse>(
      '/users/me/reactivate'
    )
    updateProfileTags()
    return response
  } catch (error) {
    return handleFetchError(error)
  }
}

const getUserById = async (id: string): Promise<TUserResponse> => {
  await requirePermission(PERMISSIONS.USERS_READ)
  const { data: response } = await $fetch.get<TUserResponse>(userEndpoint(id), {
    next: { tags: [CACHE_TAGS.USERS, CACHE_TAGS.USER(id)] },
  })
  return response
}

const updateUserById = async (
  id: string,
  data: TUpdateProfileInput
): Promise<TUserResponse | IErrorResponse> => {
  await requireCanActOnUser(id, PERMISSIONS.USERS_UPDATE)
  try {
    const { data: response } = await $fetch.patch<
      TUserResponse,
      TUpdateProfileInput
    >(userEndpoint(id), { body: data })
    updateUserTags(id)
    return response
  } catch (error) {
    return handleFetchError(error)
  }
}

const updateUserStatus = async (
  id: string,
  data: TUpdateStatusInput
): Promise<TUserResponse | IErrorResponse> => {
  await requireCanActOnUser(id, PERMISSIONS.USERS_UPDATE_STATUS)
  try {
    const { data: response } = await $fetch.patch<
      TUserResponse,
      TUpdateStatusInput
    >(userEndpoint(id, '/status'), { body: data })
    updateUserTags(id)
    return response
  } catch (error) {
    return handleFetchError(error)
  }
}

const updateUserRole = async (
  id: string,
  data: TUpdateRoleInput
): Promise<TUserResponse | IErrorResponse> => {
  const { actor } = await requireCanActOnUser(id, PERMISSIONS.USERS_UPDATE_ROLE)
  requireAssignableRole(
    actor,
    readUserRole(data.role),
    PERMISSIONS.USERS_UPDATE_ROLE
  )
  try {
    const { data: response } = await $fetch.patch<
      TUserResponse,
      TUpdateRoleInput
    >(userEndpoint(id, '/role'), { body: data })
    updateUserTags(id)
    return response
  } catch (error) {
    return handleFetchError(error)
  }
}

const deleteUserSoft = async (
  id: string
): Promise<TUserResponse | IErrorResponse> => {
  await requireCanActOnUser(id, PERMISSIONS.USERS_DELETE)
  try {
    const { data: response } = await $fetch.delete<TUserResponse>(
      userEndpoint(id)
    )
    updateUserTags(id)
    return response
  } catch (error) {
    return handleFetchError(error)
  }
}

const deleteUserHard = async (
  id: string
): Promise<TUserDeleteResponse | IErrorResponse> => {
  await requireCanActOnUser(id, PERMISSIONS.USERS_DELETE_HARD)
  try {
    const { data: response } = await $fetch.delete<TUserDeleteResponse>(
      userEndpoint(id, '/hard')
    )
    updateUserTags(id)
    return response
  } catch (error) {
    return handleFetchError(error)
  }
}

/**
 * Expires the users tag, then lets the caller `router.refresh()`.
 *
 * Calling any Server Action that updates a tag also tells the client router
 * to drop its cached RSC payload for the current route, so the refresh
 * re-renders the list with fresh data. No backend endpoint is involved.
 */
const revalidateUsers = async (): Promise<void> => {
  await requirePermission(PERMISSIONS.USERS_READ)
  updateTag(CACHE_TAGS.USERS)
}

export {
  changeMyPassword,
  createUserManually,
  deactivateMyAccount,
  deleteMyAvatar,
  deleteUserHard,
  deleteUserSoft,
  getAllUsers,
  getUserById,
  me,
  reactivateMyAccount,
  revalidateUsers,
  updateMyAvatarOnly,
  updateMyProfile,
  updateMyProfileWihAvatar,
  updateUserById,
  updateUserRole,
  updateUserStatus,
}
