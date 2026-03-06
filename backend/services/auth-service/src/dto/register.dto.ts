export interface RegisterDto {
  email: string;
  phoneNumber: string;
  birth: string;
  lastName: string;
  firstName: string;
  patronymic?: string;
  position: string;
  password: string;
  roleName: string;
}