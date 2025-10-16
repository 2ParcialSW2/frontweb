import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Rol } from '../models/rol.model';
import { environment } from '../enviroment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private apiUrl = environment.apiUrl + 'roles';  // URL base del backend + endpoint de roles

  constructor(private http: HttpClient, private authService: AuthService) {}

  // ✅ Obtener todos los roles con token JWT
  getRoles(): Observable<Rol[]> {
    const token = this.authService.obtenerToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    console.log('Token usado para getRoles:', token);
    
    return this.http.get<any>(`${this.apiUrl}`, { headers }).pipe(
      map(resp => {
        console.log('Respuesta original de roles:', resp);
        // Verificar si la respuesta tiene el formato esperado (con propiedad data)
        if (resp && resp.data && Array.isArray(resp.data)) {
          return resp.data;
        } else if (Array.isArray(resp)) {
          return resp;
        } else {
          console.error('Formato de respuesta inesperado en getRoles:', resp);
          return [];
        }
      })
    );
  }
  
  

  // ✅ Obtener un rol por su ID
  getRoleById(id: number): Observable<Rol> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.authService.obtenerToken()}`
    });

    return this.http.get<Rol>(`${this.apiUrl}/${id}`, { headers });
  }

  // ✅ Crear un nuevo rol
  createRole(nombreRol: string): Observable<Rol> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.authService.obtenerToken()}`
    });

    // Usar el parámetro nombre en la URL y enviar un array en el body como en el curl
    return this.http.post<Rol>(`${this.apiUrl}?nombre=${nombreRol}`, ["string"], { headers });
  }

  // ✅ Actualizar un rol existente
  updateRole(id: number, nombreRol: string): Observable<Rol> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.authService.obtenerToken()}`
    });

    // Usar el parámetro nombre en la URL y enviar un array en el body como en el curl
    return this.http.put<Rol>(`${this.apiUrl}/${id}?nombre=${nombreRol}`, ["string"], { headers });
  }

  // ✅ Eliminar un rol
  deleteRole(id: number): Observable<void> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.authService.obtenerToken()}`
    });

    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers });
  }
}
