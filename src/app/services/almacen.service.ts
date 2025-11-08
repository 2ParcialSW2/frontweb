import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GraphQLService } from './graphql.service';

/**
 * Interfaz para la respuesta GraphQL de almacenes
 */
interface GraphQLAlmacen {
  id: string;
  nombre: string;
  capacidad?: number | null;
  sectores?: {
    id: string;
    nombre: string;
    stock?: number | null;
    capacidad_maxima?: number | null;
    tipo?: string | null;
    descripcion?: string | null;
  }[] | null;
}

/**
 * Servicio para gestionar almacenes usando GraphQL
 * 
 * Migrado de REST a GraphQL manteniendo la misma interfaz pública
 * para compatibilidad con componentes existentes.
 */
@Injectable({
  providedIn: 'root'
})
export class AlmacenService {
  constructor(private graphql: GraphQLService) {}

  /**
   * Obtiene todos los almacenes
   * 
   * @returns Observable con array de almacenes
   */
  getAlmacenes(): Observable<any[]> {
    const query = `
      query {
        getAllAlmacenes {
          id
          nombre
          capacidad
          sectores {
            id
            nombre
            stock
            capacidad_maxima
            tipo
            descripcion
          }
        }
      }
    `;

    return this.graphql.query<{ getAllAlmacenes: GraphQLAlmacen[] }>(query).pipe(
      map(response => {
        return response.getAllAlmacenes.map(almacen => this.mapGraphQLToAlmacen(almacen));
      })
    );
  }

  /**
   * Obtiene un almacén por su ID
   * 
   * @param id - ID del almacén
   * @param almacen - Parámetro no usado (mantenido para compatibilidad)
   * @returns Observable con el almacén
   */
  getAlmacen(id: any, almacen: any): Observable<any> {
    const query = `
      query GetAlmacen($id: ID!) {
        getAlmacenById(id: $id) {
          id
          nombre
          capacidad
          sectores {
            id
            nombre
            stock
            capacidad_maxima
            tipo
            descripcion
          }
        }
      }
    `;

    return this.graphql.query<{ getAlmacenById: GraphQLAlmacen }>(query, { id: id.toString() }).pipe(
      map(response => this.mapGraphQLToAlmacen(response.getAlmacenById))
    );
  }

  /**
   * Crea un nuevo almacén
   * 
   * @param almacen - Datos del almacén a crear
   * @returns Observable con el almacén creado
   */
  createAlmacen(almacen: any): Observable<any> {
    const mutation = `
      mutation CreateAlmacen($input: AlmacenInput!) {
        createAlmacen(input: $input) {
          id
          nombre
          capacidad
          sectores {
            id
            nombre
            stock
            capacidad_maxima
            tipo
            descripcion
          }
        }
      }
    `;

    const input = {
      nombre: almacen.nombre,
      capacidad: almacen.capacidad || null
    };

    return this.graphql.mutate<{ createAlmacen: GraphQLAlmacen }>(mutation, { input }).pipe(
      map(response => this.mapGraphQLToAlmacen(response.createAlmacen))
    );
  }

  /**
   * Actualiza un almacén existente
   * 
   * @param id - ID del almacén a actualizar
   * @param almacen - Datos actualizados del almacén
   * @returns Observable con el almacén actualizado
   */
  updateAlmacen(id: number, almacen: any): Observable<any> {
    const mutation = `
      mutation UpdateAlmacen($id: ID!, $input: AlmacenInput!) {
        updateAlmacen(id: $id, input: $input) {
          id
          nombre
          capacidad
          sectores {
            id
            nombre
            stock
            capacidad_maxima
            tipo
            descripcion
          }
        }
      }
    `;

    const input = {
      nombre: almacen.nombre,
      capacidad: almacen.capacidad || null
    };

    return this.graphql.mutate<{ updateAlmacen: GraphQLAlmacen }>(mutation, {
      id: id.toString(),
      input
    }).pipe(
      map(response => this.mapGraphQLToAlmacen(response.updateAlmacen))
    );
  }

  /**
   * Elimina un almacén
   * 
   * @param id - ID del almacén a eliminar
   * @returns Observable con el resultado
   */
  deleteAlmacen(id: any): Observable<any> {
    const mutation = `
      mutation DeleteAlmacen($id: ID!) {
        deleteAlmacen(id: $id)
      }
    `;

    return this.graphql.mutate<{ deleteAlmacen: boolean }>(mutation, { id: id.toString() }).pipe(
      map(response => {
        if (!response.deleteAlmacen) {
          throw new Error('No se pudo eliminar el almacén');
        }
        return { success: true };
      })
    );
  }

  /**
   * Mapea un almacén de GraphQL al formato esperado por los componentes
   * 
   * @param graphqlAlmacen - Almacén en formato GraphQL
   * @returns Almacén en formato TypeScript
   */
  private mapGraphQLToAlmacen(graphqlAlmacen: GraphQLAlmacen): any {
    return {
      id: parseInt(graphqlAlmacen.id, 10),
      nombre: graphqlAlmacen.nombre,
      capacidad: graphqlAlmacen.capacidad || 0,
      sectores: graphqlAlmacen.sectores ? graphqlAlmacen.sectores.map(sector => ({
        id: parseInt(sector.id, 10),
        nombre: sector.nombre,
        stock: sector.stock || 0,
        capacidad_maxima: sector.capacidad_maxima || 0,
        tipo: sector.tipo || '',
        descripcion: sector.descripcion || ''
      })) : []
    };
  }
}