import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ConfiguracionService extends ApiService {
  constructor(private http: HttpClient) {
    super();
  }

  getAll(): Observable<Record<string, string>> {
    return this.http.get<Record<string, string>>(`${this.baseUrl}/configuracion`);
  }

  getInt(clave: string): Observable<number> {
    return this.http.get(`${this.baseUrl}/configuracion/${clave}`, { responseType: 'text' })
      .pipe(map(v => parseInt(v, 10)));
  }
}
