import 'jsonwebtoken'
import { UserRole } from './enum.types'

declare module 'jsonwebtoken' {
  export interface JwtPayload {
    userId: string
    email: string
    role: UserRole
  }
}

export {}
