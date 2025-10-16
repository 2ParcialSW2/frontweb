import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../enviroment';
import { map } from 'rxjs/operators';
import { OrdenProducto, OrdenProductoDTO, ApiResponse } from '../models/orden-producto.model';

@Injectable({
  providedIn: 'root'
})
export class OrdenProductoService {
  private apiUrl = `${environment.apiUrl}api/orden-producto`;

  constructor(private http: HttpClient) { }

  getOrdenesProductos(): Observable<OrdenProducto[]> {
    return this.http.get<ApiResponse<OrdenProducto[]>>(this.apiUrl)
      .pipe(
        map(response => response.data)
      );
  }

  createOrdenProducto(ordenProducto: OrdenProductoDTO): Observable<OrdenProducto> {
    return this.http.post<ApiResponse<OrdenProducto>>(this.apiUrl, ordenProducto)
      .pipe(
        map(response => response.data)
      );
  }

  updateOrdenProducto(id: number, ordenProducto: OrdenProducto): Observable<OrdenProducto> {
    const url = `${this.apiUrl}/${id}`;

    // Formateamos los datos según el ejemplo de Swagger
    const ordenToUpdate = {
      cantidad: ordenProducto.cantidad,
      descripcion: ordenProducto.descripcion,
      estado: ordenProducto.estado,
      fecha: ordenProducto.fecha,
      usuarioId: ordenProducto.usuarioId,
      productoId: ordenProducto.productoId
    };

    console.log('URL de actualización:', url);
    console.log('Datos a enviar:', ordenToUpdate);

    return this.http.put<ApiResponse<OrdenProducto>>(url, ordenToUpdate)
      .pipe(
        map(response => response.data)
      );
  }

  getOrdenProducto(id: number): Observable<OrdenProducto> {
    return this.http.get<ApiResponse<OrdenProducto>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => response.data)
      );
  }

  deleteOrdenProducto(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => response.data)
      );
  }
}
