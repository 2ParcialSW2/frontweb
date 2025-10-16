import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap, forkJoin, of } from 'rxjs';
import { environment } from '../enviroment';

@Injectable({
  providedIn: 'root'
})
export class MaterialesService {
  private apiUrl = environment.apiUrl + 'api/materiales';
  private comprasDetalleUrl = environment.apiUrl + 'api/compras-detalle';

  constructor(private http: HttpClient) {
    console.log('URL de API de materiales:', this.apiUrl);
  }

  getMateriales(): Observable<any[]> {
    console.log('Llamando a getMateriales:', this.apiUrl);
    return this.http.get<any>(this.apiUrl).pipe(
      tap(response => console.log('Respuesta completa de materiales:', response)),
      map(resp => {
        let data = resp.data || [];
        
        // Asegurar que cada material tiene los campos básicos
        return data.map((material: any) => {
          return {
            ...material,
            stockActual: material.stockActual !== undefined ? material.stockActual : 0,
            stockMinimo: material.stockMinimo !== undefined ? material.stockMinimo : 0,
            precio: material.precio !== undefined ? material.precio : 0,
            descripcion: material.descripcion || 'Sin descripción'
          };
        });
      })
    );
  }

  getMaterialesCompletos(): Observable<any[]> {
    console.log('Llamando a getMaterialesCompletos...');
    return this.getMateriales().pipe(
      map(materiales => {
        if (!materiales) {
          console.warn('getMaterialesCompletos: No se recibieron materiales (undefined/null)');
          return [];
        }
        
        if (!Array.isArray(materiales)) {
          console.warn('getMaterialesCompletos: Los datos recibidos no son un array:', typeof materiales);
          return [];
        }
        
        if (materiales.length === 0) {
          console.warn('getMaterialesCompletos: Se recibió un array vacío de materiales');
          return [];
        }
        
        console.log(`Procesando ${materiales.length} materiales para completar información`);
        
        // Verificar la estructura de los primeros materiales para depuración
        if (materiales.length > 0) {
          console.log('Estructura del primer material recibido:', JSON.stringify(materiales[0]));
        }
        
        return materiales.map((material, index) => {
          if (!material) {
            console.warn(`Material #${index} es null o undefined`);
            return {
              id: 0,
              nombre: `Material inválido #${index}`,
              descripcion: 'Sin descripción',
              stockActual: 0,
              stockMinimo: 0,
              precio: 0
            };
          }
          
          // Convertir explícitamente a números para evitar problemas con strings o valores no numéricos
          const stockActual = typeof material.stockActual === 'string' ? parseFloat(material.stockActual) : Number(material.stockActual);
          const stockMinimo = typeof material.stockMinimo === 'string' ? parseFloat(material.stockMinimo) : Number(material.stockMinimo);
          const precio = typeof material.precio === 'string' ? parseFloat(material.precio) : Number(material.precio);
          
          // Compatibilidad con nombres antiguos de campos
          let stockActualFinal = isNaN(stockActual) ? 0 : stockActual;
          let stockMinimoFinal = isNaN(stockMinimo) ? 0 : stockMinimo;
          
          // Si no existen los nuevos campos, intentar usar los campos antiguos
          if (stockActualFinal === 0 && material.stock !== undefined) {
            const stockAntiguo = typeof material.stock === 'string' ? parseFloat(material.stock) : Number(material.stock);
            stockActualFinal = isNaN(stockAntiguo) ? 0 : stockAntiguo;
          }
          
          if (stockMinimoFinal === 0 && material.stock_minimo !== undefined) {
            const stockMinimoAntiguo = typeof material.stock_minimo === 'string' ? parseFloat(material.stock_minimo) : Number(material.stock_minimo);
            stockMinimoFinal = isNaN(stockMinimoAntiguo) ? 0 : stockMinimoAntiguo;
          }
          
          // Crear una copia del material con valores predeterminados seguros
          const materialProcesado = {
            ...material,
            id: material.id || 0,
            nombre: material.nombre || 'Sin nombre',
            descripcion: material.descripcion || 'Sin descripción',
            stockActual: stockActualFinal,
            stockMinimo: stockMinimoFinal,
            precio: isNaN(precio) ? 0 : precio
          };
          
          // Log para materiales potencialmente problemáticos
          if (!material.id || !material.nombre) {
            console.warn(`Material con datos incompletos - ID: ${material.id}, Nombre: ${material.nombre || 'FALTA NOMBRE'}`);
          }
          
          return materialProcesado;
        });
      }),
      tap(materialesProcesados => {
        console.log(`getMaterialesCompletos completado: ${materialesProcesados.length} materiales procesados`);
        // Mostrar algunos ejemplos de los materiales procesados
        if (materialesProcesados.length > 0) {
          console.log('Muestra de materiales procesados:', 
            materialesProcesados.slice(0, 3).map(m => ({ 
              id: m.id, 
              nombre: m.nombre, 
              stockActual: m.stockActual, 
              stockMinimo: m.stockMinimo, 
              precio: m.precio 
            }))
          );
        }
      })
    );
  }

  getUltimoPrecioMaterial(materialId: number): Observable<number> {
    return this.http.get<any>(`${this.comprasDetalleUrl}/material/${materialId}`).pipe(
      map(resp => {
        const detalles = resp.data || [];
        if (detalles.length === 0) {
          return 0;
        }
        
        detalles.sort((a: any, b: any) => {
          const fechaA = a.compra?.fecha ? new Date(a.compra.fecha).getTime() : 0;
          const fechaB = b.compra?.fecha ? new Date(b.compra.fecha).getTime() : 0;
          return fechaB - fechaA;
        });
        
        return detalles[0].precioUnitario || 0;
      }),
      tap(precio => console.log(`Último precio para material ${materialId}: ${precio}`)),
      (error: any) => {
        console.error(`Error al obtener precio para material ${materialId}:`, error);
        return of(0);
      }
    );
  }

  getMaterial(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(resp => resp.data)
    );
  }

  createMaterial(material: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, material);
  }

  updateMaterial(id: number, material: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, material);
  }

  deleteMaterial(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  XactualizarStock(id: number, cantidad: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/stock`, { id, cantidad });
  }
  actualizarStock(id: number, payload: { cantidad: number }): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/stock`, payload);
  }

  actualizarImagen(id: number, imagen: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/imagen`, imagen);
  }

  buscarPorNombre(nombre: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/nombre/${nombre}`).pipe(
      map(response => {
        return response.data ? [response.data] : [];
      })
    );
  }

  getPorProveedor(proveedorId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/proveedor/${proveedorId}`);
  }

  getNecesitanReabastecimiento(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/necesitan-reabastecimiento`).pipe(
      map(resp => resp.data)
    );
  }

  getBajoStock(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/bajo-stock`).pipe(
      map(resp => resp.data)
    );
  }

  buscar(q: string): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/buscar?q=${q}`).pipe(
      map(resp => resp.data)
    );
  }
}
