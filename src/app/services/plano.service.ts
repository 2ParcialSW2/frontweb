import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GraphQLService } from './graphql.service';

/**
 * Interfaz para la respuesta GraphQL de Planos
 */
interface GraphQLPlano {
  id: string;
  cantidad: number;
  descripcion?: string | null;
  tiempo_estimado: string;
  producto?: {
    id: string;
    nombre: string;
  } | null;
  preProducto?: {
    id: string;
    nombre: string;
  } | null;
}

/**
 * Servicio para gestionar planos usando GraphQL
 * 
 * Migrado de REST a GraphQL manteniendo la misma interfaz pública
 * para compatibilidad con componentes existentes.
 */
@Injectable({
  providedIn: 'root'
})
export class PlanoService {
  constructor(private graphql: GraphQLService) {}

  /**
   * Obtiene todos los planos
   * 
   * @returns Observable con array de planos
   */
  getPlanos(): Observable<any[]> {
    const query = `
      query {
        getAllPlanos {
          id
          cantidad
          descripcion
          tiempo_estimado
          producto {
            id
            nombre
          }
          preProducto {
            id
            nombre
          }
        }
      }
    `;

    return this.graphql.query<{ getAllPlanos: GraphQLPlano[] }>(query).pipe(
      map(response => {
        return response.getAllPlanos.map(plano => this.mapGraphQLToPlano(plano));
      })
    );
  }

  /**
   * Obtiene un plano por su ID
   * 
   * @param id - ID del plano
   * @returns Observable con el plano
   */
  getPlano(id: number): Observable<any> {
    const query = `
      query GetPlano($id: ID!) {
        getPlanoById(id: $id) {
          id
          cantidad
          descripcion
          tiempo_estimado
          producto {
            id
            nombre
          }
          preProducto {
            id
            nombre
          }
        }
      }
    `;

    return this.graphql.query<{ getPlanoById: GraphQLPlano }>(query, { id: id.toString() }).pipe(
      map(response => this.mapGraphQLToPlano(response.getPlanoById))
    );
  }

  /**
   * Obtiene planos por producto
   * 
   * @param productoId - ID del producto
   * @returns Observable con array de planos
   */
  getPlanosPorProducto(productoId: number): Observable<any[]> {
    const query = `
      query GetPlanosPorProducto($productoId: ID!) {
        getPlanosPorProducto(productoId: $productoId) {
          id
          cantidad
          descripcion
          tiempo_estimado
          producto {
            id
            nombre
          }
          preProducto {
            id
            nombre
          }
        }
      }
    `;

    return this.graphql.query<{ getPlanosPorProducto: GraphQLPlano[] }>(query, {
      productoId: productoId.toString()
    }).pipe(
      map(response => {
        return response.getPlanosPorProducto.map(plano => this.mapGraphQLToPlano(plano));
      })
    );
  }

  /**
   * Obtiene planos por pre-producto
   * 
   * @param preProductoId - ID del pre-producto
   * @returns Observable con array de planos
   */
  getPlanosPorPreProducto(preProductoId: number): Observable<any[]> {
    const query = `
      query GetPlanosPorPreProducto($preProductoId: ID!) {
        getPlanosPorPreProducto(preProductoId: $preProductoId) {
          id
          cantidad
          descripcion
          tiempo_estimado
          producto {
            id
            nombre
          }
          preProducto {
            id
            nombre
          }
        }
      }
    `;

    return this.graphql.query<{ getPlanosPorPreProducto: GraphQLPlano[] }>(query, {
      preProductoId: preProductoId.toString()
    }).pipe(
      map(response => {
        return response.getPlanosPorPreProducto.map(plano => this.mapGraphQLToPlano(plano));
      })
    );
  }

  /**
   * Crea un nuevo plano
   * 
   * @param plano - Datos del plano a crear
   * @returns Observable con el plano creado
   */
  createPlano(plano: {
    cantidad: number;
    descripcion: string;
    tiempo_estimado: string;
    productoId: number;
    preProductoId: number;
  }): Observable<any> {
    const mutation = `
      mutation CreatePlano($input: PlanoInput!) {
        createPlano(input: $input) {
          id
          cantidad
          descripcion
          tiempo_estimado
          producto {
            id
            nombre
          }
          preProducto {
            id
            nombre
          }
        }
      }
    `;

    const input = {
      productoId: plano.productoId.toString(),
      preProductoId: plano.preProductoId.toString(),
      cantidad: plano.cantidad,
      descripcion: plano.descripcion || null,
      tiempo_estimado: plano.tiempo_estimado
    };

    return this.graphql.mutate<{ createPlano: GraphQLPlano }>(mutation, { input }).pipe(
      map(response => this.mapGraphQLToPlano(response.createPlano))
    );
  }

  /**
   * Actualiza un plano existente
   * 
   * @param id - ID del plano a actualizar
   * @param plano - Datos actualizados del plano
   * @returns Observable con el plano actualizado
   */
  updatePlano(id: number, plano: {
    cantidad: number;
    descripcion: string;
    tiempo_estimado: string;
    productoId: number;
    preProductoId: number;
  }): Observable<any> {
    const mutation = `
      mutation UpdatePlano($id: ID!, $input: PlanoInput!) {
        updatePlano(id: $id, input: $input) {
          id
          cantidad
          descripcion
          tiempo_estimado
          producto {
            id
            nombre
          }
          preProducto {
            id
            nombre
          }
        }
      }
    `;

    const input = {
      productoId: plano.productoId.toString(),
      preProductoId: plano.preProductoId.toString(),
      cantidad: plano.cantidad,
      descripcion: plano.descripcion || null,
      tiempo_estimado: plano.tiempo_estimado
    };

    return this.graphql.mutate<{ updatePlano: GraphQLPlano }>(mutation, {
      id: id.toString(),
      input
    }).pipe(
      map(response => this.mapGraphQLToPlano(response.updatePlano))
    );
  }

  /**
   * Elimina un plano
   * 
   * @param id - ID del plano a eliminar
   * @returns Observable con el resultado
   */
  deletePlano(id: number): Observable<any> {
    const mutation = `
      mutation DeletePlano($id: ID!) {
        deletePlano(id: $id)
      }
    `;

    return this.graphql.mutate<{ deletePlano: boolean }>(mutation, { id: id.toString() }).pipe(
      map(response => {
        if (!response.deletePlano) {
          throw new Error('No se pudo eliminar el plano');
        }
        return { success: true };
      })
    );
  }

  /**
   * Mapea un plano de GraphQL al formato esperado por los componentes
   * 
   * @param graphqlPlano - Plano en formato GraphQL
   * @returns Plano en formato TypeScript
   */
  private mapGraphQLToPlano(graphqlPlano: GraphQLPlano): any {
    return {
      id: parseInt(graphqlPlano.id, 10),
      cantidad: graphqlPlano.cantidad,
      descripcion: graphqlPlano.descripcion || '',
      tiempo_estimado: graphqlPlano.tiempo_estimado,
      productoId: graphqlPlano.producto ? parseInt(graphqlPlano.producto.id, 10) : null,
      preProductoId: graphqlPlano.preProducto ? parseInt(graphqlPlano.preProducto.id, 10) : null,
      producto: graphqlPlano.producto ? {
        id: parseInt(graphqlPlano.producto.id, 10),
        nombre: graphqlPlano.producto.nombre
      } : null,
      preProducto: graphqlPlano.preProducto ? {
        id: parseInt(graphqlPlano.preProducto.id, 10),
        nombre: graphqlPlano.preProducto.nombre
      } : null
    };
  }
}