import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GraphQLService } from './graphql.service';

/**
 * Interfaz para la respuesta GraphQL de OrdenPreProducto
 */
interface GraphQLOrdenPreProducto {
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
  preProducto?: {
    id: string;
    nombre: string;
  } | null;
}

/**
 * Servicio para gestionar órdenes de pre-producto usando GraphQL
 * 
 * Migrado de REST a GraphQL manteniendo la misma interfaz pública
 * para compatibilidad con componentes existentes.
 */
@Injectable({
  providedIn: 'root'
})
export class OrdenPrepreproductoService {
  constructor(private graphql: GraphQLService) {}

  /**
   * Obtiene todas las órdenes de pre-producto
   * 
   * @returns Observable con array de órdenes de pre-producto
   */
  getOrdenesPreproductos(): Observable<any[]> {
    const query = `
      query {
        getAllOrdenPreProductos {
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
          preProducto {
            id
            nombre
          }
        }
      }
    `;

    return this.graphql.query<{ getAllOrdenPreProductos: GraphQLOrdenPreProducto[] }>(query).pipe(
      map(response => {
        return response.getAllOrdenPreProductos.map(orden => this.mapGraphQLToOrdenPreProducto(orden));
      })
    );
  }

  /**
   * Obtiene una orden de pre-producto por ID
   * 
   * @param id - ID de la orden
   * @returns Observable con la orden de pre-producto
   */
  getOrdenPreproducto(id: number): Observable<any> {
    const query = `
      query GetOrdenPreProducto($id: ID!) {
        getOrdenPreProductoById(id: $id) {
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
          preProducto {
            id
            nombre
          }
        }
      }
    `;

    return this.graphql.query<{ getOrdenPreProductoById: GraphQLOrdenPreProducto }>(query, { id: id.toString() }).pipe(
      map(response => this.mapGraphQLToOrdenPreProducto(response.getOrdenPreProductoById))
    );
  }

  /**
   * Crea una nueva orden de pre-producto
   * 
   * @param ordenPreproducto - Datos de la orden a crear
   * @returns Observable con la orden de pre-producto creada
   */
  createOrdenPreproducto(ordenPreproducto: any): Observable<any> {
    const mutation = `
      mutation CreateOrdenPreProducto($input: OrdenPreProductoInput!) {
        createOrdenPreProducto(input: $input) {
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
          preProducto {
            id
            nombre
          }
        }
      }
    `;

    const input = {
      cantidad: ordenPreproducto.cantidad,
      descripcion: ordenPreproducto.descripcion || null,
      estado: ordenPreproducto.estado || null,
      fecha: ordenPreproducto.fecha || null,
      usuarioId: ordenPreproducto.usuarioId.toString(),
      preProductoId: ordenPreproducto.preProductoId.toString()
    };

    return this.graphql.mutate<{ createOrdenPreProducto: GraphQLOrdenPreProducto }>(mutation, { input }).pipe(
      map(response => this.mapGraphQLToOrdenPreProducto(response.createOrdenPreProducto))
    );
  }

  /**
   * Actualiza una orden de pre-producto existente
   * 
   * @param id - ID de la orden a actualizar
   * @param ordenPreproducto - Datos actualizados de la orden
   * @returns Observable con la orden de pre-producto actualizada
   */
  updateOrdenPreproducto(id: number, ordenPreproducto: any): Observable<any> {
    const mutation = `
      mutation UpdateOrdenPreProducto($id: ID!, $input: OrdenPreProductoInput!) {
        updateOrdenPreProducto(id: $id, input: $input) {
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
          preProducto {
            id
            nombre
          }
        }
      }
    `;

    const input = {
      cantidad: ordenPreproducto.cantidad,
      descripcion: ordenPreproducto.descripcion || null,
      estado: ordenPreproducto.estado || null,
      fecha: ordenPreproducto.fecha || null,
      usuarioId: ordenPreproducto.usuarioId.toString(),
      preProductoId: ordenPreproducto.preProductoId.toString()
    };

    return this.graphql.mutate<{ updateOrdenPreProducto: GraphQLOrdenPreProducto }>(mutation, {
      id: id.toString(),
      input
    }).pipe(
      map(response => this.mapGraphQLToOrdenPreProducto(response.updateOrdenPreProducto))
    );
  }

  /**
   * Elimina una orden de pre-producto
   * 
   * @param id - ID de la orden a eliminar
   * @returns Observable con el resultado
   */
  deleteOrdenPreproducto(id: number): Observable<any> {
    const mutation = `
      mutation DeleteOrdenPreProducto($id: ID!) {
        deleteOrdenPreProducto(id: $id)
      }
    `;

    return this.graphql.mutate<{ deleteOrdenPreProducto: boolean }>(mutation, { id: id.toString() }).pipe(
      map(response => {
        if (!response.deleteOrdenPreProducto) {
          throw new Error('No se pudo eliminar la orden de pre-producto');
        }
        return { success: true };
      })
    );
  }

  /**
   * Mapea una orden de pre-producto de GraphQL al formato esperado por los componentes
   * 
   * @param graphqlOrdenPreProducto - Orden de pre-producto en formato GraphQL
   * @returns Orden de pre-producto en formato TypeScript
   */
  private mapGraphQLToOrdenPreProducto(graphqlOrdenPreProducto: GraphQLOrdenPreProducto): any {
    return {
      id: parseInt(graphqlOrdenPreProducto.id, 10),
      cantidad: graphqlOrdenPreProducto.cantidad,
      descripcion: graphqlOrdenPreProducto.descripcion || '',
      estado: graphqlOrdenPreProducto.estado || '',
      fecha: graphqlOrdenPreProducto.fecha || '',
      usuarioId: graphqlOrdenPreProducto.usuario ? parseInt(graphqlOrdenPreProducto.usuario.id, 10) : 0,
      preProductoId: graphqlOrdenPreProducto.preProducto ? parseInt(graphqlOrdenPreProducto.preProducto.id, 10) : 0,
      usuario: graphqlOrdenPreProducto.usuario ? {
        id: parseInt(graphqlOrdenPreProducto.usuario.id, 10),
        nombre: graphqlOrdenPreProducto.usuario.nombre,
        apellido: graphqlOrdenPreProducto.usuario.apellido,
        email: graphqlOrdenPreProducto.usuario.email
      } : undefined,
      preProducto: graphqlOrdenPreProducto.preProducto ? {
        id: parseInt(graphqlOrdenPreProducto.preProducto.id, 10),
        nombre: graphqlOrdenPreProducto.preProducto.nombre
      } : undefined
    };
  }
}
