import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GraphQLService } from './graphql.service';
import { DetallePedidoCompra, DetallePedidoCompraDTO } from '../models/compra.model';

/**
 * Interfaz para la respuesta GraphQL de DetallePedidoCompra
 */
interface GraphQLDetallePedidoCompra {
  id: string;
  cantidad: number;
  estado?: string | null;
  importe?: number | null;
  importe_desc?: number | null;
  precio?: number | null;
  compra?: {
    id: string;
    estado?: string | null;
    fecha?: string | null;
  } | null;
  material?: {
    id: string;
    nombre: string;
  } | null;
}

/**
 * Servicio para gestionar detalles de pedido de compra usando GraphQL
 * 
 * Migrado de REST a GraphQL manteniendo la misma interfaz pública
 * para compatibilidad con componentes existentes.
 */
@Injectable({
  providedIn: 'root'
})
export class DetallePedidoCompraService {
  constructor(private graphql: GraphQLService) {}

  /**
   * Obtiene todos los detalles de pedido de compra
   * 
   * @returns Observable con array de detalles
   */
  getDetallesPedidos(): Observable<DetallePedidoCompra[]> {
    const query = `
      query {
        getAllDetallePedidoCompras {
          id
          cantidad
          estado
          importe
          importe_desc
          precio
          compra {
            id
            estado
            fecha
          }
          material {
            id
            nombre
          }
        }
      }
    `;

    return this.graphql.query<{ getAllDetallePedidoCompras: GraphQLDetallePedidoCompra[] }>(query).pipe(
      map(response => {
        return response.getAllDetallePedidoCompras.map(detalle => this.mapGraphQLToDetallePedidoCompra(detalle));
      })
    );
  }

  /**
   * Obtiene un detalle de pedido de compra por ID
   * 
   * @param id - ID del detalle
   * @returns Observable con el detalle
   */
  getDetallePedido(id: number): Observable<any> {
    const query = `
      query GetDetallePedidoCompra($id: ID!) {
        getDetallePedidoCompraById(id: $id) {
          id
          cantidad
          estado
          importe
          importe_desc
          precio
          compra {
            id
            estado
            fecha
          }
          material {
            id
            nombre
          }
        }
      }
    `;

    return this.graphql.query<{ getDetallePedidoCompraById: GraphQLDetallePedidoCompra }>(query, { id: id.toString() }).pipe(
      map(response => this.mapGraphQLToDetallePedidoCompra(response.getDetallePedidoCompraById))
    );
  }

  /**
   * Crea un nuevo detalle de pedido de compra
   * 
   * @param detalle - Datos del detalle a crear
   * @returns Observable con el detalle creado
   */
  createDetallePedido(detalle: DetallePedidoCompraDTO): Observable<any> {
    const mutation = `
      mutation CreateDetallePedidoCompra($input: DetallePedidoCompraInput!) {
        createDetallePedidoCompra(input: $input) {
          id
          cantidad
          estado
          importe
          importe_desc
          precio
          compra {
            id
            estado
            fecha
          }
          material {
            id
            nombre
          }
        }
      }
    `;

    const input = {
      compraId: detalle.compraId.toString(),
      materialId: detalle.materialId.toString(),
      cantidad: detalle.cantidad || 0,
      precio: detalle.precioUnitario || detalle.precio || 0,
      importe: detalle.subtotal || detalle.importe || (detalle.cantidad * (detalle.precioUnitario || detalle.precio || 0)),
      importe_desc: detalle.importe_desc || 0,
      estado: detalle.estado || 'PENDIENTE'
    };

    return this.graphql.mutate<{ createDetallePedidoCompra: GraphQLDetallePedidoCompra }>(mutation, { input }).pipe(
      map(response => this.mapGraphQLToDetallePedidoCompra(response.createDetallePedidoCompra))
    );
  }

  /**
   * Actualiza un detalle de pedido de compra existente
   * 
   * @param id - ID del detalle a actualizar
   * @param detalle - Datos actualizados del detalle
   * @returns Observable con el detalle actualizado
   */
  updateDetallePedido(id: number, detalle: DetallePedidoCompraDTO): Observable<any> {
    const mutation = `
      mutation UpdateDetallePedidoCompra($id: ID!, $input: DetallePedidoCompraInput!) {
        updateDetallePedidoCompra(id: $id, input: $input) {
          id
          cantidad
          estado
          importe
          importe_desc
          precio
          compra {
            id
            estado
            fecha
          }
          material {
            id
            nombre
          }
        }
      }
    `;

    const input = {
      compraId: detalle.compraId.toString(),
      materialId: detalle.materialId.toString(),
      cantidad: detalle.cantidad || 0,
      precio: detalle.precioUnitario || detalle.precio || 0,
      importe: detalle.subtotal || detalle.importe || (detalle.cantidad * (detalle.precioUnitario || detalle.precio || 0)),
      importe_desc: detalle.importe_desc || 0,
      estado: detalle.estado || 'PENDIENTE'
    };

    return this.graphql.mutate<{ updateDetallePedidoCompra: GraphQLDetallePedidoCompra }>(mutation, {
      id: id.toString(),
      input
    }).pipe(
      map(response => this.mapGraphQLToDetallePedidoCompra(response.updateDetallePedidoCompra))
    );
  }

  /**
   * Elimina un detalle de pedido de compra
   * 
   * @param id - ID del detalle a eliminar
   * @returns Observable con el resultado
   */
  deleteDetallePedido(id: number): Observable<any> {
    const mutation = `
      mutation DeleteDetallePedidoCompra($id: ID!) {
        deleteDetallePedidoCompra(id: $id)
      }
    `;

    return this.graphql.mutate<{ deleteDetallePedidoCompra: boolean }>(mutation, { id: id.toString() }).pipe(
      map(response => {
        if (!response.deleteDetallePedidoCompra) {
          throw new Error('No se pudo eliminar el detalle de pedido de compra');
        }
        return { success: true };
      })
    );
  }

  /**
   * Obtiene detalles por compra
   * 
   * @param compraId - ID de la compra
   * @returns Observable con array de detalles
   */
  getDetallesPorCompra(compraId: number): Observable<DetallePedidoCompra[]> {
    const query = `
      query GetDetallePedidoComprasPorCompra($compraId: ID!) {
        getDetallePedidoComprasPorCompra(compraId: $compraId) {
          id
          cantidad
          estado
          importe
          importe_desc
          precio
          compra {
            id
            estado
            fecha
          }
          material {
            id
            nombre
          }
        }
      }
    `;

    return this.graphql.query<{ getDetallePedidoComprasPorCompra: GraphQLDetallePedidoCompra[] }>(query, {
      compraId: compraId.toString()
    }).pipe(
      map(response => {
        return response.getDetallePedidoComprasPorCompra.map(detalle => this.mapGraphQLToDetallePedidoCompra(detalle));
      })
    );
  }

  /**
   * Obtiene detalles por material
   * 
   * @param materialId - ID del material
   * @returns Observable con array de detalles
   */
  getDetallesPorMaterial(materialId: number): Observable<DetallePedidoCompra[]> {
    const query = `
      query GetDetallePedidoComprasPorMaterial($materialId: ID!) {
        getDetallePedidoComprasPorMaterial(materialId: $materialId) {
          id
          cantidad
          estado
          importe
          importe_desc
          precio
          compra {
            id
            estado
            fecha
          }
          material {
            id
            nombre
          }
        }
      }
    `;

    return this.graphql.query<{ getDetallePedidoComprasPorMaterial: GraphQLDetallePedidoCompra[] }>(query, {
      materialId: materialId.toString()
    }).pipe(
      map(response => {
        return response.getDetallePedidoComprasPorMaterial.map(detalle => this.mapGraphQLToDetallePedidoCompra(detalle));
      })
    );
  }

  /**
   * Método para diagnosticar problemas con los datos enviados al backend
   * 
   * ⚠️ NO DISPONIBLE EN GRAPHQL
   * Este método es solo para debugging y no tiene equivalente en GraphQL.
   * 
   * @param detalle - Detalle a diagnosticar
   * @returns Observable con el resultado del diagnóstico
   */
  diagnosticarDetallePedido(detalle: DetallePedidoCompraDTO): Observable<any> {
    // En GraphQL, simplemente intentamos crear el detalle
    return this.createDetallePedido(detalle);
  }

  /**
   * Obtiene detalles completos de una compra
   * 
   * @param compraId - ID de la compra
   * @returns Observable con array de detalles completos
   */
  getDetallesCompletosDeCompra(compraId: number): Observable<DetallePedidoCompra[]> {
    // En GraphQL, getDetallesPorCompra ya devuelve la información completa
    return this.getDetallesPorCompra(compraId);
  }

  /**
   * Mapea un detalle de pedido de compra de GraphQL al formato esperado por los componentes
   * 
   * @param graphqlDetalle - Detalle en formato GraphQL
   * @returns Detalle en formato TypeScript
   */
  private mapGraphQLToDetallePedidoCompra(graphqlDetalle: GraphQLDetallePedidoCompra): DetallePedidoCompra {
    return {
      id: parseInt(graphqlDetalle.id, 10),
      compraId: graphqlDetalle.compra ? parseInt(graphqlDetalle.compra.id, 10) : 0,
      materialId: graphqlDetalle.material ? parseInt(graphqlDetalle.material.id, 10) : 0,
      cantidad: graphqlDetalle.cantidad,
      precioUnitario: graphqlDetalle.precio || 0,
      subtotal: graphqlDetalle.importe || 0,
      precio: graphqlDetalle.precio || 0,
      importe: graphqlDetalle.importe || 0,
      importe_desc: graphqlDetalle.importe_desc || 0,
      estado: graphqlDetalle.estado || 'PENDIENTE',
      material: graphqlDetalle.material ? {
        id: parseInt(graphqlDetalle.material.id, 10),
        nombre: graphqlDetalle.material.nombre
      } : undefined,
      compra: graphqlDetalle.compra ? {
        id: parseInt(graphqlDetalle.compra.id, 10),
        fecha: graphqlDetalle.compra.fecha || '',
        estado: graphqlDetalle.compra.estado || '',
        importe_total: 0,
        importe_descuento: 0,
        proveedorId: 0,
        usuarioId: 0
      } : undefined
    };
  }
}
