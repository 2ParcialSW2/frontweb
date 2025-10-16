import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../enviroment';
import { map, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProveedorMaterialService {

  private apiUrl = environment.apiUrl + 'api/proveedores';

  constructor(private http: HttpClient) { }

  // GET: Obtener todos los materiales de un proveedor
  getMaterialesByProveedor(proveedorId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${proveedorId}/materiales`);
  }

  // POST: Asociar un material a un proveedor
  asociarMaterialAProveedor(proveedorId: number, material: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${proveedorId}/materiales`, material);
  }

  // DELETE: Eliminar asociación entre proveedor y material
  eliminarMaterialDeProveedor(proveedorId: number, materialId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${proveedorId}/materiales/${materialId}`);
  }

  // GET: Obtener todas las relaciones proveedor-material
  getAllRelacionesProveedorMaterial(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/relaciones`);
  }

  // Si necesitas actualizar un material asociado a un proveedor,
  // necesitarías un endpoint específico para eso.
  // Ejemplo hipotético (podría no ser correcto):
   actualizarMaterialDeProveedor(proveedorId: number, materialId: number, materialActualizado: any): Observable<any> {
   return this.http.put(`${this.apiUrl}/${proveedorId}/materiales/${materialId}`, materialActualizado);
  }
}