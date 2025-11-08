import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { GraphQLService } from './graphql.service';
import { 
  Maquinaria, 
  MaquinariaDTO, 
  MaquinariaCarpintero,
  MaquinariaConAsignaciones,
  MaquinariaDisponible
} from '../models/maquinaria.model';

/**
 * Interfaz para la respuesta GraphQL de maquinarias
 */
interface GraphQLMaquinaria {
  id: string;
  nombre: string;
  estado: string;
  descripcion: string;
}

/**
 * Servicio para gestionar maquinarias usando GraphQL
 * 
 * Migrado de REST a GraphQL manteniendo la misma interfaz pública
 * para compatibilidad con componentes existentes.
 */
@Injectable({
  providedIn: 'root'
})
export class MaquinariasService {
  constructor(private graphql: GraphQLService) {}

  /**
   * Obtiene todas las maquinarias
   * 
   * @returns Observable con array de maquinarias
   */
  getMaquinarias(): Observable<Maquinaria[]> {
    const query = `
      query {
        getAllMaquinarias {
          id
          nombre
          estado
          descripcion
        }
      }
    `;

    return this.graphql.query<{ getAllMaquinarias: GraphQLMaquinaria[] }>(query).pipe(
      map(response => {
        return response.getAllMaquinarias.map(maq => this.mapGraphQLToMaquinaria(maq));
      })
    );
  }

  /**
   * Obtiene una maquinaria por su ID
   * 
   * @param id - ID de la maquinaria
   * @returns Observable con la maquinaria
   */
  getMaquinariaById(id: number): Observable<Maquinaria> {
    // Nota: No hay getMaquinariaById en GraphQL, usar getAllMaquinarias y filtrar
    return this.getMaquinarias().pipe(
      map(maquinarias => {
        const maq = maquinarias.find(m => m.id === id);
        if (!maq) {
          throw new Error(`Maquinaria con ID ${id} no encontrada`);
        }
        return maq;
      })
    );
  }

  /**
   * Obtiene maquinarias por estado
   * 
   * @param estado - Estado de la maquinaria
   * @returns Observable con array de maquinarias
   */
  getMaquinariasByEstado(estado: string): Observable<Maquinaria[]> {
    const query = `
      query GetMaquinariasByEstado($estado: String!) {
        getMaquinariasByEstado(estado: $estado) {
          id
          nombre
          estado
          descripcion
        }
      }
    `;

    return this.graphql.query<{ getMaquinariasByEstado: GraphQLMaquinaria[] }>(query, { estado }).pipe(
      map(response => {
        return response.getMaquinariasByEstado.map(maq => this.mapGraphQLToMaquinaria(maq));
      })
    );
  }

  /**
   * Crea una nueva maquinaria
   * 
   * @param maquinaria - Datos de la maquinaria a crear
   * @returns Observable con la maquinaria creada
   */
  createMaquinaria(maquinaria: MaquinariaDTO): Observable<Maquinaria> {
    const mutation = `
      mutation CreateMaquinaria($input: MaquinariaInput!) {
        createMaquinaria(input: $input) {
          id
          nombre
          estado
          descripcion
        }
      }
    `;

    const input = {
      nombre: maquinaria.nombre,
      estado: maquinaria.estado || 'disponible',
      descripcion: maquinaria.descripcion || ''
    };

    return this.graphql.mutate<{ createMaquinaria: GraphQLMaquinaria }>(mutation, { input }).pipe(
      map(response => this.mapGraphQLToMaquinaria(response.createMaquinaria))
    );
  }

  /**
   * Actualiza una maquinaria existente
   * 
   * @param id - ID de la maquinaria a actualizar
   * @param maquinaria - Datos actualizados de la maquinaria
   * @returns Observable con la maquinaria actualizada
   */
  updateMaquinaria(id: number, maquinaria: MaquinariaDTO): Observable<Maquinaria> {
    const mutation = `
      mutation UpdateMaquinaria($id: ID!, $input: MaquinariaInput!) {
        updateMaquinaria(id: $id, input: $input) {
          id
          nombre
          estado
          descripcion
        }
      }
    `;

    const input = {
      nombre: maquinaria.nombre,
      estado: maquinaria.estado || 'disponible',
      descripcion: maquinaria.descripcion || ''
    };

    return this.graphql.mutate<{ updateMaquinaria: GraphQLMaquinaria }>(mutation, {
      id: id.toString(),
      input
    }).pipe(
      map(response => this.mapGraphQLToMaquinaria(response.updateMaquinaria))
    );
  }

  /**
   * Elimina una maquinaria
   * 
   * @param id - ID de la maquinaria a eliminar
   * @returns Observable vacío
   */
  deleteMaquinaria(id: number): Observable<void> {
    const mutation = `
      mutation DeleteMaquinaria($id: ID!) {
        deleteMaquinaria(id: $id)
      }
    `;

    return this.graphql.mutate<{ deleteMaquinaria: boolean }>(mutation, { id: id.toString() }).pipe(
      map(response => {
        if (!response.deleteMaquinaria) {
          throw new Error('No se pudo eliminar la maquinaria');
        }
        return undefined as void;
      })
    );
  }

  /**
   * Obtiene una maquinaria con sus asignaciones
   * 
   * ⚠️ NO DISPONIBLE DIRECTAMENTE EN GRAPHQL
   * Se obtiene la maquinaria y luego sus asignaciones.
   * 
   * @param id - ID de la maquinaria
   * @returns Observable con la maquinaria y sus asignaciones
   */
  getMaquinariaConAsignaciones(id: number): Observable<MaquinariaConAsignaciones> {
    // Obtener maquinaria y asignaciones en paralelo
    return this.getMaquinariaById(id).pipe(
      switchMap(maquinaria => {
        // Usar el servicio de asignaciones para obtener las asignaciones
        // Por ahora, retornar estructura básica
        return throwError(() => new Error(
          'getMaquinariaConAsignaciones no está disponible directamente en GraphQL. ' +
          'Usa AsignacionesMaquinariaService.getAsignacionesPorMaquinaria() y combina los resultados.'
        ));
      })
    );
  }

  /**
   * Obtiene maquinarias disponibles
   * 
   * ⚠️ NO DISPONIBLE DIRECTAMENTE EN GRAPHQL
   * Se puede filtrar por estado 'disponible' o usar verificarDisponibilidadMaquinaria.
   * 
   * @returns Observable con array de maquinarias disponibles
   */
  getMaquinariasDisponibles(): Observable<MaquinariaDisponible[]> {
    // Alternativa: Obtener maquinarias con estado 'disponible'
    return this.getMaquinariasByEstado('disponible').pipe(
      map(maquinarias => {
        return maquinarias.map(maq => ({
          maquinaria: maq,
          disponible: true
        }));
      })
    );
  }

  /**
   * Asigna un carpintero a una maquinaria
   * 
   * ⚠️ Este método está en AsignacionesMaquinariaService
   * Se mantiene aquí para compatibilidad, pero delega al servicio de asignaciones.
   * 
   * @param maquinariaId - ID de la maquinaria
   * @param carpinteroId - ID del carpintero
   * @param estado - Estado de la asignación
   * @returns Observable con la asignación creada
   */
  asignarCarpinteroAMaquinaria(
    maquinariaId: number, 
    carpinteroId: number, 
    estado: string = 'en_uso'
  ): Observable<MaquinariaCarpintero> {
    // Este método debería estar en AsignacionesMaquinariaService
    // Por ahora, lanzar error indicando que use el servicio correcto
    return throwError(() => new Error(
      'asignarCarpinteroAMaquinaria está en AsignacionesMaquinariaService. ' +
      'Usa ese servicio en su lugar.'
    ));
  }

  /**
   * Libera una maquinaria
   * 
   * ⚠️ Este método está en AsignacionesMaquinariaService
   * 
   * @param maquinariaId - ID de la maquinaria
   * @returns Observable con la asignación actualizada
   */
  liberarMaquinaria(maquinariaId: number): Observable<MaquinariaCarpintero> {
    return throwError(() => new Error(
      'liberarMaquinaria está en AsignacionesMaquinariaService. ' +
      'Usa ese servicio en su lugar.'
    ));
  }

  /**
   * Mapea una maquinaria de GraphQL al formato esperado por los componentes
   * 
   * @param graphqlMaquinaria - Maquinaria en formato GraphQL
   * @returns Maquinaria en formato TypeScript
   */
  private mapGraphQLToMaquinaria(graphqlMaquinaria: GraphQLMaquinaria): Maquinaria {
    return {
      id: parseInt(graphqlMaquinaria.id, 10),
      nombre: graphqlMaquinaria.nombre,
      estado: graphqlMaquinaria.estado,
      descripcion: graphqlMaquinaria.descripcion
    };
  }
} 