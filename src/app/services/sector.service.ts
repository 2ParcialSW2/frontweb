import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../enviroment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SectorService {
  private apiUrl = `${environment.apiUrl}api/sectores`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  getSectores(): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.obtenerToken()}`
    });
    
    return this.http.get(this.apiUrl, { headers });
  }
    
  createSectores(sectores: any): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.obtenerToken()}`
    });
    return this.http.post(this.apiUrl, sectores, { headers });
  }
    
  updateSectores(id: number, sectores: any): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.obtenerToken()}`
    });
    return this.http.put(`${this.apiUrl}/${id}`, sectores, { headers });
  }
  
  getSector(id: number): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.obtenerToken()}`
    });
    return this.http.get(`${this.apiUrl}/${id}`, { headers });
  }
  
  deleteSector(id: number): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.obtenerToken()}`
    });
    return this.http.delete(`${this.apiUrl}/${id}`, { headers });
  }
}