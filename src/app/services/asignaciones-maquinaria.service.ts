import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../enviroment';
import { 
  MaquinariaCarpintero, 
  MaquinariaCarpinteroDTO,
  ResumenCarpintero
} from '../models/maquinaria.model';

@Injectable({
  providedIn: 'root'
})
export class AsignacionesMaquinariaService {
  private apiUrl = environment.apiUrl+ 'api/asignaciones-maquinaria';

  constructor(private http: HttpClient) {}

  // Obtener todas las asignaciones
  getAllAsignaciones(): Observable<MaquinariaCarpintero[]> {
    return this.http.get<MaquinariaCarpintero[]>(this.apiUrl);
  }

  // Asignar carpintero a maquinaria
  asignarCarpinteroAMaquinaria(
    maquinariaId: number, 
    carpinteroId: number, 
    estado: string = 'en_uso'
  ): Observable<MaquinariaCarpintero> {
    const params = new HttpParams()
      .set('maquinariaId', maquinariaId.toString())
      .set('carpinteroId', carpinteroId.toString())
      .set('estado', estado);
    
    return this.http.post<MaquinariaCarpintero>(`${this.apiUrl}/asignar`, {}, { params });
  }

  // Liberar maquinaria
  liberarMaquinaria(maquinariaId: number): Observable<MaquinariaCarpintero> {
    return this.http.put<MaquinariaCarpintero>(`${this.apiUrl}/liberar/${maquinariaId}`, {});
  }

  // Cambiar estado de asignación
  cambiarEstadoAsignacion(asignacionId: number, nuevoEstado: string): Observable<MaquinariaCarpintero> {
    const params = new HttpParams().set('nuevoEstado', nuevoEstado);
    return this.http.put<MaquinariaCarpintero>(`${this.apiUrl}/${asignacionId}/estado`, {}, { params });
  }

  // Obtener asignaciones por maquinaria
  getAsignacionesPorMaquinaria(maquinariaId: number): Observable<MaquinariaCarpintero[]> {
    return this.http.get<MaquinariaCarpintero[]>(`${this.apiUrl}/maquinaria/${maquinariaId}`);
  }

  // Obtener asignaciones por carpintero
  getAsignacionesPorCarpintero(carpinteroId: number): Observable<MaquinariaCarpintero[]> {
    return this.http.get<MaquinariaCarpintero[]>(`${this.apiUrl}/carpintero/${carpinteroId}`);
  }

  // Obtener maquinarias en uso por carpintero
  getMaquinariasEnUsoPorCarpintero(carpinteroId: number): Observable<MaquinariaCarpintero[]> {
    return this.http.get<MaquinariaCarpintero[]>(`${this.apiUrl}/carpintero/${carpinteroId}/en-uso`);
  }

  // Obtener asignaciones por estado
  getAsignacionesPorEstado(estado: string): Observable<MaquinariaCarpintero[]> {
    return this.http.get<MaquinariaCarpintero[]>(`${this.apiUrl}/estado/${estado}`);
  }

  // Verificar disponibilidad de maquinaria
  verificarDisponibilidad(maquinariaId: number): Observable<{ disponible: boolean }> {
    return this.http.get<{ disponible: boolean }>(`${this.apiUrl}/maquinaria/${maquinariaId}/disponible`);
  }

  // Actualizar asignación completa
  actualizarAsignacion(asignacionId: number, dto: MaquinariaCarpinteroDTO): Observable<MaquinariaCarpintero> {
    return this.http.put<MaquinariaCarpintero>(`${this.apiUrl}/${asignacionId}`, dto);
  }

  // Eliminar asignación
  eliminarAsignacion(asignacionId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${asignacionId}`);
  }

  // Obtener información completa de maquinaria
  getInfoCompletaMaquinaria(maquinariaId: number): Observable<{
    asignaciones: MaquinariaCarpintero[];
    disponible: boolean;
    totalAsignaciones: number;
  }> {
    return this.http.get<{
      asignaciones: MaquinariaCarpintero[];
      disponible: boolean;
      totalAsignaciones: number;
    }>(`${this.apiUrl}/maquinaria/${maquinariaId}/info-completa`);
  }

  // Obtener resumen por carpintero
  getResumenCarpintero(carpinteroId: number): Observable<ResumenCarpintero> {
    return this.http.get<ResumenCarpintero>(`${this.apiUrl}/carpintero/${carpinteroId}/resumen`);
  }
}