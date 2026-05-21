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
  userRoleId: string | null;
  userRole: string | null;
}

export interface UserLoginDto {
  email: string;
  password: string;
}

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
}