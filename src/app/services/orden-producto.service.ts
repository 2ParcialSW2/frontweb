import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GraphQLService } from './graphql.service';
import { OrdenProducto, OrdenProductoDTO, ApiResponse } from '../models/orden-producto.model';

/**
 * Interfaz para la respuesta GraphQL de OrdenProducto
 */
interface GraphQLOrdenProducto {
  id: string;
  cantidad: number;
  descripcion?: string | null;
  estado?: string | null;
  fecha?: string | null;
  usuario?: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
  } | null;
  producto?: {
    id: string;
    nombre: string;
  } | null;
}

/**
 * Servicio para gestionar órdenes de producto usando GraphQL
 * 
 * Migrado de REST a GraphQL manteniendo la misma interfaz pública
 * para compatibilidad con componentes existentes.
 */
@Injectable({
  providedIn: 'root'
})
export class OrdenProductoService {
  constructor(private graphql: GraphQLService) {}

  /**
   * Obtiene todas las órdenes de producto
   * 
   * @returns Observable con array de órdenes de producto
   */
  getOrdenesProductos(): Observable<OrdenProducto[]> {
    const query = `
      query {
        getAllOrdenProductos {
          id
          cantidad
          descripcion
          estado
          fecha
          usuario {
            id
            nombre
            apellido
            email
          }
          producto {
            id
            nombre
          }
        }
      }
    `;

    return this.graphql.query<{ getAllOrdenProductos: GraphQLOrdenProducto[] }>(query).pipe(
      map(response => {
        return response.getAllOrdenProductos.map(orden => this.mapGraphQLToOrdenProducto(orden));
      })
    );
  }

  /**
   * Obtiene una orden de producto por ID
   * 
   * @param id - ID de la orden
   * @returns Observable con la orden de producto
   */
  getOrdenProducto(id: number): Observable<OrdenProducto> {
    const query = `
      query GetOrdenProducto($id: ID!) {
        getOrdenProductoById(id: $id) {
          id
          cantidad
          descripcion
          estado
          fecha
          usuario {
            id
            nombre
            apellido
            email
          }
          producto {
            id
            nombre
          }
        }
      }
    `;

    return this.graphql.query<{ getOrdenProductoById: GraphQLOrdenProducto }>(query, { id: id.toString() }).pipe(
      map(response => this.mapGraphQLToOrdenProducto(response.getOrdenProductoById))
    );
  }

  /**
   * Crea una nueva orden de producto
   * 
   * @param ordenProducto - Datos de la orden a crear
   * @returns Observable con la orden de producto creada
   */
  createOrdenProducto(ordenProducto: OrdenProductoDTO): Observable<OrdenProducto> {
    const mutation = `
      mutation CreateOrdenProducto($input: OrdenProductoInput!) {
        createOrdenProducto(input: $input) {
          id
          cantidad
          descripcion
          estado
          fecha
          usuario {
            id
            nombre
            apellido
            email
          }
          producto {
            id
            nombre
          }
        }
      }
    `;

    const input = {
      cantidad: ordenProducto.cantidad,
      descripcion: ordenProducto.descripcion || null,
      estado: ordenProducto.estado || null,
      fecha: ordenProducto.fecha || null,
      usuarioId: ordenProducto.usuarioId.toString(),
      productoId: ordenProducto.productoId.toString()
    };

    return this.graphql.mutate<{ createOrdenProducto: GraphQLOrdenProducto }>(mutation, { input }).pipe(
      map(response => this.mapGraphQLToOrdenProducto(response.createOrdenProducto))
    );
  }

  /**
   * Actualiza una orden de producto existente
   * 
   * @param id - ID de la orden a actualizar
   * @param ordenProducto - Datos actualizados de la orden
   * @returns Observable con la orden de producto actualizada
   */
  updateOrdenProducto(id: number, ordenProducto: OrdenProducto): Observable<OrdenProducto> {
    const mutation = `
      mutation UpdateOrdenProducto($id: ID!, $input: OrdenProductoInput!) {
        updateOrdenProducto(id: $id, input: $input) {
          id
          cantidad
          descripcion
          estado
          fecha
          usuario {
            id
            nombre
            apellido
            email
          }
          producto {
            id
            nombre
          }
        }
      }
    `;

    const input = {
      cantidad: ordenProducto.cantidad,
      descripcion: ordenProducto.descripcion || null,
      estado: ordenProducto.estado || null,
      fecha: ordenProducto.fecha || null,
      usuarioId: (ordenProducto.usuarioId || 0).toString(),
      productoId: (ordenProducto.productoId || 0).toString()
    };

    return this.graphql.mutate<{ updateOrdenProducto: GraphQLOrdenProducto }>(mutation, {
      id: id.toString(),
      input
    }).pipe(
      map(response => this.mapGraphQLToOrdenProducto(response.updateOrdenProducto))
    );
  }

  /**
   * Elimina una orden de producto
   * 
   * @param id - ID de la orden a eliminar
   * @returns Observable vacío
   */
  deleteOrdenProducto(id: number): Observable<void> {
    const mutation = `
      mutation DeleteOrdenProducto($id: ID!) {
        deleteOrdenProducto(id: $id)
      }
    `;

    return this.graphql.mutate<{ deleteOrdenProducto: boolean }>(mutation, { id: id.toString() }).pipe(
      map(response => {
        if (!response.deleteOrdenProducto) {
          throw new Error('No se pudo eliminar la orden de producto');
        }
        return undefined as void;
      })
    );
  }

  /**
   * Mapea una orden de producto de GraphQL al formato esperado por los componentes
   * 
   * @param graphqlOrdenProducto - Orden de producto en formato GraphQL
   * @returns Orden de producto en formato TypeScript
   */
  private mapGraphQLToOrdenProducto(graphqlOrdenProducto: GraphQLOrdenProducto): OrdenProducto {
    return {
      id: parseInt(graphqlOrdenProducto.id, 10),
      cantidad: graphqlOrdenProducto.cantidad,
      descripcion: graphqlOrdenProducto.descripcion || '',
      estado: graphqlOrdenProducto.estado || '',
      fecha: graphqlOrdenProducto.fecha || '',
      usuarioId: graphqlOrdenProducto.usuario ? parseInt(graphqlOrdenProducto.usuario.id, 10) : undefined,
      productoId: graphqlOrdenProducto.producto ? parseInt(graphqlOrdenProducto.producto.id, 10) : undefined
    };
  }
}
