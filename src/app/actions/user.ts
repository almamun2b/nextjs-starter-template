'use server'

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

const getAllUsers = async (
  params: TUserQueryOptions
): Promise<TUsersResponse | IErrorResponse> => {
  try {
    const { data: response } = await $fetch.get<
      TUsersResponse,
      TUserQueryOptions
    >('/users', {
      params,
    })
    return response
  } catch (error) {
    return handleFetchError(error)
  }
}

const createUserManually = async (
  data: TCreateUserInput
): Promise<TUserResponse | IErrorResponse> => {
  try {
    const { data: response } = await $fetch.post<
      TUserResponse,
      TCreateUserInput
    >('/users', { body: data })
    return response
  } catch (error) {
    return handleFetchError(error)
  }
}

const me = async (): Promise<TUserResponse | IErrorResponse> => {
  try {
    const { data: response } = await $fetch.get<TUserResponse>('/users/me')
    return response
  } catch (error) {
    return handleFetchError(error)
  }
}

const updateMyProfile = async (
  data: TUpdateProfileInput
): Promise<TUserResponse | IErrorResponse> => {
  try {
    const { data: response } = await $fetch.patch<
      TUserResponse,
      TUpdateProfileInput
    >('/users/me', { body: data })
    return response
  } catch (error) {
    return handleFetchError(error)
  }
}

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
    return response
  } catch (error) {
    return handleFetchError(error)
  }
}

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
    return response
  } catch (error) {
    return handleFetchError(error)
  }
}

const deleteMyAvatar = async (): Promise<TUserResponse | IErrorResponse> => {
  try {
    const { data: response } =
      await $fetch.delete<TUserResponse>('/users/me/avatar')
    return response
  } catch (error) {
    return handleFetchError(error)
  }
}

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

const deactivateMyAccount = async (): Promise<
  TUserResponse | IErrorResponse
> => {
  try {
    const { data: response } = await $fetch.patch<
      TUserResponse,
      TUpdateStatusInput
    >('/users/me/deactivate')
    return response
  } catch (error) {
    return handleFetchError(error)
  }
}

const reactivateMyAccount = async (): Promise<
  TUserResponse | IErrorResponse
> => {
  try {
    const { data: response } = await $fetch.patch<
      TUserResponse,
      TUpdateStatusInput
    >('/users/me/reactivate')
    return response
  } catch (error) {
    return handleFetchError(error)
  }
}

const getUserById = async (
  id: string
): Promise<TUserResponse | IErrorResponse> => {
  try {
    const { data: response } = await $fetch.get<TUserResponse>(`/users/${id}`)
    return response
  } catch (error) {
    return handleFetchError(error)
  }
}

const updateUserStatus = async (
  id: string,
  data: TUpdateStatusInput
): Promise<TUserResponse | IErrorResponse> => {
  try {
    const { data: response } = await $fetch.patch<
      TUserResponse,
      TUpdateStatusInput
    >(`/users/${id}/status`, { body: data })
    return response
  } catch (error) {
    return handleFetchError(error)
  }
}

const updateUserRole = async (
  id: string,
  data: TUpdateRoleInput
): Promise<TUserResponse | IErrorResponse> => {
  try {
    const { data: response } = await $fetch.patch<
      TUserResponse,
      TUpdateRoleInput
    >(`/users/${id}/role`, { body: data })
    return response
  } catch (error) {
    return handleFetchError(error)
  }
}

const deleteUserSoft = async (
  id: string
): Promise<TUserResponse | IErrorResponse> => {
  try {
    const { data: response } = await $fetch.delete<TUserResponse>(
      `/users/${id}`
    )
    return response
  } catch (error) {
    return handleFetchError(error)
  }
}

const deleteUserHard = async (
  id: string
): Promise<TUserDeleteResponse | IErrorResponse> => {
  try {
    const { data: response } = await $fetch.delete<TUserDeleteResponse>(
      `/users/${id}/hard`
    )
    return response
  } catch (error) {
    return handleFetchError(error)
  }
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
  updateMyAvatarOnly,
  updateMyProfile,
  updateMyProfileWihAvatar,
  updateUserRole,
  updateUserStatus,
}
