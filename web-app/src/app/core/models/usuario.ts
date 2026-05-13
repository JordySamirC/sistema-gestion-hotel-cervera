export interface LoginRequest {
  email: string;
  contrasena: string;
}

export interface LoginResponse {
  token: string;
  tipo: string;
  id: string;
  nombreUsuario: string;
  email: string;
  nombres: string;
  apellidos: string;
  rol: string;
}

export interface UsuarioResponse {
  id: string;
  nombreUsuario: string;
  email: string;
  nombres: string;
  apellidos: string;
  rolId: string;
  rolNombre: string;
  estado: string;
  ultimoAcceso: string;
  createdAt: string;
  updatedAt: string;
}

export interface UsuarioRequest {
  nombreUsuario: string;
  email: string;
  contrasena: string;
  nombres: string;
  apellidos: string;
  rolId: string;
}

export interface UsuarioUpdateRequest {
  nombres?: string;
  apellidos?: string;
  email?: string;
  estado?: string;
}

export interface CambiarPasswordRequest {
  contrasenaActual: string;
  nuevaContrasena: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}
