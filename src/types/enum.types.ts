enum UserRole {
  SUPER_ADMIN,
  ADMIN,
  USER,
}

enum UserStatus {
  PENDING,
  ACTIVE,
  INACTIVE,
  SUSPENDED,
  BANNED,
  DELETED,
}

enum Gender {
  MALE,
  FEMALE,
  OTHER,
  PREFER_NOT_TO_SAY,
}

export { Gender, UserRole, UserStatus }
