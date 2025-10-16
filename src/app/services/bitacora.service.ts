import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Bitacora } from '../models/bitacora.model';
import { environment } from '../enviroment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class BitacoraService {
  private apiUrl = environment.apiUrl + 'bitacora';

  constructor(private http: HttpClient, private authService: AuthService) {}

  // Obtener todos los eventos de la bitácora
  getBitacoras(): Observable<Bitacora[]> {
    const token = this.authService.obtenerToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<any>(`${this.apiUrl}`, { headers }).pipe(
      map(resp => {
        if (resp && resp.data && Array.isArray(resp.data)) {
          return resp.data;
        } else if (Array.isArray(resp)) {
          return resp;
        } else {
          console.error('Formato de respuesta inesperado en getBitacoras:', resp);
          return [];
        }
      })
    );
  }

  // Obtener un evento de la bitácora por su ID
  getBitacoraById(id: number): Observable<Bitacora> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.authService.obtenerToken()}`
    });

    return this.http.get<Bitacora>(`${this.apiUrl}/${id}`, { headers });
  }
}
