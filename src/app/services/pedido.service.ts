import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../enviroment';
import { Pedido, PedidoDTO, MetodoPago } from '../models/pedido.model';

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  private apiUrl = environment.apiUrl + 'api/pedidos';

  constructor(private http: HttpClient) { }

  // Obtener todos los pedidos
  listarPedidos(): Observable<ApiResponse<Pedido[]>> {
    return this.http.get<ApiResponse<Pedido[]>>(this.apiUrl);
  }

  // Obtener pedido por ID
  obtenerPedido(id: number): Observable<ApiResponse<Pedido>> {
    return this.http.get<ApiResponse<Pedido>>(`${this.apiUrl}/${id}`);
  }

  // Crear nuevo pedido
  crearPedido(pedidoDTO: PedidoDTO): Observable<ApiResponse<Pedido>> {
    return this.http.post<ApiResponse<Pedido>>(this.apiUrl, pedidoDTO);
  }

  // Actualizar pedido
  actualizarPedido(id: number, pedidoDTO: PedidoDTO): Observable<ApiResponse<Pedido>> {
    return this.http.put<ApiResponse<Pedido>>(`${this.apiUrl}/${id}`, pedidoDTO);
  }

  // Eliminar pedido
  eliminarPedido(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
  // Obtener pedidos por estado
  obtenerPedidosPorEstado(estado: boolean): Observable<ApiResponse<Pedido[]>> {
    return this.http.get<ApiResponse<Pedido[]>>(`${this.apiUrl}/estado/${estado}`);
  }
  // Obtener productos de un pedido con información completa
  obtenerProductosPedido(id: number): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/${id}/productos`);
  }  // Nuevo método para cambiar solo el estado del pedido usando el endpoint del backend
  cambiarEstadoPedido(id: number, estado: boolean): Observable<ApiResponse<Pedido>> {
    const url = `${this.apiUrl}/${id}/validar`;
    const body = { estado: estado };

    console.log('🔄 [PedidoService] Cambiando estado del pedido:');
    console.log('   URL:', url);
    console.log('   Body:', body);
    console.log('   ID:', id);
    console.log('   Estado:', estado);

    return this.http.put<ApiResponse<Pedido>>(url, body);
  }

  // Método alternativo usando query parameter (si prefieres esta opción)
  cambiarEstadoPedidoConQuery(id: number, estado: boolean): Observable<ApiResponse<Pedido>> {
    const url = `${this.apiUrl}/${id}/actualizar-estado`;
    const params = { estado: estado.toString() };

    console.log('🔄 [PedidoService] Cambiando estado con query:');
    console.log('   URL:', url);
    console.log('   Params:', params);
    console.log('   ID:', id);
    console.log('   Estado:', estado);

    return this.http.post<ApiResponse<Pedido>>(url, null, {
      params: params
    });
  }

  // Actualizar totales del pedido
  actualizarTotales(id: number): Observable<ApiResponse<Pedido>> {
    return this.http.put<ApiResponse<Pedido>>(`${this.apiUrl}/${id}/actualizar-totales`, {});
  }

  // Finalizar pedido (opcional)
  finalizarPedido(id: number): Observable<ApiResponse<Pedido>> {
    return this.http.put<ApiResponse<Pedido>>(`${this.apiUrl}/${id}/finalizar`, {});
  }

  // Método de debugging para verificar la disponibilidad de la API
  verificarAPI(): Observable<any> {
    console.log('🔍 [PedidoService] Verificando API...');
    console.log('   Base URL:', this.apiUrl);
    console.log('   Environment URL:', environment.apiUrl);

    return this.http.get<any>(this.apiUrl);
  }

  // Método de debugging para verificar un pedido específico
  verificarPedido(id: number): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    console.log('🔍 [PedidoService] Verificando pedido:', id);
    console.log('   URL:', url);

    return this.http.get<any>(url);
  }
}
