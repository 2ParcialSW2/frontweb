import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../enviroment';
import { 
  Maquinaria, 
  MaquinariaDTO, 
  MaquinariaCarpintero,
  MaquinariaConAsignaciones,
  MaquinariaDisponible
} from '../models/maquinaria.model';

@Injectable({
  providedIn: 'root'
})
export class MaquinariasService {
  private apiUrl = environment.apiUrl+ 'api/maquinarias';

  constructor(private http: HttpClient) {}

  // CRUD básico para Maquinarias
  getMaquinarias(): Observable<Maquinaria[]> {
    return this.http.get<Maquinaria[]>(this.apiUrl);
  }

  getMaquinariaById(id: number): Observable<Maquinaria> {
    return this.http.get<Maquinaria>(`${this.apiUrl}/${id}`);
  }

  getMaquinariasByEstado(estado: string): Observable<Maquinaria[]> {
    return this.http.get<Maquinaria[]>(`${this.apiUrl}/estado/${estado}`);
  }

  createMaquinaria(maquinaria: MaquinariaDTO): Observable<Maquinaria> {
    return this.http.post<Maquinaria>(this.apiUrl, maquinaria);
  }

  updateMaquinaria(id: number, maquinaria: MaquinariaDTO): Observable<Maquinaria> {
    return this.http.put<Maquinaria>(`${this.apiUrl}/${id}`, maquinaria);
  }

  deleteMaquinaria(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Métodos integrados con asignaciones
  getMaquinariaConAsignaciones(id: number): Observable<MaquinariaConAsignaciones> {
    return this.http.get<MaquinariaConAsignaciones>(`${this.apiUrl}/${id}/con-asignaciones`);
  }

  getMaquinariasDisponibles(): Observable<MaquinariaDisponible[]> {
    return this.http.get<MaquinariaDisponible[]>(`${this.apiUrl}/disponibles`);
  }

  asignarCarpinteroAMaquinaria(
    maquinariaId: number, 
    carpinteroId: number, 
    estado: string = 'en_uso'
  ): Observable<MaquinariaCarpintero> {
    const params = new HttpParams().set('estado', estado);
    return this.http.post<MaquinariaCarpintero>(
      `${this.apiUrl}/${maquinariaId}/asignar-carpintero/${carpinteroId}`,
      {},
      { params }
    );
  }

  liberarMaquinaria(maquinariaId: number): Observable<MaquinariaCarpintero> {
    return this.http.put<MaquinariaCarpintero>(`${this.apiUrl}/${maquinariaId}/liberar`, {});
  }
} 