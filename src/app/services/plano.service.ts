import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../enviroment';

@Injectable({
  providedIn: 'root'
})
export class PlanoService {
  private apiUrl = environment.apiUrl + 'api/planos';

  constructor(private http: HttpClient) {}

  getPlanos(): Observable<any[]> {
  return this.http.get<any[]>(this.apiUrl).pipe(
    tap(response => console.log('Planos obtenidos:', response))
  );
}

 getPlano(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  getPlanosPorProducto(productoId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/producto/${productoId}`);
  }

  getPlanosPorPreProducto(preProductoId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/preproducto/${preProductoId}`);
  }

  createPlano(plano: {
    cantidad: number;
    descripcion: string;
    tiempo_estimado: string;
    productoId: number;
    preProductoId: number;
  }): Observable<any> {
    return this.http.post<any>(this.apiUrl, plano);
  }

  updatePlano(id: number, plano: {
    cantidad: number;
    descripcion: string;
    tiempo_estimado: string;
    productoId: number;
    preProductoId: number;
  }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, plano);
  }

  deletePlano(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}