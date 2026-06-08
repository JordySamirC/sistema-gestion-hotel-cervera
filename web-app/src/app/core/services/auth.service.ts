import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ForgotPasswordRequest, LoginRequest, LoginResponse, ResetPasswordRequest } from '../models/usuario';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private tokenKey = 'auth_token';
  private userKey = 'auth_user';

  constructor(private http: HttpClient) {}

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, request).pipe(
      tap((res) => {
        localStorage.setItem(this.userKey, JSON.stringify(res));
      })
    );
  }

  logout(): void {
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
      next: () => {
        localStorage.removeItem(this.userKey);
      },
      error: () => {
        localStorage.removeItem(this.userKey);
      }
    });
  }

  getUsuario(): LoginResponse | null {
    const data = localStorage.getItem(this.userKey);
    return data ? JSON.parse(data) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getUsuario();
  }

  getRol(): string | null {
    return this.getUsuario()?.rol ?? null;
  }

  getRolId(): string | null {
    return this.getUsuario()?.rolId ?? null;
  }

  esGerente(): boolean {
    const rol = this.getRol()?.toLowerCase();
    return rol === 'gerente' || rol === 'admin';
  }

  esLimpieza(): boolean {
    const rol = this.getRol()?.toLowerCase();
    return rol === 'asistente de habitaciones' || rol === 'limpieza';
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/forgot-password`, request);
  }

  resetPassword(request: ResetPasswordRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/reset-password`, request);
  }
}
