import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { GraphQLService } from './graphql.service';
import { Pedido, PedidoDTO, MetodoPago } from '../models/pedido.model';

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

/**
 * Interfaz para la respuesta GraphQL de Pedido
 */
interface GraphQLPedido {
  id: string;
  fecha?: string | null;
  descripcion?: string | null;
  importe_total?: number | null;
  importe_total_desc?: number | null;
  estado?: boolean | null;
  usuario?: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
  } | null;
  metodo_pago?: {
    id: string;
    nombre?: string | null;
    descripcion?: string | null;
  } | null;
  detalle_pedidos?: {
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
  }[] | null;
}

/**
 * Servicio para gestionar pedidos usando GraphQL
 * 
 * Migrado de REST a GraphQL manteniendo la misma interfaz pública
 * para compatibilidad con componentes existentes.
 */
@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  constructor(private graphql: GraphQLService) {}

  /**
   * Obtiene todos los pedidos
   * 
   * @returns Observable con respuesta API conteniendo array de pedidos
   */
  listarPedidos(): Observable<ApiResponse<Pedido[]>> {
    const query = `
      query {
        getAllPedidos {
          id
          fecha
          descripcion
          importe_total
          importe_total_desc
          estado
          usuario {
            id
            nombre
            apellido
            email
          }
          metodo_pago {
            id
            nombre
            descripcion
          }
          detalle_pedidos {
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
          }
        }
      }
    `;

    return this.graphql.query<{ getAllPedidos: GraphQLPedido[] }>(query).pipe(
      map(response => {
        const pedidos = response.getAllPedidos.map(pedido => this.mapGraphQLToPedido(pedido));
        return {
          statusCode: 200,
          message: 'Pedidos obtenidos exitosamente',
          data: pedidos
        };
      })
    );
  }

  /**
   * Obtiene un pedido por ID
   * 
   * @param id - ID del pedido
   * @returns Observable con respuesta API conteniendo el pedido
   */
  obtenerPedido(id: number): Observable<ApiResponse<Pedido>> {
    const query = `
      query GetPedido($id: ID!) {
        getPedidoById(id: $id) {
          id
          fecha
          descripcion
          importe_total
          importe_total_desc
          estado
          usuario {
            id
            nombre
            apellido
            email
          }
          metodo_pago {
            id
            nombre
            descripcion
          }
          detalle_pedidos {
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
          }
        }
      }
    `;

    return this.graphql.query<{ getPedidoById: GraphQLPedido }>(query, { id: id.toString() }).pipe(
      map(response => ({
        statusCode: 200,
        message: 'Pedido obtenido exitosamente',
        data: this.mapGraphQLToPedido(response.getPedidoById)
      }))
    );
  }

  /**
   * Crea un nuevo pedido
   * 
   * @param pedidoDTO - Datos del pedido a crear
   * @returns Observable con respuesta API conteniendo el pedido creado
   */
  crearPedido(pedidoDTO: PedidoDTO): Observable<ApiResponse<Pedido>> {
    const mutation = `
      mutation CreatePedido($input: PedidoInput!) {
        createPedido(input: $input) {
          id
          fecha
          descripcion
          importe_total
          importe_total_desc
          estado
          usuario {
            id
            nombre
            apellido
            email
          }
          metodo_pago {
            id
            nombre
            descripcion
          }
          detalle_pedidos {
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
          }
        }
      }
    `;

    const input = {
      fecha: pedidoDTO.fecha || null,
      descripcion: pedidoDTO.descripcion || null,
      importe_total: pedidoDTO.importe_total || null,
      importe_total_desc: pedidoDTO.importe_total_desc || null,
      estado: pedidoDTO.estado !== undefined ? pedidoDTO.estado : null,
      usuario_id: (pedidoDTO.usuario_id || 0).toString(),
      metodo_pago_id: pedidoDTO.metodo_pago_id.toString()
    };

    return this.graphql.mutate<{ createPedido: GraphQLPedido }>(mutation, { input }).pipe(
      map(response => ({
        statusCode: 201,
        message: 'Pedido creado exitosamente',
        data: this.mapGraphQLToPedido(response.createPedido)
      }))
    );
  }

  /**
   * Actualiza un pedido existente
   * 
   * @param id - ID del pedido a actualizar
   * @param pedidoDTO - Datos actualizados del pedido
   * @returns Observable con respuesta API conteniendo el pedido actualizado
   */
  actualizarPedido(id: number, pedidoDTO: PedidoDTO): Observable<ApiResponse<Pedido>> {
    const mutation = `
      mutation UpdatePedido($id: ID!, $input: PedidoInput!) {
        updatePedido(id: $id, input: $input) {
          id
          fecha
          descripcion
          importe_total
          importe_total_desc
          estado
          usuario {
            id
            nombre
            apellido
            email
          }
          metodo_pago {
            id
            nombre
            descripcion
          }
          detalle_pedidos {
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
          }
        }
      }
    `;

    const input = {
      fecha: pedidoDTO.fecha || null,
      descripcion: pedidoDTO.descripcion || null,
      importe_total: pedidoDTO.importe_total || null,
      importe_total_desc: pedidoDTO.importe_total_desc || null,
      estado: pedidoDTO.estado !== undefined ? pedidoDTO.estado : null,
      usuario_id: (pedidoDTO.usuario_id || 0).toString(),
      metodo_pago_id: pedidoDTO.metodo_pago_id.toString()
    };

    return this.graphql.mutate<{ updatePedido: GraphQLPedido }>(mutation, {
      id: id.toString(),
      input
    }).pipe(
      map(response => ({
        statusCode: 200,
        message: 'Pedido actualizado exitosamente',
        data: this.mapGraphQLToPedido(response.updatePedido)
      }))
    );
  }

  /**
   * Elimina un pedido
   * 
   * @param id - ID del pedido a eliminar
   * @returns Observable con respuesta API
   */
  eliminarPedido(id: number): Observable<ApiResponse<void>> {
    const mutation = `
      mutation DeletePedido($id: ID!) {
        deletePedido(id: $id)
      }
    `;

    return this.graphql.mutate<{ deletePedido: boolean }>(mutation, { id: id.toString() }).pipe(
      map(response => {
        if (!response.deletePedido) {
          throw new Error('No se pudo eliminar el pedido');
        }
        return {
          statusCode: 200,
          message: 'Pedido eliminado exitosamente',
          data: undefined as void
        };
      })
    );
  }

  /**
   * Obtiene pedidos por estado
   * 
   * @param estado - Estado del pedido (true/false)
   * @returns Observable con respuesta API conteniendo array de pedidos
   */
  obtenerPedidosPorEstado(estado: boolean): Observable<ApiResponse<Pedido[]>> {
    const query = `
      query GetPedidosByEstado($estado: Boolean!) {
        getPedidosByEstado(estado: $estado) {
          id
          fecha
          descripcion
          importe_total
          importe_total_desc
          estado
          usuario {
            id
            nombre
            apellido
            email
          }
          metodo_pago {
            id
            nombre
            descripcion
          }
          detalle_pedidos {
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
          }
        }
      }
    `;

    return this.graphql.query<{ getPedidosByEstado: GraphQLPedido[] }>(query, { estado }).pipe(
      map(response => {
        const pedidos = response.getPedidosByEstado.map(pedido => this.mapGraphQLToPedido(pedido));
        return {
          statusCode: 200,
          message: 'Pedidos obtenidos exitosamente',
          data: pedidos
        };
      })
    );
  }

  /**
   * Obtiene productos de un pedido con información completa
   * 
   * ⚠️ NO DISPONIBLE DIRECTAMENTE EN GRAPHQL
   * Se puede obtener el pedido y extraer los detalles.
   * 
   * @param id - ID del pedido
   * @returns Observable con respuesta API conteniendo array de productos
   */
  obtenerProductosPedido(id: number): Observable<ApiResponse<any[]>> {
    return this.obtenerPedido(id).pipe(
      map(response => ({
        statusCode: 200,
        message: 'Productos del pedido obtenidos exitosamente',
        data: response.data.detalle_pedidos || []
      }))
    );
  }

  /**
   * Cambia el estado de un pedido
   * 
   * @param id - ID del pedido
   * @param estado - Nuevo estado (true/false)
   * @returns Observable con respuesta API conteniendo el pedido actualizado
   */
  cambiarEstadoPedido(id: number, estado: boolean): Observable<ApiResponse<Pedido>> {
    const mutation = `
      mutation CambiarEstadoPedido($id: ID!, $estado: Boolean!) {
        cambiarEstadoPedido(id: $id, estado: $estado) {
          id
          fecha
          descripcion
          importe_total
          importe_total_desc
          estado
          usuario {
            id
            nombre
            apellido
            email
          }
          metodo_pago {
            id
            nombre
            descripcion
          }
          detalle_pedidos {
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
          }
        }
      }
    `;

    return this.graphql.mutate<{ cambiarEstadoPedido: GraphQLPedido }>(mutation, {
      id: id.toString(),
      estado
    }).pipe(
      map(response => ({
        statusCode: 200,
        message: 'Estado del pedido actualizado exitosamente',
        data: this.mapGraphQLToPedido(response.cambiarEstadoPedido)
      }))
    );
  }

  /**
   * Método alternativo usando query parameter
   * 
   * ⚠️ NO DISPONIBLE EN GRAPHQL
   * Usa cambiarEstadoPedido() en su lugar.
   * 
   * @param id - ID del pedido
   * @param estado - Nuevo estado
   * @returns Observable con respuesta API
   */
  cambiarEstadoPedidoConQuery(id: number, estado: boolean): Observable<ApiResponse<Pedido>> {
    return this.cambiarEstadoPedido(id, estado);
  }

  /**
   * Actualiza totales del pedido
   * 
   * ⚠️ NO DISPONIBLE DIRECTAMENTE EN GRAPHQL
   * Se debe actualizar el pedido con los nuevos totales.
   * 
   * @param id - ID del pedido
   * @returns Observable con respuesta API
   */
  actualizarTotales(id: number): Observable<ApiResponse<Pedido>> {
    return throwError(() => new Error(
      'actualizarTotales no está disponible directamente en GraphQL. ' +
      'Obtén el pedido, calcula los totales y actualiza el pedido con updatePedido().'
    ));
  }

  /**
   * Finaliza pedido
   * 
   * ⚠️ NO DISPONIBLE DIRECTAMENTE EN GRAPHQL
   * Se puede cambiar el estado del pedido a true usando cambiarEstadoPedido().
   * 
   * @param id - ID del pedido
   * @returns Observable con respuesta API
   */
  finalizarPedido(id: number): Observable<ApiResponse<Pedido>> {
    return this.cambiarEstadoPedido(id, true);
  }

  /**
   * Verifica la disponibilidad de la API
   * 
   * ⚠️ NO DISPONIBLE EN GRAPHQL
   * Usa listarPedidos() para verificar la conectividad.
   * 
   * @returns Observable con respuesta
   */
  verificarAPI(): Observable<any> {
    return this.listarPedidos();
  }

  /**
   * Verifica un pedido específico
   * 
   * @param id - ID del pedido
   * @returns Observable con respuesta
   */
  verificarPedido(id: number): Observable<any> {
    return this.obtenerPedido(id);
  }

  /**
   * Mapea un pedido de GraphQL al formato esperado por los componentes
   * 
   * @param graphqlPedido - Pedido en formato GraphQL
   * @returns Pedido en formato TypeScript
   */
  private mapGraphQLToPedido(graphqlPedido: GraphQLPedido): Pedido {
    return {
      id: parseInt(graphqlPedido.id, 10),
      fecha: graphqlPedido.fecha || '',
      descripcion: graphqlPedido.descripcion || '',
      importe_total: graphqlPedido.importe_total || 0,
      importe_total_desc: graphqlPedido.importe_total_desc || 0,
      estado: graphqlPedido.estado !== null && graphqlPedido.estado !== undefined ? graphqlPedido.estado : false,
      usuario: graphqlPedido.usuario ? {
        id: parseInt(graphqlPedido.usuario.id, 10),
        nombre: graphqlPedido.usuario.nombre,
        apellido: graphqlPedido.usuario.apellido,
        email: graphqlPedido.usuario.email
      } : undefined,
      metodo_pago: graphqlPedido.metodo_pago ? {
        id: parseInt(graphqlPedido.metodo_pago.id, 10),
        nombre: graphqlPedido.metodo_pago.nombre || '',
        descripcion: graphqlPedido.metodo_pago.descripcion || ''
      } : undefined,
      detalle_pedidos: graphqlPedido.detalle_pedidos ? graphqlPedido.detalle_pedidos.map(detalle => ({
        id: parseInt(detalle.id, 10),
        cantidad: detalle.cantidad,
        Estado: detalle.Estado !== null && detalle.Estado !== undefined ? detalle.Estado : false,
        importe_Total: detalle.importe_Total || 0,
        importe_Total_Desc: detalle.importe_Total_Desc || 0,
        precioUnitario: detalle.precioUnitario || 0,
        producto_id: detalle.producto ? parseInt(detalle.producto.id, 10) : 0,
        producto: detalle.producto ? {
          id: parseInt(detalle.producto.id, 10),
          nombre: detalle.producto.nombre
        } : undefined
      })) : []
    };
  }
}
