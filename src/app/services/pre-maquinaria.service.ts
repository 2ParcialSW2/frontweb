import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Maquinaria, PreMaquinaria, PreMaquinariaDTO } from '../models/preMaquinaria.model';
import { environment } from '../enviroment';

@Injectable({
  providedIn: 'root'
})
export class PreMaquinariaService {
    private apiUrl = environment.apiUrl + 'api/pre-maquinarias';
  
    constructor(private http: HttpClient) {
      console.log('URL de API de premaquinarias:', this.apiUrl);
    }

  // Crear nueva planificación
  crear(dto: PreMaquinariaDTO): Observable<PreMaquinaria> {
    return this.http.post<PreMaquinaria>(this.apiUrl, dto);
  }

  // Obtener todas las planificaciones
  obtenerTodas(): Observable<PreMaquinaria[]> {
    return this.http.get<PreMaquinaria[]>(this.apiUrl);
  }

  // Obtener planificación por ID
  obtenerPorId(id: number): Observable<PreMaquinaria> {
    return this.http.get<PreMaquinaria>(`${this.apiUrl}/${id}`);
  }

  // Obtener planificaciones por producto
  obtenerPorProducto(preProductoId: number): Observable<PreMaquinaria[]> {
    return this.http.get<PreMaquinaria[]>(`${this.apiUrl}/producto/${preProductoId}`);
  }

  // Obtener planificaciones por maquinaria
  obtenerPorMaquinaria(maquinariaId: number): Observable<PreMaquinaria[]> {
    return this.http.get<PreMaquinaria[]>(`${this.apiUrl}/maquinaria/${maquinariaId}`);
  }

  // Calcular tiempo total estimado
  calcularTiempoTotal(preProductoId: number): Observable<{tiempoTotalEstimado: number}> {
    return this.http.get<{tiempoTotalEstimado: number}>(`${this.apiUrl}/producto/${preProductoId}/tiempo-total`);
  }

  // Obtener resumen de planificación
  obtenerResumen(preProductoId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/producto/${preProductoId}/resumen`);
  }

  // Actualizar planificación
  actualizar(id: number, dto: PreMaquinariaDTO): Observable<PreMaquinaria> {
    return this.http.put<PreMaquinaria>(`${this.apiUrl}/${id}`, dto);
  }

  // Eliminar planificación
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Buscar por descripción
  buscarPorDescripcion(descripcion: string): Observable<PreMaquinaria[]> {
    const params = new HttpParams().set('descripcion', descripcion);
    return this.http.get<PreMaquinaria[]>(`${this.apiUrl}/buscar`, { params });
  }

  // Verificar si existe planificación
  verificarPlanificacion(preProductoId: number, maquinariaId: number): Observable<{existe: boolean}> {
    const params = new HttpParams()
      .set('preProductoId', preProductoId.toString())
      .set('maquinariaId', maquinariaId.toString());
    return this.http.get<{existe: boolean}>(`${this.apiUrl}/verificar`, { params });
  }

  // Duplicar planificación
  duplicarPlanificacion(preProductoOrigenId: number, preProductoDestinoId: number): Observable<PreMaquinaria[]> {
    const params = new HttpParams()
      .set('preProductoOrigenId', preProductoOrigenId.toString())
      .set('preProductoDestinoId', preProductoDestinoId.toString());
    return this.http.post<PreMaquinaria[]>(`${this.apiUrl}/duplicar`, {}, { params });
  }

  // Obtener estadísticas
  obtenerEstadisticas(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/estadisticas`);
  }

  // Crear planificación rápida
  crearPlanificacionRapida(preProductoId: number, planificaciones: PreMaquinariaDTO[]): Observable<PreMaquinaria[]> {
    const params = new HttpParams().set('preProductoId', preProductoId.toString());
    return this.http.post<PreMaquinaria[]>(`${this.apiUrl}/planificacion-rapida`, planificaciones, { params });
  }

  // Eliminar todas las planificaciones de un producto
  eliminarPlanificacionesProducto(preProductoId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/producto/${preProductoId}`);
  }
}