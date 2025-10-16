import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../enviroment';
import { Compra, CompraDTO } from '../models/compra.model';

@Injectable({
  providedIn: 'root'
})
export class ComprasService {
  private apiUrl = environment.apiUrl + 'api/compras';

  constructor(private http: HttpClient) {
    console.log('URL de API de compras:', this.apiUrl);
  }

  getCompras(): Observable<Compra[]> {
    console.log('Llamando a getCompras:', this.apiUrl);
    return this.http.get<any>(this.apiUrl).pipe(
      tap(response => console.log('Respuesta completa de compras:', response)),
      map(resp => {
        console.log('Mapeando respuesta a arreglo:', resp.data);
        return resp.data;
      })
    );
  }

  getCompra(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(resp => resp.data)
    );
  }

  createCompra(compra: CompraDTO): Observable<any> {
    console.log('Enviando compra al servidor:', compra);
    return this.http.post<any>(this.apiUrl, compra).pipe(
      tap(response => console.log('Respuesta al crear compra:', response))
    );
  }

  updateCompra(id: number, compra: CompraDTO): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, compra);
  }

  deleteCompra(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  getComprasPorEstado(estado: string): Observable<Compra[]> {
    return this.http.get<any>(`${this.apiUrl}/estado/${estado}`).pipe(
      map(resp => resp.data)
    );
  }

  getComprasPorProveedor(proveedorId: number): Observable<Compra[]> {
    return this.http.get<any>(`${this.apiUrl}/proveedor/${proveedorId}`).pipe(
      map(resp => resp.data)
    );
  }

  getComprasByEstado(estado: string): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/estado/${estado}`).pipe(
      map((response: any) => response.data)
    );
  }

  getComprasByProveedor(proveedorId: number): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/proveedor/${proveedorId}`).pipe(
      map((response: any) => response.data)
    );
  }

  getComprasByFechas(fechaInicio: Date, fechaFin: Date): Observable<any[]> {
    let params = new HttpParams()
      .set('fechaInicio', this.formatDate(fechaInicio))
      .set('fechaFin', this.formatDate(fechaFin));

    return this.http.get<any>(`${this.apiUrl}/materiales/fechas`, { params }).pipe(
      map((response: any) => response.data)
    );
  }

  getComprasByMaterialYFechas(materialId: number, fechaInicio: Date, fechaFin: Date): Observable<any[]> {
    let params = new HttpParams()
      .set('fechaInicio', this.formatDate(fechaInicio))
      .set('fechaFin', this.formatDate(fechaFin));

    return this.http.get<any>(`${this.apiUrl}/material/${materialId}/fechas`, { params }).pipe(
      map((response: any) => response.data)
    );
  }

  getComprasByProveedorYFechas(proveedorId: number, fechaInicio: Date, fechaFin: Date): Observable<any[]> {
    return this.getComprasByProveedor(proveedorId).pipe(
      map(compras => compras.filter(compra => {
        const fechaCompra = new Date(compra.fecha);
        return fechaCompra >= fechaInicio && fechaCompra <= fechaFin;
      }))
    );
  }

  getComprasByEstadoYFechas(estado: string, fechaInicio: Date, fechaFin: Date): Observable<any[]> {
    return this.getComprasByEstado(estado).pipe(
      map(compras => compras.filter(compra => {
        const fechaCompra = new Date(compra.fecha);
        return fechaCompra >= fechaInicio && fechaCompra <= fechaFin;
      }))
    );
  }

  private formatDate(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }
}
