import 'jsonwebtoken'
import { UserRole } from './user.types'

declare module 'jsonwebtoken' {
  export interface JwtPayload {
    userId: string
    email: string
    role: UserRole
  }
}

export {}
