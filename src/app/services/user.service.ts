import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { Usuario, UsuarioDTO } from '../models/usuario.model';
import { environment } from '../enviroment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = environment.apiUrl + 'user';

  constructor(private http: HttpClient, private authService: AuthService) {}

  listarUsuarios(): Observable<Usuario[]> {
    const token = this.authService.obtenerToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get<Usuario[]>(`${this.apiUrl}`, { headers });
  }
  buscarUsuarios(search: string): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}?search=${search}`);
  }

  obtenerUsuario(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`);
  }

  registrarUsuario(usuario: UsuarioDTO): Observable<Usuario> {
    const token = this.authService.obtenerToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.post<Usuario>(`${this.apiUrl}`, usuario, { headers });
  }

  actualizarUsuario(id: number, usuario: UsuarioDTO): Observable<Usuario> {
    console.log(usuario);
    return this.http.patch<Usuario>(`${this.apiUrl}/${id}`, usuario);
  }

  desactivarUsuario(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/desactivar`, {});
  }

  activarUsuario(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/activar`, {});
  }
  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
