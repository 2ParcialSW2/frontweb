import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GraphQLService } from './graphql.service';

/**
 * Interfaz para la respuesta GraphQL de PrePlano
 */
interface GraphQLPrePlano {
  id: string;
  cantidad: number;
  descripcion?: string | null;
  tiempo_estimado: string;
  preProducto?: {
    id: string;
    nombre: string;
  } | null;
  material?: {
    id: string;
    nombre: string;
    unidadMedida: string;
  } | null;
}

/**
 * Servicio para gestionar pre-planos usando GraphQL
 * 
 * Migrado de REST a GraphQL manteniendo la misma interfaz pública
 * para compatibilidad con componentes existentes.
 */
@Injectable({
  providedIn: 'root'
})
export class PrePlanoService {
  constructor(private graphql: GraphQLService) {}

  /**
   * Obtiene todos los pre-planos
   * 
   * @returns Observable con array de pre-planos
   */
  getPrePlanos(): Observable<any[]> {
    const query = `
      query {
        getAllPrePlanos {
          id
          cantidad
          descripcion
          tiempo_estimado
          preProducto {
            id
            nombre
          }
          material {
            id
            nombre
            unidadMedida
          }
        }
      }
    `;

    return this.graphql.query<{ getAllPrePlanos: GraphQLPrePlano[] }>(query).pipe(
      map(response => {
        return response.getAllPrePlanos.map(plano => this.mapGraphQLToPrePlano(plano));
      })
    );
  }

  /**
   * Obtiene un pre-plano por su ID
   * 
   * @param id - ID del pre-plano
   * @returns Observable con el pre-plano
   */
  getPrePlano(id: number): Observable<any> {
    const query = `
      query GetPrePlano($id: ID!) {
        getPrePlanoById(id: $id) {
          id
          cantidad
          descripcion
          tiempo_estimado
          preProducto {
            id
            nombre
          }
          material {
            id
            nombre
            unidadMedida
          }
        }
      }
    `;

    return this.graphql.query<{ getPrePlanoById: GraphQLPrePlano }>(query, { id: id.toString() }).pipe(
      map(response => this.mapGraphQLToPrePlano(response.getPrePlanoById))
    );
  }

  /**
   * Crea un nuevo pre-plano
   * 
   * @param preplano - Datos del pre-plano a crear
   * @returns Observable con el pre-plano creado
   */
  createPrePlano(preplano: {
    cantidad: number;
    descripcion: string;
    tiempo_estimado: string;
    materialId: number;
    preProductoId: number;
  }): Observable<any> {
    const mutation = `
      mutation CreatePrePlano($input: PrePlanoInput!) {
        createPrePlano(input: $input) {
          id
          cantidad
          descripcion
          tiempo_estimado
          preProducto {
            id
            nombre
          }
          material {
            id
            nombre
            unidadMedida
          }
        }
      }
    `;

    const input = {
      preProductoId: preplano.preProductoId.toString(),
      materialId: preplano.materialId.toString(),
      cantidad: preplano.cantidad,
      descripcion: preplano.descripcion || null,
      tiempo_estimado: preplano.tiempo_estimado
    };

    return this.graphql.mutate<{ createPrePlano: GraphQLPrePlano }>(mutation, { input }).pipe(
      map(response => this.mapGraphQLToPrePlano(response.createPrePlano))
    );
  }

  /**
   * Actualiza un pre-plano existente
   * 
   * @param id - ID del pre-plano a actualizar
   * @param preplano - Datos actualizados del pre-plano
   * @returns Observable con el pre-plano actualizado
   */
  updatePrePlano(id: number, preplano: {
    cantidad: number;
    descripcion: string;
    tiempo_estimado: string;
    materialId: number;
    preProductoId: number;
  }): Observable<any> {
    const mutation = `
      mutation UpdatePrePlano($id: ID!, $input: PrePlanoInput!) {
        updatePrePlano(id: $id, input: $input) {
          id
          cantidad
          descripcion
          tiempo_estimado
          preProducto {
            id
            nombre
          }
          material {
            id
            nombre
            unidadMedida
          }
        }
      }
    `;

    const input = {
      preProductoId: preplano.preProductoId.toString(),
      materialId: preplano.materialId.toString(),
      cantidad: preplano.cantidad,
      descripcion: preplano.descripcion || null,
      tiempo_estimado: preplano.tiempo_estimado
    };

    return this.graphql.mutate<{ updatePrePlano: GraphQLPrePlano }>(mutation, {
      id: id.toString(),
      input
    }).pipe(
      map(response => this.mapGraphQLToPrePlano(response.updatePrePlano))
    );
  }

  /**
   * Elimina un pre-plano
   * 
   * @param id - ID del pre-plano a eliminar
   * @returns Observable con el resultado
   */
  deletePrePlano(id: number): Observable<any> {
    const mutation = `
      mutation DeletePrePlano($id: ID!) {
        deletePrePlano(id: $id)
      }
    `;

    return this.graphql.mutate<{ deletePrePlano: boolean }>(mutation, { id: id.toString() }).pipe(
      map(response => {
        if (!response.deletePrePlano) {
          throw new Error('No se pudo eliminar el pre-plano');
        }
        return { success: true };
      })
    );
  }

  /**
   * Mapea un pre-plano de GraphQL al formato esperado por los componentes
   * 
   * @param graphqlPrePlano - Pre-plano en formato GraphQL
   * @returns Pre-plano en formato TypeScript
   */
  private mapGraphQLToPrePlano(graphqlPrePlano: GraphQLPrePlano): any {
    return {
      id: parseInt(graphqlPrePlano.id, 10),
      cantidad: graphqlPrePlano.cantidad,
      descripcion: graphqlPrePlano.descripcion || '',
      tiempo_estimado: graphqlPrePlano.tiempo_estimado,
      materialId: graphqlPrePlano.material ? parseInt(graphqlPrePlano.material.id, 10) : null,
      preProductoId: graphqlPrePlano.preProducto ? parseInt(graphqlPrePlano.preProducto.id, 10) : null,
      material: graphqlPrePlano.material ? {
        id: parseInt(graphqlPrePlano.material.id, 10),
        nombre: graphqlPrePlano.material.nombre,
        unidadMedida: graphqlPrePlano.material.unidadMedida
      } : null,
      preProducto: graphqlPrePlano.preProducto ? {
        id: parseInt(graphqlPrePlano.preProducto.id, 10),
        nombre: graphqlPrePlano.preProducto.nombre
      } : null
    };
  }
}