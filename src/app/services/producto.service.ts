import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../enviroment';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private apiUrl = environment.apiUrl + 'api/productos';

  constructor(private http: HttpClient) { }

  getProductos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  createProducto(producto: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, producto);
  }

  getProducto(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  updateProducto(id: number, producto: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, producto);
  }

  deleteProducto(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  buscarProductos(query: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/buscar`, {
      params: { query }
    });
  }

  registerProduction(id: number, cantidad: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/producir`, null, {
      params: { cantidad: cantidad.toString() }
    });
  }

  updateStockProducto(id: number, cantidad: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/stock?cantidad=${cantidad}`, {});
  }


  updateImageProducto(id: number, url: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/imagen`, { imagen: url });
  }

  getMateriales(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/materiales`);
  }

  getBajoStock(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/bajo-stock`);
  }

  verificarDisponibilidad(id: number, cantidad: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/verificar-disponibilidad`, {
      params: { cantidad: cantidad.toString() }
    });
  }
}
