'use server'

import { CACHE_TAGS } from '@/constant/tags'
import { $fetch } from '@/lib/$fetch'
import { handleFetchError } from '@/lib/error'
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

// super and admin only
const getAllUsers = async (
  params: TUserQueryOptions
): Promise<TUsersResponse> => {
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

// super and admin only
const createUserManually = async (
  data: TCreateUserInput
): Promise<TUserResponse | IErrorResponse> => {
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

// super, admin and user only
const me = async (): Promise<TUserResponse> => {
  try {
    const { data: response } = await $fetch.get<TUserResponse>('/users/me', {
      next: { tags: [CACHE_TAGS.PROFILE] },
    })
    return response
  } catch (error) {
    throw error
  }
}

// super, admin and user only
const updateMyProfile = async (
  data: TUpdateProfileInput
): Promise<TUserResponse | IErrorResponse> => {
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

// super, admin and user only
const updateMyProfileWihAvatar = async (
  data: TUpdateProfileWithAvatarInput
): Promise<TUserResponse | IErrorResponse> => {
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

// super, admin and user only
const updateMyAvatarOnly = async (
  data: UpdateAvatarInput
): Promise<TUserResponse | IErrorResponse> => {
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

// super, admin and user only
const deleteMyAvatar = async (): Promise<TUserResponse> => {
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

// super, admin and user only
const changeMyPassword = async (
  data: TChangePasswordInput
): Promise<IResponse | IErrorResponse> => {
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

// super, admin and user only
const deactivateMyAccount = async (): Promise<TUserResponse> => {
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

// super, admin and user only
const reactivateMyAccount = async (): Promise<TUserResponse> => {
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

// super and admin only
const getUserById = async (id: string): Promise<TUserResponse> => {
  try {
    const { data: response } = await $fetch.get<TUserResponse>(`/users/${id}`, {
      next: { tags: [CACHE_TAGS.USERS, CACHE_TAGS.USER(id)] },
    })
    return response
  } catch (error) {
    throw error
  }
}

// super and admin only
const updateUserById = async (
  id: string,
  data: TUpdateProfileInput
): Promise<TUserResponse | IErrorResponse> => {
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

// super and admin only
const updateUserStatus = async (
  id: string,
  data: TUpdateStatusInput
): Promise<TUserResponse> => {
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

// super only
const updateUserRole = async (
  id: string,
  data: TUpdateRoleInput
): Promise<TUserResponse> => {
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

// super and admin only
const deleteUserSoft = async (id: string): Promise<TUserResponse> => {
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

// super only
const deleteUserHard = async (id: string): Promise<TUserDeleteResponse> => {
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
