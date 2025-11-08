import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GraphQLService } from './graphql.service';

/**
 * Interfaz para la respuesta GraphQL de sectores
 */
interface GraphQLSector {
  id: string;
  nombre: string;
  stock?: number | null;
  capacidad_maxima?: number | null;
  tipo?: string | null;
  descripcion?: string | null;
  almacen?: {
    id: string;
    nombre: string;
    capacidad?: number | null;
  } | null;
}

/**
 * Servicio para gestionar sectores usando GraphQL
 * 
 * Migrado de REST a GraphQL manteniendo la misma interfaz pública
 * para compatibilidad con componentes existentes.
 */
@Injectable({
  providedIn: 'root'
})
export class SectorService {
  constructor(private graphql: GraphQLService) {}

  /**
   * Obtiene todos los sectores
   * 
   * @returns Observable con array de sectores
   */
  getSectores(): Observable<any> {
    const query = `
      query {
        getAllSectores {
          id
          nombre
          stock
          capacidad_maxima
          tipo
          descripcion
          almacen {
            id
            nombre
            capacidad
          }
        }
      }
    `;

    return this.graphql.query<{ getAllSectores: GraphQLSector[] }>(query).pipe(
      map(response => {
        return response.getAllSectores.map(sector => this.mapGraphQLToSector(sector));
      })
    );
  }

  /**
   * Obtiene un sector por su ID
   * 
   * @param id - ID del sector
   * @returns Observable con el sector
   */
  getSector(id: number): Observable<any> {
    const query = `
      query GetSector($id: ID!) {
        getSectorById(id: $id) {
          id
          nombre
          stock
          capacidad_maxima
          tipo
          descripcion
          almacen {
            id
            nombre
            capacidad
          }
        }
      }
    `;

    return this.graphql.query<{ getSectorById: GraphQLSector }>(query, { id: id.toString() }).pipe(
      map(response => this.mapGraphQLToSector(response.getSectorById))
    );
  }

  /**
   * Crea un nuevo sector
   * 
   * @param sectores - Datos del sector a crear
   * @returns Observable con el sector creado
   */
  createSectores(sectores: any): Observable<any> {
    const mutation = `
      mutation CreateSector($input: SectorInput!) {
        createSector(input: $input) {
          id
          nombre
          stock
          capacidad_maxima
          tipo
          descripcion
          almacen {
            id
            nombre
            capacidad
          }
        }
      }
    `;

    const input = {
      nombre: sectores.nombre,
      stock: sectores.stock || null,
      capacidad_maxima: sectores.capacidad_maxima || null,
      tipo: sectores.tipo || null,
      descripcion: sectores.descripcion || null,
      almacenId: sectores.almacenId ? sectores.almacenId.toString() : null
    };

    return this.graphql.mutate<{ createSector: GraphQLSector }>(mutation, { input }).pipe(
      map(response => this.mapGraphQLToSector(response.createSector))
    );
  }

  /**
   * Actualiza un sector existente
   * 
   * @param id - ID del sector a actualizar
   * @param sectores - Datos actualizados del sector
   * @returns Observable con el sector actualizado
   */
  updateSectores(id: number, sectores: any): Observable<any> {
    const mutation = `
      mutation UpdateSector($id: ID!, $input: SectorInput!) {
        updateSector(id: $id, input: $input) {
          id
          nombre
          stock
          capacidad_maxima
          tipo
          descripcion
          almacen {
            id
            nombre
            capacidad
          }
        }
      }
    `;

    const input = {
      nombre: sectores.nombre,
      stock: sectores.stock || null,
      capacidad_maxima: sectores.capacidad_maxima || null,
      tipo: sectores.tipo || null,
      descripcion: sectores.descripcion || null,
      almacenId: sectores.almacenId ? sectores.almacenId.toString() : null
    };

    return this.graphql.mutate<{ updateSector: GraphQLSector }>(mutation, {
      id: id.toString(),
      input
    }).pipe(
      map(response => this.mapGraphQLToSector(response.updateSector))
    );
  }

  /**
   * Elimina un sector
   * 
   * @param id - ID del sector a eliminar
   * @returns Observable con el resultado
   */
  deleteSector(id: number): Observable<any> {
    const mutation = `
      mutation DeleteSector($id: ID!) {
        deleteSector(id: $id)
      }
    `;

    return this.graphql.mutate<{ deleteSector: boolean }>(mutation, { id: id.toString() }).pipe(
      map(response => {
        if (!response.deleteSector) {
          throw new Error('No se pudo eliminar el sector');
        }
        return { success: true };
      })
    );
  }

  /**
   * Mapea un sector de GraphQL al formato esperado por los componentes
   * 
   * @param graphqlSector - Sector en formato GraphQL
   * @returns Sector en formato TypeScript
   */
  private mapGraphQLToSector(graphqlSector: GraphQLSector): any {
    return {
      id: parseInt(graphqlSector.id, 10),
      nombre: graphqlSector.nombre,
      stock: graphqlSector.stock || 0,
      capacidad_maxima: graphqlSector.capacidad_maxima || 0,
      tipo: graphqlSector.tipo || '',
      descripcion: graphqlSector.descripcion || '',
      almacenId: graphqlSector.almacen ? parseInt(graphqlSector.almacen.id, 10) : null,
      almacen: graphqlSector.almacen ? {
        id: parseInt(graphqlSector.almacen.id, 10),
        nombre: graphqlSector.almacen.nombre,
        capacidad: graphqlSector.almacen.capacidad || 0
      } : null
    };
  }
}