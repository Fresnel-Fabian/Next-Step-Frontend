export enum UserRole {
    ADMIN = 'admin',
    STAFF = 'staff',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  avatar?: string;
}