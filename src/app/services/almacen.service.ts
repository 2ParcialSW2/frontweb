import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse,HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../enviroment';
import { AuthService } from './auth.service';
import { map } from 'rxjs/operators';



@Injectable({
  providedIn: 'root'
})
export class AlmacenService {
  private apiUrl = environment.apiUrl + 'api/almacenes';

  constructor(private http: HttpClient, private authService: AuthService) {}

  getAlmacenes(): Observable<any[]> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.obtenerToken()}` 
    });
  
    return this.http.get<any>(this.apiUrl, { headers }).pipe(
      map(response => response.data)
    );


  }
  

  createAlmacen(almacen: any): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.obtenerToken()}` 
    });
    return this.http.post<any>(this.apiUrl, almacen, { headers }); 
  }
  

  updateAlmacen(id: number, almacen: any): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.obtenerToken()}` 
    });
    return this.http.put(this.apiUrl + `/${id}`, almacen, { headers });
  }

  getAlmacen(id: any, almacen: any): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.obtenerToken()}` 
    });
    return this.http.get(this.apiUrl + `${id}/`, almacen);
  }

  deleteAlmacen(id: any): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.obtenerToken()}` 
    });
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers });
  }
}