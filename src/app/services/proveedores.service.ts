import { Injectable } from '@angular/core';
import { environment } from '../enviroment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProveedoresService {

  private apiUrl = environment.apiUrl + 'api/proveedores';

  constructor(private http: HttpClient) {
    console.log('URL de API de proveedores:', this.apiUrl);
  }

  getProveedores(): Observable<any[]> {
    console.log('Llamando a getProveedores:', this.apiUrl);
    return this.http.get<any>(`${this.apiUrl}`).pipe(
      tap(response => console.log('Respuesta completa de proveedores:', response)),
      map(response => response.data || [])
    );
  }

  getProveedor(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  createProveedor(proveedor: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}`, proveedor);
  }

  updateProveedor(id: number, proveedor: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, proveedor);
  }

  deleteProveedor(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  cambiarEstadoProveedor(id: number, activo: boolean): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/estado?activo=${activo}`, {}).pipe(
      map(response => response.data)
    );
  }

  getProveedorConMateriales(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/con-materiales`).pipe(
      map(response => response.data)
    );
  }

  getProveedorPorNombre(nombre: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/nombre/${nombre}`).pipe(
      map(response => response.data)
    );
  }

  getProveedoresPorEstado(activo: boolean): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/estado?activo=${activo}`).pipe(
      map(response => response.data || [])
    );
  }

  buscarProveedores(termino: string): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/buscar?termino=${termino}`).pipe(
      map(response => response.data || [])
    );
  }
}
