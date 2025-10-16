import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../enviroment';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class OrdenPrepreproductoService {
  private apiUrl = environment.apiUrl + 'api/orden-preproducto';

  constructor(private http: HttpClient) { }

  getOrdenesPreproductos(): Observable<any[]> {
    return this.http.get<any>(this.apiUrl);
  }

  createOrdenPreproducto(ordenPreproducto: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, ordenPreproducto);
  }

  updateOrdenPreproducto(id: number, ordenPreproducto: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, ordenPreproducto);
  }

  getOrdenPreproducto(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  deleteOrdenPreproducto(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
