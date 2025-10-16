import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../enviroment';
import {
  DevolucionCreateDTO,
  DevolucionResponseDTO,
  DetalleDevolucionDTO,
  DetalleDevolucionCreateDTO
} from '../models/devoluciones.model';

@Injectable({
  providedIn: 'root'
})
export class DevolucionesService {
  private apiUrl = `${environment.apiUrl}api/devoluciones`;

  constructor(private http: HttpClient) { }

  getDevoluciones(): Observable<DevolucionResponseDTO[]> {
    return this.http.get<DevolucionResponseDTO[]>(this.apiUrl);
  }

  createDevolucion(data: DevolucionCreateDTO): Observable<DevolucionResponseDTO> {
    return this.http.post<DevolucionResponseDTO>(this.apiUrl, data);
  }

  getDevolucion(id: number): Observable<DevolucionResponseDTO> {
    return this.http.get<DevolucionResponseDTO>(`${this.apiUrl}/${id}`);
  }

  updateDevolucion(id: number, data: DevolucionCreateDTO): Observable<DevolucionResponseDTO> {
    return this.http.put<DevolucionResponseDTO>(`${this.apiUrl}/${id}`, data);
  }

  deleteDevolucion(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  devolucionesUsuario(id: number): Observable<DevolucionResponseDTO[]> {
    return this.http.get<DevolucionResponseDTO[]>(`${this.apiUrl}/usuario/${id}`);
  }

  devolucionesPedido(id: number): Observable<DevolucionResponseDTO[]> {
    return this.http.get<DevolucionResponseDTO[]>(`${this.apiUrl}/pedido/${id}`);
  }

  getDetalles(id: number): Observable<DetalleDevolucionDTO[]> {
    return this.http.get<DetalleDevolucionDTO[]>(`${this.apiUrl}/${id}/detalles`);
  }

  postDetalles(id: number, data: DetalleDevolucionCreateDTO): Observable<DetalleDevolucionDTO> {
    return this.http.post<DetalleDevolucionDTO>(`${this.apiUrl}/${id}/detalles`, data);
  }

  getDetallesDevolucion(devolucionId: number, detalleId: number): Observable<DetalleDevolucionDTO> {
    return this.http.get<DetalleDevolucionDTO>(`${this.apiUrl}/${devolucionId}/detalles/${detalleId}`);
  }

  deleteDetallesDevolucion(devolucionId: number, detalleId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${devolucionId}/detalles/${detalleId}`);
  }
}