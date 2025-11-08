import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { GraphQLService } from './graphql.service';
import { Maquinaria, PreMaquinaria, PreMaquinariaDTO } from '../models/preMaquinaria.model';

/**
 * Interfaz para la respuesta GraphQL de PreMaquinaria
 */
interface GraphQLPreMaquinaria {
  id: string;
  cantidad?: number | null;
  descripcion?: string | null;
  tiempoEstimado?: string | null;
  maquinaria?: {
    id: string;
    nombre: string;
    estado: string;
    descripcion: string;
  } | null;
  preProducto?: {
    id: string;
    nombre: string;
    descripcion?: string | null;
  } | null;
}

/**
 * Servicio para gestionar pre-maquinarias usando GraphQL
 * 
 * Migrado de REST a GraphQL manteniendo la misma interfaz pública
 * para compatibilidad con componentes existentes.
 */
@Injectable({
  providedIn: 'root'
})
export class PreMaquinariaService {
  constructor(private graphql: GraphQLService) {}

  /**
   * Obtiene todas las planificaciones
   * 
   * @returns Observable con array de pre-maquinarias
   */
  obtenerTodas(): Observable<PreMaquinaria[]> {
    const query = `
      query {
        getAllPreMaquinarias {
          id
          cantidad
          descripcion
          tiempoEstimado
          maquinaria {
            id
            nombre
            estado
            descripcion
          }
          preProducto {
            id
            nombre
            descripcion
          }
        }
      }
    `;

    return this.graphql.query<{ getAllPreMaquinarias: GraphQLPreMaquinaria[] }>(query).pipe(
      map(response => {
        return response.getAllPreMaquinarias.map(preMaq => this.mapGraphQLToPreMaquinaria(preMaq));
      })
    );
  }

  /**
   * Obtiene una planificación por ID
   * 
   * @param id - ID de la planificación
   * @returns Observable con la pre-maquinaria
   */
  obtenerPorId(id: number): Observable<PreMaquinaria> {
    const query = `
      query GetPreMaquinaria($id: ID!) {
        getPreMaquinariaById(id: $id) {
          id
          cantidad
          descripcion
          tiempoEstimado
          maquinaria {
            id
            nombre
            estado
            descripcion
          }
          preProducto {
            id
            nombre
            descripcion
          }
        }
      }
    `;

    return this.graphql.query<{ getPreMaquinariaById: GraphQLPreMaquinaria }>(query, { id: id.toString() }).pipe(
      map(response => this.mapGraphQLToPreMaquinaria(response.getPreMaquinariaById))
    );
  }

  /**
   * Crea una nueva planificación
   * 
   * @param dto - Datos de la planificación a crear
   * @returns Observable con la pre-maquinaria creada
   */
  crear(dto: PreMaquinariaDTO): Observable<PreMaquinaria> {
    const mutation = `
      mutation CreatePreMaquinaria($input: PreMaquinariaInput!) {
        createPreMaquinaria(input: $input) {
          id
          cantidad
          descripcion
          tiempoEstimado
          maquinaria {
            id
            nombre
            estado
            descripcion
          }
          preProducto {
            id
            nombre
            descripcion
          }
        }
      }
    `;

    const input = {
      cantidad: dto.cantidad || null,
      descripcion: dto.descripcion || null,
      tiempoEstimado: dto.tiempoEstimado || null,
      maquinariaId: dto.maquinariaId.toString(),
      preProductoId: dto.preProductoId.toString()
    };

    return this.graphql.mutate<{ createPreMaquinaria: GraphQLPreMaquinaria }>(mutation, { input }).pipe(
      map(response => this.mapGraphQLToPreMaquinaria(response.createPreMaquinaria))
    );
  }

  /**
   * Actualiza una planificación existente
   * 
   * @param id - ID de la planificación a actualizar
   * @param dto - Datos actualizados de la planificación
   * @returns Observable con la pre-maquinaria actualizada
   */
  actualizar(id: number, dto: PreMaquinariaDTO): Observable<PreMaquinaria> {
    const mutation = `
      mutation UpdatePreMaquinaria($id: ID!, $input: PreMaquinariaInput!) {
        updatePreMaquinaria(id: $id, input: $input) {
          id
          cantidad
          descripcion
          tiempoEstimado
          maquinaria {
            id
            nombre
            estado
            descripcion
          }
          preProducto {
            id
            nombre
            descripcion
          }
        }
      }
    `;

    const input = {
      cantidad: dto.cantidad || null,
      descripcion: dto.descripcion || null,
      tiempoEstimado: dto.tiempoEstimado || null,
      maquinariaId: dto.maquinariaId.toString(),
      preProductoId: dto.preProductoId.toString()
    };

    return this.graphql.mutate<{ updatePreMaquinaria: GraphQLPreMaquinaria }>(mutation, {
      id: id.toString(),
      input
    }).pipe(
      map(response => this.mapGraphQLToPreMaquinaria(response.updatePreMaquinaria))
    );
  }

  /**
   * Elimina una planificación
   * 
   * @param id - ID de la planificación a eliminar
   * @returns Observable vacío
   */
  eliminar(id: number): Observable<void> {
    const mutation = `
      mutation DeletePreMaquinaria($id: ID!) {
        deletePreMaquinaria(id: $id)
      }
    `;

    return this.graphql.mutate<{ deletePreMaquinaria: boolean }>(mutation, { id: id.toString() }).pipe(
      map(response => {
        if (!response.deletePreMaquinaria) {
          throw new Error('No se pudo eliminar la planificación');
        }
        return undefined as void;
      })
    );
  }

  /**
   * Obtiene planificaciones por producto
   * 
   * @param preProductoId - ID del pre-producto
   * @returns Observable con array de pre-maquinarias
   */
  obtenerPorProducto(preProductoId: number): Observable<PreMaquinaria[]> {
    const query = `
      query GetPreMaquinariasPorProducto($preProductoId: ID!) {
        getPreMaquinariasPorProducto(preProductoId: $preProductoId) {
          id
          cantidad
          descripcion
          tiempoEstimado
          maquinaria {
            id
            nombre
            estado
            descripcion
          }
          preProducto {
            id
            nombre
            descripcion
          }
        }
      }
    `;

    return this.graphql.query<{ getPreMaquinariasPorProducto: GraphQLPreMaquinaria[] }>(query, {
      preProductoId: preProductoId.toString()
    }).pipe(
      map(response => {
        return response.getPreMaquinariasPorProducto.map(preMaq => this.mapGraphQLToPreMaquinaria(preMaq));
      })
    );
  }

  /**
   * Obtiene planificaciones por maquinaria
   * 
   * @param maquinariaId - ID de la maquinaria
   * @returns Observable con array de pre-maquinarias
   */
  obtenerPorMaquinaria(maquinariaId: number): Observable<PreMaquinaria[]> {
    const query = `
      query GetPreMaquinariasPorMaquinaria($maquinariaId: ID!) {
        getPreMaquinariasPorMaquinaria(maquinariaId: $maquinariaId) {
          id
          cantidad
          descripcion
          tiempoEstimado
          maquinaria {
            id
            nombre
            estado
            descripcion
          }
          preProducto {
            id
            nombre
            descripcion
          }
        }
      }
    `;

    return this.graphql.query<{ getPreMaquinariasPorMaquinaria: GraphQLPreMaquinaria[] }>(query, {
      maquinariaId: maquinariaId.toString()
    }).pipe(
      map(response => {
        return response.getPreMaquinariasPorMaquinaria.map(preMaq => this.mapGraphQLToPreMaquinaria(preMaq));
      })
    );
  }

  /**
   * Obtiene maquinarias requeridas para un pre-producto
   * 
   * @param preProductoId - ID del pre-producto
   * @returns Observable con array de pre-maquinarias
   */
  getMaquinariasRequeridas(preProductoId: number): Observable<PreMaquinaria[]> {
    const query = `
      query GetMaquinariasRequeridas($preProductoId: ID!) {
        getMaquinariasRequeridas(preProductoId: $preProductoId) {
          id
          cantidad
          descripcion
          tiempoEstimado
          maquinaria {
            id
            nombre
            estado
            descripcion
          }
          preProducto {
            id
            nombre
            descripcion
          }
        }
      }
    `;

    return this.graphql.query<{ getMaquinariasRequeridas: GraphQLPreMaquinaria[] }>(query, {
      preProductoId: preProductoId.toString()
    }).pipe(
      map(response => {
        return response.getMaquinariasRequeridas.map(preMaq => this.mapGraphQLToPreMaquinaria(preMaq));
      })
    );
  }

  /**
   * Calcula el tiempo total estimado
   * 
   * ⚠️ NO DISPONIBLE DIRECTAMENTE EN GRAPHQL
   * Se puede usar calcularTiempoTotalEstimado del PreProductoService.
   * 
   * @param preProductoId - ID del pre-producto
   * @returns Observable con el tiempo total estimado
   */
  calcularTiempoTotal(preProductoId: number): Observable<{tiempoTotalEstimado: number}> {
    // Usar la query de PreProductoService
    return throwError(() => new Error(
      'calcularTiempoTotal no está disponible directamente en PreMaquinariaService. ' +
      'Usa PreProductoService.calcularTiempoProduccion() en su lugar.'
    ));
  }

  /**
   * Obtiene resumen de planificación
   * 
   * ⚠️ NO DISPONIBLE DIRECTAMENTE EN GRAPHQL
   * Se puede obtener las planificaciones y calcular el resumen en el cliente.
   * 
   * @param preProductoId - ID del pre-producto
   * @returns Observable con el resumen
   */
  obtenerResumen(preProductoId: number): Observable<any> {
    return throwError(() => new Error(
      'obtenerResumen no está disponible directamente en GraphQL. ' +
      'Obtén las planificaciones con obtenerPorProducto() y calcula el resumen en el cliente.'
    ));
  }

  /**
   * Busca planificaciones por descripción
   * 
   * ⚠️ NO DISPONIBLE DIRECTAMENTE EN GRAPHQL
   * Se puede obtener todas y filtrar en el cliente.
   * 
   * @param descripcion - Descripción a buscar
   * @returns Observable con array de pre-maquinarias
   */
  buscarPorDescripcion(descripcion: string): Observable<PreMaquinaria[]> {
    return this.obtenerTodas().pipe(
      map(planificaciones => {
        return planificaciones.filter(p => 
          p.descripcion?.toLowerCase().includes(descripcion.toLowerCase())
        );
      })
    );
  }

  /**
   * Verifica si existe una planificación
   * 
   * ⚠️ NO DISPONIBLE DIRECTAMENTE EN GRAPHQL
   * Se puede obtener las planificaciones del producto y verificar en el cliente.
   * 
   * @param preProductoId - ID del pre-producto
   * @param maquinariaId - ID de la maquinaria
   * @returns Observable con resultado de verificación
   */
  verificarPlanificacion(preProductoId: number, maquinariaId: number): Observable<{existe: boolean}> {
    return this.obtenerPorProducto(preProductoId).pipe(
      map(planificaciones => {
        const existe = planificaciones.some(p => p.maquinaria?.id === maquinariaId);
        return { existe };
      })
    );
  }

  /**
   * Duplica planificaciones
   * 
   * ⚠️ NO DISPONIBLE DIRECTAMENTE EN GRAPHQL
   * Se deben obtener las planificaciones del origen y crear nuevas para el destino.
   * 
   * @param preProductoOrigenId - ID del pre-producto origen
   * @param preProductoDestinoId - ID del pre-producto destino
   * @returns Observable con array de pre-maquinarias duplicadas
   */
  duplicarPlanificacion(preProductoOrigenId: number, preProductoDestinoId: number): Observable<PreMaquinaria[]> {
    return throwError(() => new Error(
      'duplicarPlanificacion no está disponible directamente en GraphQL. ' +
      'Obtén las planificaciones del origen y crea nuevas para el destino.'
    ));
  }

  /**
   * Obtiene estadísticas
   * 
   * ⚠️ NO DISPONIBLE DIRECTAMENTE EN GRAPHQL
   * Se pueden obtener todas las planificaciones y calcular estadísticas en el cliente.
   * 
   * @returns Observable con estadísticas
   */
  obtenerEstadisticas(): Observable<any> {
    return throwError(() => new Error(
      'obtenerEstadisticas no está disponible directamente en GraphQL. ' +
      'Obtén todas las planificaciones y calcula las estadísticas en el cliente.'
    ));
  }

  /**
   * Crea planificaciones rápidas
   * 
   * ⚠️ NO DISPONIBLE DIRECTAMENTE EN GRAPHQL
   * Se deben crear las planificaciones una por una.
   * 
   * @param preProductoId - ID del pre-producto
   * @param planificaciones - Array de planificaciones a crear
   * @returns Observable con array de pre-maquinarias creadas
   */
  crearPlanificacionRapida(preProductoId: number, planificaciones: PreMaquinariaDTO[]): Observable<PreMaquinaria[]> {
    return throwError(() => new Error(
      'crearPlanificacionRapida no está disponible directamente en GraphQL. ' +
      'Crea las planificaciones una por una usando el método crear().'
    ));
  }

  /**
   * Elimina todas las planificaciones de un producto
   * 
   * ⚠️ NO DISPONIBLE DIRECTAMENTE EN GRAPHQL
   * Se deben obtener las planificaciones y eliminarlas una por una.
   * 
   * @param preProductoId - ID del pre-producto
   * @returns Observable vacío
   */
  eliminarPlanificacionesProducto(preProductoId: number): Observable<void> {
    return throwError(() => new Error(
      'eliminarPlanificacionesProducto no está disponible directamente en GraphQL. ' +
      'Obtén las planificaciones con obtenerPorProducto() y elimínalas una por una.'
    ));
  }

  /**
   * Mapea una pre-maquinaria de GraphQL al formato esperado por los componentes
   * 
   * @param graphqlPreMaquinaria - Pre-maquinaria en formato GraphQL
   * @returns Pre-maquinaria en formato TypeScript
   */
  private mapGraphQLToPreMaquinaria(graphqlPreMaquinaria: GraphQLPreMaquinaria): PreMaquinaria {
    // Asegurar que maquinaria exista, usar valores por defecto si no
    const maquinaria: Maquinaria = graphqlPreMaquinaria.maquinaria ? {
      id: parseInt(graphqlPreMaquinaria.maquinaria.id, 10),
      nombre: graphqlPreMaquinaria.maquinaria.nombre,
      estado: graphqlPreMaquinaria.maquinaria.estado
    } : {
      id: 0,
      nombre: 'Desconocida',
      estado: 'desconocido'
    };

    return {
      id: parseInt(graphqlPreMaquinaria.id, 10),
      cantidad: graphqlPreMaquinaria.cantidad || 0,
      descripcion: graphqlPreMaquinaria.descripcion || '',
      tiempoEstimado: graphqlPreMaquinaria.tiempoEstimado || '',
      maquinaria,
      preProducto: graphqlPreMaquinaria.preProducto ? {
        id: parseInt(graphqlPreMaquinaria.preProducto.id, 10),
        nombre: graphqlPreMaquinaria.preProducto.nombre,
        descripcion: graphqlPreMaquinaria.preProducto.descripcion || ''
      } : undefined
    };
  }
}