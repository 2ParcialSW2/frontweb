import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PreProducto, PreProductoDTO } from '../models/preProducto.model';
import { environment } from '../enviroment';

@Injectable({
  providedIn: 'root'
})
export class PreProductoService {
    private apiUrl = environment.apiUrl + 'api/preproductos';
  
    constructor(private http: HttpClient) {
      console.log('URL de API de PreProductos:', this.apiUrl);
    }

  // Métodos básicos de PreProducto
  obtenerTodos(): Observable<PreProducto[]> {
    return this.http.get<PreProducto[]>(this.apiUrl);
  }

  obtenerPorId(id: number): Observable<PreProducto> {
    return this.http.get<PreProducto>(`${this.apiUrl}/${id}`);
  }

  crear(preProducto: PreProductoDTO): Observable<PreProducto> {
    return this.http.post<PreProducto>(this.apiUrl, preProducto);
  }

  actualizar(id: number, preProducto: PreProductoDTO): Observable<PreProducto> {
    return this.http.put<PreProducto>(`${this.apiUrl}/${id}`, preProducto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Métodos integrados con planificaciones
  obtenerConPlanificaciones(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/con-planificaciones`);
  }

  obtenerPlanificaciones(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/planificaciones`);
  }

  calcularTiempoProduccion(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/tiempo-produccion`);
  }

  verificarPlanificacionCompleta(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/planificacion-completa`);
  }
}