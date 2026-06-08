export interface LoginRequest {
  correoElectronico: string;
  contrasena: string;
}

export interface LoginResponse {
  token: string;
  tipo: string;
  id: string;
  nombreUsuario: string;
  correoElectronico: string;
  nombres: string;
  apellidos: string;
  rol: string;
  rolId: string;
}

export interface UsuarioResponse {
  id: string;
  nombreUsuario: string;
  correoElectronico: string;
  nombres: string;
  apellidos: string;
  rolId: string;
  rolNombre: string;
  estado: string;
  ultimoAcceso: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface UsuarioRequest {
  nombreUsuario: string;
  correoElectronico: string;
  contrasena: string;
  nombres: string;
  apellidos: string;
  rolId: string;
}

export interface UsuarioUpdateRequest {
  nombres?: string;
  apellidos?: string;
  correoElectronico?: string;
  estado?: string;
}

export interface CambiarPasswordRequest {
  contrasenaActual: string;
  nuevaContrasena: string;
}

export interface ForgotPasswordRequest {
  correoElectronico: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}
