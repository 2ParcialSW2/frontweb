import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../enviroment';

@Injectable({
  providedIn: 'root'
})
export class PrePlanoService {
  private apiUrl = environment.apiUrl + 'api/preplanos';

  constructor(private http: HttpClient) {}

  getPrePlanos(): Observable<any[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(resp => resp.data || resp)
    );
  }

  getPrePlano(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

 createPrePlano(preplano: {
  cantidad: number;
  descripcion: string;
  tiempo_estimado: string;
  materialId: number;
  preProductoId: number;
}): Observable<any> {
  return this.http.post<any>(this.apiUrl, preplano);
}

updatePrePlano(id: number, preplano: {
  cantidad: number;
  descripcion: string;
  tiempo_estimado: string;
  materialId: number;
  preProductoId: number;
}): Observable<any> {
  return this.http.put<any>(`${this.apiUrl}/${id}`, preplano);
}

  deletePrePlano(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}