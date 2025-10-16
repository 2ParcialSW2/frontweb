import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../enviroment';
import { MetodoPago, MetodoPagoDTO } from '../models/pedido.model';

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class MetodoPagoService {
  private apiUrl = environment.apiUrl + 'api/metodos-pago';

  constructor(private http: HttpClient) { }

  // Obtener todos los métodos de pago
  listarMetodosPago(): Observable<ApiResponse<MetodoPago[]>> {
    return this.http.get<ApiResponse<MetodoPago[]>>(this.apiUrl);
  }

  // Obtener método de pago por ID
  obtenerMetodoPago(id: number): Observable<ApiResponse<MetodoPago>> {
    return this.http.get<ApiResponse<MetodoPago>>(`${this.apiUrl}/${id}`);
  }

  // Crear nuevo método de pago
  crearMetodoPago(metodoPagoDTO: MetodoPagoDTO): Observable<ApiResponse<MetodoPago>> {
    return this.http.post<ApiResponse<MetodoPago>>(this.apiUrl, metodoPagoDTO);
  }

  // Actualizar método de pago
  actualizarMetodoPago(id: number, metodoPagoDTO: MetodoPagoDTO): Observable<ApiResponse<MetodoPago>> {
    return this.http.put<ApiResponse<MetodoPago>>(`${this.apiUrl}/${id}`, metodoPagoDTO);
  }

  // Eliminar método de pago
  eliminarMetodoPago(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  // Buscar método de pago por nombre
  buscarPorNombre(nombre: string): Observable<ApiResponse<MetodoPago>> {
    return this.http.get<ApiResponse<MetodoPago>>(`${this.apiUrl}/nombre/${nombre}`);
  }

  // Verificar si un método de pago existe
  verificarMetodoPago(id: number): Observable<ApiResponse<boolean>> {
    return this.http.get<ApiResponse<boolean>>(`${this.apiUrl}/verificar/${id}`);
  }
}
