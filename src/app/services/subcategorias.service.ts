import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../enviroment';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SubcategoriasService {
  private apiUrl = environment.apiUrl + 'api/subcategorias';

  constructor(private http: HttpClient) {}

  getSubcategorias(): Observable<any[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(response => response.data)      //Para retornar un array y poder manejarlo de esta manera en el componente
    );
  }

  createSubcategoria(subcategoria: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, subcategoria);
  }

  updateSubcategoria(subcategoriaId: number, subcategoria: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${subcategoriaId}`, subcategoria);
  }

  getSubcategoria(subcategoriaId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${subcategoriaId}`);
  }

  deleteSubcategoria(subcategoriaId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${subcategoriaId}`);
  }

  getCategoriaBySubcategoria(subcategoriaId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${subcategoriaId}/categorias`);
  }
}
