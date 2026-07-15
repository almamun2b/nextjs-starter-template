'use server'

import { $fetch } from '@/lib/$fetch'
import { IResponse } from '@/types/response.types'
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

const getAllUsers = async (params: TUserQueryOptions) => {
  try {
    const { data: response } = await $fetch.get<
      TUsersResponse,
      TUserQueryOptions
    >('/users', {
      params,
    })
    return response
  } catch (error) {
    throw error
  }
}

const createUserManually = async (data: TCreateUserInput) => {
  try {
    const { data: response } = await $fetch.post<
      TUserResponse,
      TCreateUserInput
    >('/users', { body: data })
    return response
  } catch (error) {
    throw error
  }
}

const getMyProfile = async () => {
  try {
    const { data: response } = await $fetch.get<TUserResponse>('/users/me')
    return response
  } catch (error) {
    throw error
  }
}

const updateMyProfile = async (data: TUpdateProfileInput) => {
  try {
    const { data: response } = await $fetch.patch<
      TUserResponse,
      TUpdateProfileInput
    >('/users/me', { body: data })
    return response
  } catch (error) {
    throw error
  }
}

const updateMyProfileWihAvatar = async (
  data: TUpdateProfileWithAvatarInput
) => {
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
    throw error
  }
}

const updateMyAvatarOnly = async (data: UpdateAvatarInput) => {
  const formData = new FormData()
  formData.append('avatar', data.avatar)
  try {
    const { data: response } = await $fetch.patch<TUserResponse, FormData>(
      '/users/me/avatar',
      { body: formData }
    )
    return response
  } catch (error) {
    throw error
  }
}

const deleteMyAvatar = async () => {
  try {
    const { data: response } =
      await $fetch.delete<TUserResponse>('/users/me/avatar')
    return response
  } catch (error) {
    throw error
  }
}

const changeMyPassword = async (data: TChangePasswordInput) => {
  try {
    const { data: response } = await $fetch.patch<IResponse>(
      '/users/me/change-password',
      { body: data }
    )
    return response
  } catch (error) {
    throw error
  }
}

const deactivateMyAccount = async () => {
  try {
    const { data: response } = await $fetch.patch<
      TUserResponse,
      TUpdateStatusInput
    >('/users/me/deactivate')
    return response
  } catch (error) {
    throw error
  }
}

const reactivateMyAccount = async () => {
  try {
    const { data: response } = await $fetch.patch<
      TUserResponse,
      TUpdateStatusInput
    >('/users/me/reactivate')
    return response
  } catch (error) {
    throw error
  }
}

const getUserById = async (id: string) => {
  try {
    const { data: response } = await $fetch.get<TUserResponse>(`/users/${id}`)
    return response
  } catch (error) {
    throw error
  }
}

const updateUserStatus = async (id: string, data: TUpdateStatusInput) => {
  try {
    const { data: response } = await $fetch.patch<
      TUserResponse,
      TUpdateStatusInput
    >(`/users/${id}/status`, { body: data })
    return response
  } catch (error) {
    throw error
  }
}

const updateUserRole = async (id: string, data: TUpdateRoleInput) => {
  try {
    const { data: response } = await $fetch.patch<
      TUserResponse,
      TUpdateRoleInput
    >(`/users/${id}/role`, { body: data })
    return response
  } catch (error) {
    throw error
  }
}

const deleteUserSoft = async (id: string) => {
  try {
    const { data: response } = await $fetch.delete<TUserResponse>(
      `/users/${id}`
    )
    return response
  } catch (error) {
    throw error
  }
}

const deleteUserHard = async (id: string) => {
  try {
    const { data: response } = await $fetch.delete<TUserDeleteResponse>(
      `/users/${id}/hard`
    )
    return response
  } catch (error) {
    throw error
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
  getMyProfile,
  getUserById,
  reactivateMyAccount,
  updateMyAvatarOnly,
  updateMyProfile,
  updateMyProfileWihAvatar,
  updateUserRole,
  updateUserStatus,
}
