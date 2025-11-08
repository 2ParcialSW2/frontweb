import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { GraphQLService } from './graphql.service';
import { DetallePedido, DetallePedidoDTO } from '../models/pedido.model';

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

/**
 * Interfaz para la respuesta GraphQL de DetallePedido
 */
interface GraphQLDetallePedido {
  id: string;
  cantidad: number;
  Estado?: boolean | null;
  importe_Total?: number | null;
  importe_Total_Desc?: number | null;
  precioUnitario?: number | null;
  producto?: {
    id: string;
    nombre: string;
  } | null;
  pedido?: {
    id: string;
    fecha?: string | null;
    descripcion?: string | null;
  } | null;
}

/**
 * Servicio para gestionar detalles de pedido usando GraphQL
 * 
 * Migrado de REST a GraphQL manteniendo la misma interfaz pública
 * para compatibilidad con componentes existentes.
 */
@Injectable({
  providedIn: 'root'
})
export class DetallePedidoService {
  constructor(private graphql: GraphQLService) {}

  /**
   * Obtiene todos los detalles de pedido
   * 
   * @returns Observable con respuesta API conteniendo array de detalles
   */
  listarDetalles(): Observable<ApiResponse<DetallePedido[]>> {
    const query = `
      query {
        getAllDetallePedidos {
          id
          cantidad
          Estado
          importe_Total
          importe_Total_Desc
          precioUnitario
          producto {
            id
            nombre
          }
          pedido {
            id
            fecha
            descripcion
          }
        }
      }
    `;

    return this.graphql.query<{ getAllDetallePedidos: GraphQLDetallePedido[] }>(query).pipe(
      map(response => {
        const detalles = response.getAllDetallePedidos.map(detalle => this.mapGraphQLToDetallePedido(detalle));
        return {
          statusCode: 200,
          message: 'Detalles de pedido obtenidos exitosamente',
          data: detalles
        };
      })
    );
  }

  /**
   * Obtiene un detalle de pedido por ID
   * 
   * @param id - ID del detalle
   * @returns Observable con respuesta API conteniendo el detalle
   */
  obtenerDetalle(id: number): Observable<ApiResponse<DetallePedido>> {
    const query = `
      query GetDetallePedido($id: ID!) {
        getDetallePedidoById(id: $id) {
          id
          cantidad
          Estado
          importe_Total
          importe_Total_Desc
          precioUnitario
          producto {
            id
            nombre
          }
          pedido {
            id
            fecha
            descripcion
          }
        }
      }
    `;

    return this.graphql.query<{ getDetallePedidoById: GraphQLDetallePedido }>(query, { id: id.toString() }).pipe(
      map(response => ({
        statusCode: 200,
        message: 'Detalle de pedido obtenido exitosamente',
        data: this.mapGraphQLToDetallePedido(response.getDetallePedidoById)
      }))
    );
  }

  /**
   * Crea un nuevo detalle de pedido
   * 
   * @param detalleDTO - Datos del detalle a crear
   * @returns Observable con respuesta API conteniendo el detalle creado
   */
  crearDetalle(detalleDTO: DetallePedidoDTO): Observable<ApiResponse<DetallePedido>> {
    const mutation = `
      mutation CreateDetallePedido($input: DetallePedidoInput!) {
        createDetallePedido(input: $input) {
          id
          cantidad
          Estado
          importe_Total
          importe_Total_Desc
          precioUnitario
          producto {
            id
            nombre
          }
          pedido {
            id
            fecha
            descripcion
          }
        }
      }
    `;

    const input = {
      productoId: (detalleDTO.producto_id || detalleDTO.productoId || 0).toString(),
      pedidoId: (detalleDTO.pedido_id || detalleDTO.pedidoId || 0).toString(),
      cantidad: detalleDTO.cantidad,
      importe_Total_Desc: detalleDTO.importe_Total_Desc || null
    };

    return this.graphql.mutate<{ createDetallePedido: GraphQLDetallePedido }>(mutation, { input }).pipe(
      map(response => ({
        statusCode: 201,
        message: 'Detalle de pedido creado exitosamente',
        data: this.mapGraphQLToDetallePedido(response.createDetallePedido)
      }))
    );
  }

  /**
   * Actualiza un detalle de pedido existente
   * 
   * @param id - ID del detalle a actualizar
   * @param detalleDTO - Datos actualizados del detalle
   * @returns Observable con respuesta API conteniendo el detalle actualizado
   */
  actualizarDetalle(id: number, detalleDTO: DetallePedidoDTO): Observable<ApiResponse<DetallePedido>> {
    const mutation = `
      mutation UpdateDetallePedido($id: ID!, $input: DetallePedidoInput!) {
        updateDetallePedido(id: $id, input: $input) {
          id
          cantidad
          Estado
          importe_Total
          importe_Total_Desc
          precioUnitario
          producto {
            id
            nombre
          }
          pedido {
            id
            fecha
            descripcion
          }
        }
      }
    `;

    const input = {
      productoId: (detalleDTO.producto_id || detalleDTO.productoId || 0).toString(),
      pedidoId: (detalleDTO.pedido_id || detalleDTO.pedidoId || 0).toString(),
      cantidad: detalleDTO.cantidad,
      importe_Total_Desc: detalleDTO.importe_Total_Desc || null
    };

    return this.graphql.mutate<{ updateDetallePedido: GraphQLDetallePedido }>(mutation, {
      id: id.toString(),
      input
    }).pipe(
      map(response => ({
        statusCode: 200,
        message: 'Detalle de pedido actualizado exitosamente',
        data: this.mapGraphQLToDetallePedido(response.updateDetallePedido)
      }))
    );
  }

  /**
   * Actualiza el estado de un detalle de pedido
   * 
   * @param id - ID del detalle
   * @param estado - Nuevo estado (true/false)
   * @returns Observable con respuesta API conteniendo el detalle actualizado
   */
  actualizarDetalleEstado(id: number, estado: boolean): Observable<ApiResponse<DetallePedido>> {
    const mutation = `
      mutation ActualizarDetallePedidoEstado($id: ID!, $estado: Boolean!) {
        actualizarDetallePedidoEstado(id: $id, estado: $estado) {
          id
          cantidad
          Estado
          importe_Total
          importe_Total_Desc
          precioUnitario
          producto {
            id
            nombre
          }
          pedido {
            id
            fecha
            descripcion
          }
        }
      }
    `;

    return this.graphql.mutate<{ actualizarDetallePedidoEstado: GraphQLDetallePedido }>(mutation, {
      id: id.toString(),
      estado
    }).pipe(
      map(response => ({
        statusCode: 200,
        message: 'Estado del detalle de pedido actualizado exitosamente',
        data: this.mapGraphQLToDetallePedido(response.actualizarDetallePedidoEstado)
      }))
    );
  }

  /**
   * Elimina un detalle de pedido
   * 
   * @param id - ID del detalle a eliminar
   * @returns Observable con respuesta API
   */
  eliminarDetalle(id: number): Observable<ApiResponse<void>> {
    const mutation = `
      mutation DeleteDetallePedido($id: ID!) {
        deleteDetallePedido(id: $id)
      }
    `;

    return this.graphql.mutate<{ deleteDetallePedido: boolean }>(mutation, { id: id.toString() }).pipe(
      map(response => {
        if (!response.deleteDetallePedido) {
          throw new Error('No se pudo eliminar el detalle de pedido');
        }
        return {
          statusCode: 200,
          message: 'Detalle de pedido eliminado exitosamente',
          data: undefined as void
        };
      })
    );
  }

  /**
   * Obtiene detalles por pedido
   * 
   * @param pedidoId - ID del pedido
   * @returns Observable con respuesta API conteniendo array de detalles
   */
  obtenerPorPedido(pedidoId: number): Observable<ApiResponse<DetallePedido[]>> {
    const query = `
      query GetDetallePedidosPorPedido($pedidoId: ID!) {
        getDetallePedidosPorPedido(pedidoId: $pedidoId) {
          id
          cantidad
          Estado
          importe_Total
          importe_Total_Desc
          precioUnitario
          producto {
            id
            nombre
          }
          pedido {
            id
            fecha
            descripcion
          }
        }
      }
    `;

    return this.graphql.query<{ getDetallePedidosPorPedido: GraphQLDetallePedido[] }>(query, {
      pedidoId: pedidoId.toString()
    }).pipe(
      map(response => {
        const detalles = response.getDetallePedidosPorPedido.map(detalle => this.mapGraphQLToDetallePedido(detalle));
        return {
          statusCode: 200,
          message: 'Detalles de pedido obtenidos exitosamente',
          data: detalles
        };
      })
    );
  }

  /**
   * Obtiene detalles por producto
   * 
   * @param productoId - ID del producto
   * @returns Observable con respuesta API conteniendo array de detalles
   */
  obtenerPorProducto(productoId: number): Observable<ApiResponse<DetallePedido[]>> {
    const query = `
      query GetDetallePedidosPorProducto($productoId: ID!) {
        getDetallePedidosPorProducto(productoId: $productoId) {
          id
          cantidad
          Estado
          importe_Total
          importe_Total_Desc
          precioUnitario
          producto {
            id
            nombre
          }
          pedido {
            id
            fecha
            descripcion
          }
        }
      }
    `;

    return this.graphql.query<{ getDetallePedidosPorProducto: GraphQLDetallePedido[] }>(query, {
      productoId: productoId.toString()
    }).pipe(
      map(response => {
        const detalles = response.getDetallePedidosPorProducto.map(detalle => this.mapGraphQLToDetallePedido(detalle));
        return {
          statusCode: 200,
          message: 'Detalles de pedido obtenidos exitosamente',
          data: detalles
        };
      })
    );
  }

  /**
   * Crea múltiples detalles de pedido en una sola operación (batch)
   * 
   * ⚠️ NO DISPONIBLE DIRECTAMENTE EN GRAPHQL
   * Se deben crear los detalles uno por uno.
   * 
   * @param detallesDTO - Array de detalles a crear
   * @returns Observable con respuesta API conteniendo array de detalles creados
   */
  crearDetallesBatch(detallesDTO: DetallePedidoDTO[]): Observable<ApiResponse<DetallePedido[]>> {
    return throwError(() => new Error(
      'crearDetallesBatch no está disponible directamente en GraphQL. ' +
      'Crea los detalles uno por uno usando crearDetalle() o considera usar ' +
      'múltiples mutations en una sola petición GraphQL.'
    ));
  }

  /**
   * Mapea un detalle de pedido de GraphQL al formato esperado por los componentes
   * 
   * @param graphqlDetallePedido - Detalle de pedido en formato GraphQL
   * @returns Detalle de pedido en formato TypeScript
   */
  private mapGraphQLToDetallePedido(graphqlDetallePedido: GraphQLDetallePedido): DetallePedido {
    return {
      id: parseInt(graphqlDetallePedido.id, 10),
      cantidad: graphqlDetallePedido.cantidad,
      estado: graphqlDetallePedido.Estado !== null && graphqlDetallePedido.Estado !== undefined ? graphqlDetallePedido.Estado : false,
      importe_total: graphqlDetallePedido.importe_Total || 0,
      importe_total_desc: graphqlDetallePedido.importe_Total_Desc || 0,
      precioUnitario: graphqlDetallePedido.precioUnitario || 0,
      producto: graphqlDetallePedido.producto ? {
        id: parseInt(graphqlDetallePedido.producto.id, 10),
        nombre: graphqlDetallePedido.producto.nombre
      } : undefined,
      pedido: graphqlDetallePedido.pedido ? {
        id: parseInt(graphqlDetallePedido.pedido.id, 10),
        fecha: graphqlDetallePedido.pedido.fecha || '',
        descripcion: graphqlDetallePedido.pedido.descripcion || '',
        importe_total: 0,
        importe_total_desc: 0,
        estado: false
      } : undefined
    };
  }
}
