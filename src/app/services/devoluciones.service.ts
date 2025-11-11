import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { GraphQLService } from './graphql.service';
import { environment } from '../enviroment';
import {
  DevolucionCreateDTO,
  DevolucionResponseDTO,
  DetalleDevolucionDTO,
  DetalleDevolucionCreateDTO
} from '../models/devoluciones.model';

/**
 * Interfaz para la respuesta GraphQL de Devolucion
 */
interface GraphQLDevolucion {
  id: string;
  fecha?: string | null;
  motivo?: string | null;
  descripcion?: string | null;
  importe_total?: number | null;
  estado?: boolean | null;
  usuarioId?: string | null;
  usuarioNombre?: string | null;
  usuarioEmail?: string | null;
  pedidoId?: string | null;
  pedidoFecha?: string | null;
  detalles?: {
    id: string;
    detallePedidoId?: number | null;
    nombreProducto?: string | null;
    cantidad?: number | null;
    precioUnitario?: number | null;
    motivo_detalle?: string | null;
  }[] | null;
}

/**
 * Servicio para gestionar devoluciones usando GraphQL
 * 
 * Migrado de REST a GraphQL manteniendo la misma interfaz pública
 * para compatibilidad con componentes existentes.
 */
@Injectable({
  providedIn: 'root'
})
export class DevolucionesService {
  constructor(
    private graphql: GraphQLService, 
    private http: HttpClient
  ) {}

  /**
   * Obtiene todas las devoluciones
   * 
   * @returns Observable con array de devoluciones
   */
  getDevoluciones(): Observable<DevolucionResponseDTO[]> {
    const query = `
      query {
        getAllDevoluciones {
          id
          fecha
          motivo
          descripcion
          importe_total
          estado
          usuarioId
          usuarioNombre
          usuarioEmail
          pedidoId
          pedidoFecha
          detalles {
            id
            detallePedidoId
            nombreProducto
            cantidad
            precioUnitario
            motivo_detalle
          }
        }
      }
    `;

    return this.graphql.query<{ getAllDevoluciones: GraphQLDevolucion[] }>(query).pipe(
      map(response => {
        return response.getAllDevoluciones.map(devolucion => this.mapGraphQLToDevolucion(devolucion));
      })
    );
  }

  /**
   * Obtiene una devolución por ID
   * 
   * @param id - ID de la devolución
   * @returns Observable con la devolución
   */
  getDevolucion(id: number): Observable<DevolucionResponseDTO> {
    const query = `
      query GetDevolucion($id: ID!) {
        getDevolucionById(id: $id) {
          id
          fecha
          motivo
          descripcion
          importe_total
          estado
          usuarioId
          usuarioNombre
          usuarioEmail
          pedidoId
          pedidoFecha
          detalles {
            id
            detallePedidoId
            nombreProducto
            cantidad
            precioUnitario
            motivo_detalle
          }
        }
      }
    `;

    return this.graphql.query<{ getDevolucionById: GraphQLDevolucion }>(query, { id: id.toString() }).pipe(
      map(response => this.mapGraphQLToDevolucion(response.getDevolucionById))
    );
  }

  /**
   * Crea una nueva devolución
   * 
   * @param data - Datos de la devolución a crear
   * @returns Observable con la devolución creada
   */
  createDevolucion(data: DevolucionCreateDTO): Observable<DevolucionResponseDTO> {
    const mutation = `
      mutation CreateDevolucion($input: DevolucionInput!) {
        createDevolucion(input: $input) {
          id
          fecha
          motivo
          descripcion
          importe_total
          estado
          usuarioId
          usuarioNombre
          usuarioEmail
          pedidoId
          pedidoFecha
          detalles {
            id
            detallePedidoId
            nombreProducto
            cantidad
            precioUnitario
            motivo_detalle
          }
        }
      }
    `;

    const input = {
      fecha: data.fecha || null,
      motivo: data.motivo || null,
      descripcion: data.descripcion || null,
      importe_total: data.importe_total || null,
      estado: data.estado !== undefined ? data.estado : null,
      usuario_id: data.usuario_id.toString(),
      pedido_id: data.pedido_id.toString()
    };

    return this.graphql.mutate<{ createDevolucion: GraphQLDevolucion }>(mutation, { input }).pipe(
      map(response => this.mapGraphQLToDevolucion(response.createDevolucion))
    );
  }

  /**
   * Actualiza una devolución existente
   * 
   * @param id - ID de la devolución a actualizar
   * @param data - Datos actualizados de la devolución
   * @returns Observable con la devolución actualizada
   */
  updateDevolucion(id: number, data: DevolucionCreateDTO): Observable<DevolucionResponseDTO> {
    const mutation = `
      mutation UpdateDevolucion($id: ID!, $input: DevolucionInput!) {
        updateDevolucion(id: $id, input: $input) {
          id
          fecha
          motivo
          descripcion
          importe_total
          estado
          usuarioId
          usuarioNombre
          usuarioEmail
          pedidoId
          pedidoFecha
          detalles {
            id
            detallePedidoId
            nombreProducto
            cantidad
            precioUnitario
            motivo_detalle
          }
        }
      }
    `;

    const input = {
      fecha: data.fecha || null,
      motivo: data.motivo || null,
      descripcion: data.descripcion || null,
      importe_total: data.importe_total || null,
      estado: data.estado !== undefined ? data.estado : null,
      usuario_id: data.usuario_id.toString(),
      pedido_id: data.pedido_id.toString()
    };

    return this.graphql.mutate<{ updateDevolucion: GraphQLDevolucion }>(mutation, {
      id: id.toString(),
      input
    }).pipe(
      map(response => this.mapGraphQLToDevolucion(response.updateDevolucion))
    );
  }

  /**
   * Elimina una devolución
   * 
   * @param id - ID de la devolución a eliminar
   * @returns Observable con el resultado
   */
  deleteDevolucion(id: number): Observable<any> {
    const mutation = `
      mutation DeleteDevolucion($id: ID!) {
        deleteDevolucion(id: $id)
      }
    `;

    return this.graphql.mutate<{ deleteDevolucion: boolean }>(mutation, { id: id.toString() }).pipe(
      map(response => {
        if (!response.deleteDevolucion) {
          throw new Error('No se pudo eliminar la devolución');
        }
        return { success: true };
      })
    );
  }

  /**
   * Obtiene devoluciones por usuario
   * 
   * @param id - ID del usuario
   * @returns Observable con array de devoluciones
   */
  devolucionesUsuario(id: number): Observable<DevolucionResponseDTO[]> {
    const query = `
      query GetDevolucionesPorUsuario($usuarioId: ID!) {
        getDevolucionesPorUsuario(usuarioId: $usuarioId) {
          id
          fecha
          motivo
          descripcion
          importe_total
          estado
          usuarioId
          usuarioNombre
          usuarioEmail
          pedidoId
          pedidoFecha
          detalles {
            id
            detallePedidoId
            nombreProducto
            cantidad
            precioUnitario
            motivo_detalle
          }
        }
      }
    `;

    return this.graphql.query<{ getDevolucionesPorUsuario: GraphQLDevolucion[] }>(query, {
      usuarioId: id.toString()
    }).pipe(
      map(response => {
        return response.getDevolucionesPorUsuario.map(devolucion => this.mapGraphQLToDevolucion(devolucion));
      })
    );
  }

  /**
   * Obtiene devoluciones por pedido
   * 
   * @param id - ID del pedido
   * @returns Observable con array de devoluciones
   */
  devolucionesPedido(id: number): Observable<DevolucionResponseDTO[]> {
    const query = `
      query GetDevolucionesPorPedido($pedidoId: ID!) {
        getDevolucionesPorPedido(pedidoId: $pedidoId) {
          id
          fecha
          motivo
          descripcion
          importe_total
          estado
          usuarioId
          usuarioNombre
          usuarioEmail
          pedidoId
          pedidoFecha
          detalles {
            id
            detallePedidoId
            nombreProducto
            cantidad
            precioUnitario
            motivo_detalle
          }
        }
      }
    `;

    return this.graphql.query<{ getDevolucionesPorPedido: GraphQLDevolucion[] }>(query, {
      pedidoId: id.toString()
    }).pipe(
      map(response => {
        return response.getDevolucionesPorPedido.map(devolucion => this.mapGraphQLToDevolucion(devolucion));
      })
    );
  }

  /**
   * Obtiene detalles de una devolución
   * 
   * ⚠️ NO DISPONIBLE DIRECTAMENTE EN GRAPHQL
   * Se puede obtener la devolución y extraer los detalles.
   * 
   * @param id - ID de la devolución
   * @returns Observable con array de detalles
   */
  getDetalles(id: number): Observable<DetalleDevolucionDTO[]> {
    return this.getDevolucion(id).pipe(
      map(devolucion => {
        // Convertir DetalleDevolucionResponseDTO[] a DetalleDevolucionDTO[]
        return (devolucion.detalles || []).map(detalle => ({
          id: detalle.id,
          cantidad: detalle.cantidad,
          importe_Total: detalle.precioUnitario * detalle.cantidad,
          motivo_detalle: detalle.motivo_detalle,
          devolucion: '',
          detalle_pedido: {
            id: detalle.detallePedidoId,
            producto: { id: 0, nombre: detalle.nombreProducto } as any,
            cantidad: detalle.cantidad,
            importe_Total: detalle.precioUnitario * detalle.cantidad,
            importe_Total_Desc: 0,
            precioUnitario: detalle.precioUnitario,
            estado: false
          } as any
        }));
      })
    );
  }

  /**
   * Crea un detalle de devolución usando REST API
   * 
   * @param id - ID de la devolución
   * @param data - Datos del detalle a crear
   * @returns Observable con el detalle creado
   */
  postDetalles(id: number, data: DetalleDevolucionCreateDTO): Observable<DetalleDevolucionDTO> {
    const baseUrl = environment.apiUrl.endsWith('/') 
      ? environment.apiUrl.slice(0, -1) 
      : environment.apiUrl;
    const url = `${baseUrl}/api/devoluciones/${id}/detalles`;
    
    // Convertir DetalleDevolucionCreateDTO al formato esperado por el backend REST
    const requestBody = {
      detallePedidoId: data.detallePedidoId,
      cantidad: data.cantidad,
      motivo_detalle: data.motivo_detalle || ''
    };

    // Interfaz para tipar la respuesta del backend
    interface DetalleResponse {
      id: number;
      detallePedidoId: number;
      nombreProducto: string;
      cantidad: number;
      precioUnitario: number;
      motivo_detalle: string;
    }

    return this.http.post<DetalleResponse>(url, requestBody).pipe(
      map(response => {
        // Convertir la respuesta del backend a DetalleDevolucionDTO
        return {
          id: response.id,
          cantidad: response.cantidad,
          importe_Total: response.precioUnitario * response.cantidad,
          motivo_detalle: response.motivo_detalle,
          devolucion: '',
          detalle_pedido: {
            id: response.detallePedidoId,
            producto: { id: 0, nombre: response.nombreProducto },
            cantidad: response.cantidad,
            importe_Total: response.precioUnitario * response.cantidad,
            importe_Total_Desc: 0,
            precioUnitario: response.precioUnitario,
            estado: false
          }
        } as DetalleDevolucionDTO;
      })
    );
  }

  /**
   * Obtiene un detalle específico de devolución
   * 
   * ⚠️ NO DISPONIBLE DIRECTAMENTE EN GRAPHQL
   * Se puede obtener la devolución y buscar el detalle.
   * 
   * @param devolucionId - ID de la devolución
   * @param detalleId - ID del detalle
   * @returns Observable con el detalle
   */
  getDetallesDevolucion(devolucionId: number, detalleId: number): Observable<DetalleDevolucionDTO> {
    return this.getDetalles(devolucionId).pipe(
      map(detalles => {
        const detalle = detalles.find(d => d.id === detalleId);
        if (!detalle) {
          throw new Error(`Detalle con ID ${detalleId} no encontrado`);
        }
        return detalle;
      })
    );
  }

  /**
   * Elimina un detalle de devolución
   * 
   * ⚠️ NO DISPONIBLE DIRECTAMENTE EN GRAPHQL
   * Los detalles se manejan dentro de la devolución.
   * 
   * @param devolucionId - ID de la devolución
   * @param detalleId - ID del detalle
   * @returns Observable con el resultado
   */
  deleteDetallesDevolucion(devolucionId: number, detalleId: number): Observable<any> {
    return throwError(() => new Error(
      'deleteDetallesDevolucion no está disponible directamente en GraphQL. ' +
      'Los detalles de devolución se manejan dentro de la devolución. ' +
      'Actualiza la devolución completa con updateDevolucion() sin incluir el detalle a eliminar.'
    ));
  }

  /**
   * Mapea una devolución de GraphQL al formato esperado por los componentes
   * 
   * @param graphqlDevolucion - Devolución en formato GraphQL
   * @returns Devolución en formato TypeScript
   */
  private mapGraphQLToDevolucion(graphqlDevolucion: GraphQLDevolucion): DevolucionResponseDTO {
    return {
      id: parseInt(graphqlDevolucion.id, 10),
      fecha: graphqlDevolucion.fecha || '',
      motivo: graphqlDevolucion.motivo || '',
      descripcion: graphqlDevolucion.descripcion || '',
      importe_total: graphqlDevolucion.importe_total || 0,
      estado: graphqlDevolucion.estado !== null && graphqlDevolucion.estado !== undefined ? graphqlDevolucion.estado : false,
      usuarioId: graphqlDevolucion.usuarioId ? parseInt(graphqlDevolucion.usuarioId, 10) : 0,
      usuarioNombre: graphqlDevolucion.usuarioNombre || '',
      usuarioEmail: graphqlDevolucion.usuarioEmail || '',
      pedidoId: graphqlDevolucion.pedidoId ? parseInt(graphqlDevolucion.pedidoId, 10) : 0,
      pedidoFecha: graphqlDevolucion.pedidoFecha || '',
      detalles: graphqlDevolucion.detalles ? graphqlDevolucion.detalles.map(detalle => {
        return {
          id: parseInt(detalle.id, 10),
          detallePedidoId: detalle.detallePedidoId || 0,
          nombreProducto: detalle.nombreProducto || 'Producto no disponible',
          cantidad: detalle.cantidad || 0,
          precioUnitario: detalle.precioUnitario || 0,
          motivo_detalle: detalle.motivo_detalle || ''
        };
      }) : []
    };
  }
}