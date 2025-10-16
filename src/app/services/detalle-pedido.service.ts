import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../enviroment';
import { DetallePedido, DetallePedidoDTO } from '../models/pedido.model';

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class DetallePedidoService {
  private apiUrl = environment.apiUrl + 'api/detalle_pedido';

  constructor(private http: HttpClient) { }

  // Obtener todos los detalles
  listarDetalles(): Observable<ApiResponse<DetallePedido[]>> {
    return this.http.get<ApiResponse<DetallePedido[]>>(this.apiUrl);
  }

  // Obtener detalle por ID
  obtenerDetalle(id: number): Observable<ApiResponse<DetallePedido>> {
    return this.http.get<ApiResponse<DetallePedido>>(`${this.apiUrl}/${id}`);
  }  // Crear nuevo detalle
  crearDetalle(detalleDTO: DetallePedidoDTO): Observable<ApiResponse<DetallePedido>> {
    console.log('📤 Creando detalle de pedido:', detalleDTO);
    console.log('📍 URL de la API:', this.apiUrl);

    // Usar directamente la estructura que espera la API según la documentación
    return this.http.post<ApiResponse<DetallePedido>>(this.apiUrl, detalleDTO).pipe(
      tap((response: ApiResponse<DetallePedido>) => console.log('✅ Respuesta del servidor:', response))
    );
  }  // Actualizar detalle
  actualizarDetalle(id: number, detalleDTO: DetallePedidoDTO): Observable<ApiResponse<DetallePedido>> {
    console.log('📤 Actualizando detalle de pedido:', detalleDTO);

    // Usar directamente la estructura que espera la API
    return this.http.put<ApiResponse<DetallePedido>>(`${this.apiUrl}/${id}`, detalleDTO).pipe(
      tap((response: ApiResponse<DetallePedido>) => console.log('✅ Respuesta del servidor:', response))
    );
  }

  // Actualizar estado del detalle
  actualizarDetalleEstado(id: number, estado: boolean): Observable<ApiResponse<DetallePedido>> {
    return this.http.put<ApiResponse<DetallePedido>>(`${this.apiUrl}/Estado/${id}/${estado}`, {});
  }

  // Eliminar detalle
  eliminarDetalle(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  // Obtener detalles por pedido
  obtenerPorPedido(pedidoId: number): Observable<ApiResponse<DetallePedido[]>> {
    console.log(`Solicitando detalles para el pedido ID ${pedidoId}`);
    console.log(`URL de consulta: ${this.apiUrl}/pedido/${pedidoId}`);
    return this.http.get<ApiResponse<DetallePedido[]>>(`${this.apiUrl}/pedido/${pedidoId}`);
  }

  // Obtener detalles por producto
  obtenerPorProducto(productoId: number): Observable<ApiResponse<DetallePedido[]>> {
    return this.http.get<ApiResponse<DetallePedido[]>>(`${this.apiUrl}/producto/${productoId}`);
  }

  // Crear múltiples detalles de pedido en una sola operación (batch)
  crearDetallesBatch(detallesDTO: DetallePedidoDTO[]): Observable<ApiResponse<DetallePedido[]>> {
    console.log('📤 Creando detalles de pedido en batch:', detallesDTO);
    console.log('📍 URL de la API batch:', `${this.apiUrl}/batch`);

    return this.http.post<ApiResponse<DetallePedido[]>>(`${this.apiUrl}/batch`, detallesDTO).pipe(
      tap((response: ApiResponse<DetallePedido[]>) => console.log('✅ Respuesta del servidor (batch):', response))
    );
  }
}
