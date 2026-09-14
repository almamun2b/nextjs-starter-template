'use server'

import { PERMISSIONS } from '@/constant/permissions'
import { CACHE_TAGS } from '@/constant/tags'
import { $fetch } from '@/lib/$fetch'
import {
  fetchProfile,
  requireAssignableRole,
  requireCanActOnUser,
  requirePermission,
} from '@/lib/auth/dal'
import { handleFetchError } from '@/lib/error'
import { readUserRole } from '@/lib/user-format'
import { IErrorResponse, IResponse } from '@/types/response.types'
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
import { revalidateTag } from 'next/cache'

const getAllUsers = async (
  params: TUserQueryOptions
): Promise<TUsersResponse> => {
  await requirePermission(PERMISSIONS.USERS_READ)
  try {
    const { data: response } = await $fetch.get<
      TUsersResponse,
      TUserQueryOptions
    >('/users', {
      params,
      next: { tags: [CACHE_TAGS.USERS] },
    })
    return response
  } catch (error) {
    throw error
  }
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
    revalidateTag(CACHE_TAGS.USERS, 'max')
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
const me = async (): Promise<TUserResponse> => {
  try {
    return await fetchProfile()
  } catch (error) {
    throw error
  }
}

const updateMyProfile = async (
  data: TUpdateProfileInput
): Promise<TUserResponse | IErrorResponse> => {
  await requirePermission(PERMISSIONS.PROFILE_UPDATE)
  try {
    const { data: response } = await $fetch.patch<
      TUserResponse,
      TUpdateProfileInput
    >('/users/me', { body: data })
    revalidateTag(CACHE_TAGS.PROFILE, 'max')
    revalidateTag(CACHE_TAGS.USERS, 'max')
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
    revalidateTag(CACHE_TAGS.PROFILE, 'max')
    revalidateTag(CACHE_TAGS.USERS, 'max')
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
    revalidateTag(CACHE_TAGS.PROFILE, 'max')
    revalidateTag(CACHE_TAGS.USERS, 'max')
    return response
  } catch (error) {
    return handleFetchError(error)
  }
}

const deleteMyAvatar = async (): Promise<TUserResponse> => {
  await requirePermission(PERMISSIONS.PROFILE_UPDATE)
  try {
    const { data: response } =
      await $fetch.delete<TUserResponse>('/users/me/avatar')
    revalidateTag(CACHE_TAGS.PROFILE, 'max')
    revalidateTag(CACHE_TAGS.USERS, 'max')
    return response
  } catch (error) {
    throw error
  }
}

const changeMyPassword = async (
  data: TChangePasswordInput
): Promise<IResponse | IErrorResponse> => {
  await requirePermission(PERMISSIONS.PROFILE_PASSWORD)
  try {
    const { data: response } = await $fetch.patch<IResponse>(
      '/users/me/change-password',
      { body: data }
    )
    return response
  } catch (error) {
    return handleFetchError(error)
  }
}

const deactivateMyAccount = async (): Promise<TUserResponse> => {
  await requirePermission(PERMISSIONS.PROFILE_DEACTIVATE)
  try {
    const { data: response } = await $fetch.patch<
      TUserResponse,
      TUpdateStatusInput
    >('/users/me/deactivate')
    revalidateTag(CACHE_TAGS.PROFILE, 'max')
    revalidateTag(CACHE_TAGS.USERS, 'max')
    return response
  } catch (error) {
    throw error
  }
}

const reactivateMyAccount = async (): Promise<TUserResponse> => {
  await requirePermission(PERMISSIONS.PROFILE_DEACTIVATE)
  try {
    const { data: response } = await $fetch.patch<
      TUserResponse,
      TUpdateStatusInput
    >('/users/me/reactivate')
    revalidateTag(CACHE_TAGS.PROFILE, 'max')
    revalidateTag(CACHE_TAGS.USERS, 'max')
    return response
  } catch (error) {
    throw error
  }
}

const getUserById = async (id: string): Promise<TUserResponse> => {
  await requirePermission(PERMISSIONS.USERS_READ)
  try {
    const { data: response } = await $fetch.get<TUserResponse>(`/users/${id}`, {
      next: { tags: [CACHE_TAGS.USERS, CACHE_TAGS.USER(id)] },
    })
    return response
  } catch (error) {
    throw error
  }
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
    >(`/users/${id}`, { body: data })
    revalidateTag(CACHE_TAGS.USERS, 'max')
    revalidateTag(CACHE_TAGS.USER(id), 'max')
    return response
  } catch (error) {
    return handleFetchError(error)
  }
}

const updateUserStatus = async (
  id: string,
  data: TUpdateStatusInput
): Promise<TUserResponse> => {
  await requireCanActOnUser(id, PERMISSIONS.USERS_UPDATE_STATUS)
  try {
    const { data: response } = await $fetch.patch<
      TUserResponse,
      TUpdateStatusInput
    >(`/users/${id}/status`, { body: data })
    revalidateTag(CACHE_TAGS.USERS, 'max')
    revalidateTag(CACHE_TAGS.USER(id), 'max')
    return response
  } catch (error) {
    throw error
  }
}

const updateUserRole = async (
  id: string,
  data: TUpdateRoleInput
): Promise<TUserResponse> => {
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
    >(`/users/${id}/role`, { body: data })
    revalidateTag(CACHE_TAGS.USERS, 'max')
    revalidateTag(CACHE_TAGS.USER(id), 'max')
    return response
  } catch (error) {
    throw error
  }
}

const deleteUserSoft = async (id: string): Promise<TUserResponse> => {
  await requireCanActOnUser(id, PERMISSIONS.USERS_DELETE)
  try {
    const { data: response } = await $fetch.delete<TUserResponse>(
      `/users/${id}`
    )
    revalidateTag(CACHE_TAGS.USERS, 'max')
    revalidateTag(CACHE_TAGS.USER(id), 'max')
    return response
  } catch (error) {
    throw error
  }
}

const deleteUserHard = async (id: string): Promise<TUserDeleteResponse> => {
  await requireCanActOnUser(id, PERMISSIONS.USERS_DELETE_HARD)
  try {
    const { data: response } = await $fetch.delete<TUserDeleteResponse>(
      `/users/${id}/hard`
    )
    revalidateTag(CACHE_TAGS.USERS, 'max')
    revalidateTag(CACHE_TAGS.USER(id), 'max')
    return response
  } catch (error) {
    throw error
  }
}

/**
 * Busts the users cache tag so the next Server Component render refetches.
 *
 * `router.refresh()` alone re-runs the server render but can still be served
 * the tag-cached `getAllUsers` response, which would make a manual refresh a
 * no-op. This adds no backend endpoint — it only invalidates an existing tag.
 */
const revalidateUsers = async (): Promise<void> => {
  await requirePermission(PERMISSIONS.USERS_READ)
  revalidateTag(CACHE_TAGS.USERS, 'max')
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
