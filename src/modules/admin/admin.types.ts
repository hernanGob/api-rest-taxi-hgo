export interface User {
  id: string;
  name: string;
  paternalSurname: string;
  maternalSurname: string;
  phone: string;
  email: string;
  passwordHash: string | null;
  createdAt: string;
  updatedAt: string;
  userRoleId: string;
  userRole: string | null;

  twoFactorSecret: string | null;
  twoFactorEnabled: boolean;
  twoFactorEnabledAt: string | null;
}

export interface UserLoginDto {
  email: string;
  password: string;
}

export type LoginMetadata = {
  ip?: string | undefined;
  userAgent?: string | undefined;
};

export type VerifiedAdminSession = {
  userId: string;
  sessionId: string;
  role: string;
};

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;

  saveTwoFactorSecret(
    id: string,
    secret: string,
  ): Promise<boolean>;

  enableTwoFactor(
    id: string,
  ): Promise<boolean>;

  clearTwoFactorConfiguration(
    id: string,
  ): Promise<boolean>;
}