import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../enviroment';
import { DetallePedidoCompra, DetallePedidoCompraDTO } from '../models/compra.model';

@Injectable({
  providedIn: 'root'
})
export class DetallePedidoCompraService {
  private apiUrl = environment.apiUrl + 'api/compras-detalle';

  constructor(private http: HttpClient) {
    console.log('URL de API de detalles de compra:', this.apiUrl);
  }

  getDetallesPedidos(): Observable<DetallePedidoCompra[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      tap(response => console.log('Detalles de Pedidos:', response)),
      map(resp => resp.data)
    );
  }

  getDetallePedido(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(resp => resp.data)
    );
  }

  createDetallePedido(detalle: DetallePedidoCompraDTO): Observable<any> {
    // Validar que todos los campos necesarios estén presentes y sean valores válidos
    if (!detalle.compraId || detalle.compraId <= 0) {
      console.error('Error: createDetallePedido - compraId es inválido:', detalle.compraId);
    }
    
    if (!detalle.materialId || detalle.materialId <= 0) {
      console.error('Error: createDetallePedido - materialId es inválido:', detalle.materialId);
    }
    
    if (!detalle.cantidad || detalle.cantidad <= 0) {
      console.error('Error: createDetallePedido - cantidad es inválida:', detalle.cantidad);
    }
    
    if (detalle.precioUnitario === undefined || detalle.precioUnitario === null) {
      console.error('Error: createDetallePedido - precioUnitario es undefined o null');
      // Asignar 0 como fallback para evitar NULL en la BD
      detalle.precioUnitario = 0;
    }
    
    if (detalle.subtotal === undefined || detalle.subtotal === null) {
      console.error('Error: createDetallePedido - subtotal es undefined o null');
      // Calcular el subtotal si no está presente
      detalle.subtotal = detalle.cantidad * (detalle.precioUnitario || 0);
    }

    // Log completo del detalle que se va a enviar
    console.log('Enviando detalle de compra al servidor:', JSON.stringify(detalle));
    
    // Crear una copia para asegurar que todos los campos sean explícitos
    // Adaptamos los nombres de los campos para que coincidan con el backend
    const detalleToSend = {
      compraId: detalle.compraId,
      materialId: detalle.materialId,
      cantidad: detalle.cantidad,
      precio: detalle.precioUnitario || 0, // El campo en el backend es 'precio'
      importe: detalle.subtotal || (detalle.cantidad * (detalle.precioUnitario || 0)), // El campo en el backend es 'importe'
      importe_desc: 0, // Añadimos este campo requerido por el backend
      estado: 'PENDIENTE' // Añadimos este campo requerido por el backend
    };
    
    return this.http.post<any>(this.apiUrl, detalleToSend).pipe(
      tap(response => console.log('Respuesta del servidor al crear detalle de compra:', response))
    );
  }

  updateDetallePedido(id: number, detalle: DetallePedidoCompraDTO): Observable<any> {
    // Validaciones similares a las de create
    if (detalle.precioUnitario === undefined || detalle.precioUnitario === null) {
      detalle.precioUnitario = 0;
    }
    
    if (detalle.subtotal === undefined || detalle.subtotal === null) {
      detalle.subtotal = detalle.cantidad * (detalle.precioUnitario || 0);
    }
    
    console.log(`Actualizando detalle de compra ID ${id}:`, JSON.stringify(detalle));
    
    // Adaptamos los nombres de los campos para que coincidan con el backend
    const detalleToSend = {
      compraId: detalle.compraId,
      materialId: detalle.materialId,
      cantidad: detalle.cantidad,
      precio: detalle.precioUnitario || 0,
      importe: detalle.subtotal || (detalle.cantidad * (detalle.precioUnitario || 0)),
      importe_desc: 0, // Añadimos este campo requerido por el backend
      estado: 'PENDIENTE' // Añadimos este campo requerido por el backend
    };
    
    return this.http.put<any>(`${this.apiUrl}/${id}`, detalleToSend).pipe(
      tap(response => console.log(`Respuesta del servidor al actualizar detalle ID ${id}:`, response))
    );
  }

  deleteDetallePedido(id: number): Observable<any> {
    console.log(`Eliminando detalle de compra ID ${id}`);
    
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      tap(response => console.log(`Respuesta del servidor al eliminar detalle ID ${id}:`, response))
    );
  }

  getDetallesPorCompra(compraId: number): Observable<DetallePedidoCompra[]> {
    console.log(`Obteniendo detalles para compra ID ${compraId}`);
    
    return this.http.get<any>(`${this.apiUrl}/compra/${compraId}`).pipe(
      tap(response => {
        console.log(`Respuesta completa para compra ID ${compraId}:`, JSON.stringify(response));
        if (response && response.data && Array.isArray(response.data)) {
          console.log(`Se recibieron ${response.data.length} detalles`);
        } else {
          console.log('No se recibieron detalles o la estructura es incorrecta');
        }
      }),
      map(resp => {
        // Mapear los campos del backend a los esperados por el frontend
        if (resp.data && Array.isArray(resp.data)) {
          return resp.data.map((detalle: any) => {
            try {
              // Log para depurar el objeto de detalle recibido
              console.log('Procesando detalle:', JSON.stringify(detalle));
              
              // Datos requeridos del material desde el backend
              let materialId = null;
              
              // El backend puede enviar el materialId en diferentes formatos
              if (detalle.materialId) {
                materialId = detalle.materialId;
              } else if (detalle.material && detalle.material.id) {
                materialId = detalle.material.id;
              } else if (detalle.id_material) {
                materialId = detalle.id_material;
              }
              
              // Si todavía no tenemos materialId, intenta buscarlo en cualquier propiedad que contenga 'material' e 'id'
              if (!materialId) {
                for (const key in detalle) {
                  if (key.toLowerCase().includes('material') && typeof detalle[key] === 'object' && detalle[key]) {
                    for (const subKey in detalle[key]) {
                      if (subKey.toLowerCase().includes('id') && detalle[key][subKey]) {
                        materialId = detalle[key][subKey];
                        console.log(`- Encontrado materialId en ${key}.${subKey}: ${materialId}`);
                        break;
                      }
                    }
                  }
                }
              }
              
              // Para depuración: mostrar propiedades del detalle
              console.log('- Propiedades del detalle:', Object.keys(detalle));
              
              // Asegurarse de que materialId sea un número
              if (materialId !== null) {
                materialId = Number(materialId);
              }
              
              // Construir un objeto material coherente
              const material = detalle.material || { id: materialId };
              
              // Si no hay nombre pero hay materialId, asignar un nombre genérico
              if (!material.nombre && materialId) {
                material.nombre = `Material #${materialId}`;
              }
              
              // Crear un objeto completo con valores por defecto para evitar errores
              const detalleCompleto = {
                id: detalle.id || 0,
                compraId: detalle.compraId || compraId,
                materialId: materialId,
                cantidad: detalle.cantidad || 0,
                precioUnitario: detalle.precio || 0,
                subtotal: detalle.importe || 0,
                precio: detalle.precio || 0,
                importe: detalle.importe || 0,
                importe_desc: detalle.importe_desc || 0,
                estado: detalle.estado || 'PENDIENTE',
                material: material
              };
              
              console.log('- Objeto de detalle procesado:', JSON.stringify({
                id: detalleCompleto.id,
                materialId: detalleCompleto.materialId,
                material: { 
                  id: detalleCompleto.material.id, 
                  nombre: detalleCompleto.material.nombre 
                }
              }));
              
              return detalleCompleto;
              
            } catch (error) {
              console.error('Error procesando detalle:', error);
              // Devolver un objeto mínimo para evitar errores en la interfaz
              return {
                id: detalle.id || 0,
                compraId: compraId,
                materialId: 0,
                cantidad: detalle.cantidad || 0,
                precioUnitario: detalle.precio || 0,
                subtotal: detalle.importe || 0,
                precio: detalle.precio || 0,
                importe: detalle.importe || 0,
                importe_desc: 0,
                estado: 'PENDIENTE',
                material: { id: 0, nombre: 'Error: Material no identificado' }
              };
            }
          });
        }
        
        console.log('No hay datos en la respuesta o no es un array');
        return [];
      })
    );
  }

  getDetallesPorMaterial(materialId: number): Observable<DetallePedidoCompra[]> {
    console.log(`Obteniendo detalles para material ID ${materialId}`);
    
    return this.http.get<any>(`${this.apiUrl}/material/${materialId}`).pipe(
      tap(response => console.log(`Detalles para material ID ${materialId}:`, response)),
      map(resp => {
        // Mapear los campos del backend a los esperados por el frontend
        if (resp.data && Array.isArray(resp.data)) {
          return resp.data.map((detalle: any) => ({
            ...detalle,
            precioUnitario: detalle.precio, // Mapeo del campo precio a precioUnitario
            subtotal: detalle.importe      // Mapeo del campo importe a subtotal
          }));
        }
        return resp.data;
      })
    );
  }
  
  // Método para diagnosticar problemas con los datos enviados al backend
  diagnosticarDetallePedido(detalle: DetallePedidoCompraDTO): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/diagnostico`, {
      ...detalle,
      precio: detalle.precioUnitario,
      importe: detalle.subtotal,
      importe_desc: 0,
      estado: 'PENDIENTE'
    });
  }

  // Método optimizado para cargar los detalles con información completa del material
  getDetallesCompletosDeCompra(compraId: number): Observable<DetallePedidoCompra[]> {
    console.log(`Obteniendo detalles completos para compra ID ${compraId}`);
    
    // Primero obtenemos los detalles básicos
    return this.http.get<any>(`${this.apiUrl}/compra/${compraId}`).pipe(
      tap(response => {
        console.log(`Respuesta inicial para detalles de compra ${compraId}:`, 
          response && response.data ? `${response.data.length} items` : 'Sin datos');
      }),
      map(resp => {
        if (!resp.data || !Array.isArray(resp.data) || resp.data.length === 0) {
          console.log('No hay detalles para procesar');
          return [];
        }
        
        // Procesar cada detalle para asegurar que tenga la estructura correcta
        return resp.data.map((detalle: any) => {
          // Extraer el ID del material de cualquier ubicación posible
          const materialId = detalle.materialId || 
                             (detalle.material && detalle.material.id) || 
                             detalle.id_material || 0;
          
          // Crear un objeto material consistente
          const material = {
            id: materialId,
            nombre: detalle.material && detalle.material.nombre 
                    ? detalle.material.nombre 
                    : `Material #${materialId}`
          };
          
          // Crear el objeto de detalle completo con valores predeterminados para evitar null/undefined
          return {
            id: detalle.id || 0,
            compraId: detalle.compraId || compraId,
            materialId: Number(materialId),
            cantidad: detalle.cantidad || 0,
            precioUnitario: detalle.precio || 0,
            subtotal: detalle.importe || 0,
            precio: detalle.precio || 0,
            importe: detalle.importe || 0,
            importe_desc: detalle.importe_desc || 0,
            estado: detalle.estado || 'PENDIENTE',
            material: material
          };
        });
      }),
      tap(detalles => {
        console.log(`Procesados ${detalles.length} detalles de compra con información de material`);
      })
    );
  }
} 