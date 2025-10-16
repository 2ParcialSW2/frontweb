import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../enviroment';

@Injectable({
  providedIn: 'root'
})
export class CategoriasService {
  private apiUrl = environment.apiUrl + 'api/categorias';

  constructor(private http: HttpClient) {}

  getCategorias(): Observable<any[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      tap(response => console.log('Respuesta obtenida:', response)),  // para ver la respuesta completa
      map(resp => resp.data)
    );
  }  

  createCategoria(categoria: {
    nombre: string;
    descripcion: string;
    subCategoriaId: number;
  }): Observable<any> {
    return this.http.post<any>(this.apiUrl, categoria);
  }

  getCategoria(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  updateCategoria(id: number, categoria: {
    nombre: string;
    descripcion: string;
    subCategoriaId: number;
  }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, categoria);
  }

  deleteCategoria(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  buscarPorNombre(nombre: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/nombre/${nombre}`);
  }
}
