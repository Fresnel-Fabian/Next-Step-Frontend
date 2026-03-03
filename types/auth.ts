export enum UserRole {
  ADMIN = "ADMIN",
  TEACHER = "TEACHER",
  STAFF = "STAFF",
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  avatar?: string;
}
