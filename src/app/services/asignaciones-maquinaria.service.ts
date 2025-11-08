import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { GraphQLService } from './graphql.service';
import { 
  MaquinariaCarpintero, 
  MaquinariaCarpinteroDTO,
  ResumenCarpintero
} from '../models/maquinaria.model';

/**
 * Interfaz para la respuesta GraphQL de asignaciones maquinaria-carpintero
 */
interface GraphQLMaquinariaCarpintero {
  id: string;
  estado: string;
  maquinaria?: {
    id: string;
    nombre: string;
    estado: string;
    descripcion: string;
  } | null;
  carpintero?: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
  } | null;
}

/**
 * Servicio para gestionar asignaciones maquinaria-carpintero usando GraphQL
 * 
 * Migrado de REST a GraphQL manteniendo la misma interfaz pública
 * para compatibilidad con componentes existentes.
 */
@Injectable({
  providedIn: 'root'
})
export class AsignacionesMaquinariaService {
  constructor(private graphql: GraphQLService) {}

  /**
   * Obtiene todas las asignaciones
   * 
   * @returns Observable con array de asignaciones
   */
  getAllAsignaciones(): Observable<MaquinariaCarpintero[]> {
    const query = `
      query {
        getAllAsignacionesMaquinaria {
          id
          estado
          maquinaria {
            id
            nombre
            estado
            descripcion
          }
          carpintero {
            id
            nombre
            apellido
            email
          }
        }
      }
    `;

    return this.graphql.query<{ getAllAsignacionesMaquinaria: GraphQLMaquinariaCarpintero[] }>(query).pipe(
      map(response => {
        return response.getAllAsignacionesMaquinaria.map(asig => this.mapGraphQLToMaquinariaCarpintero(asig));
      })
    );
  }

  /**
   * Asigna un carpintero a una maquinaria
   * 
   * @param maquinariaId - ID de la maquinaria
   * @param carpinteroId - ID del carpintero
   * @param estado - Estado de la asignación (opcional, por defecto 'en_uso')
   * @returns Observable con la asignación creada
   */
  asignarCarpinteroAMaquinaria(
    maquinariaId: number, 
    carpinteroId: number, 
    estado: string = 'en_uso'
  ): Observable<MaquinariaCarpintero> {
    const mutation = `
      mutation AsignarCarpinteroAMaquinaria($maquinariaId: ID!, $carpinteroId: ID!, $estado: String) {
        asignarCarpinteroAMaquinaria(maquinariaId: $maquinariaId, carpinteroId: $carpinteroId, estado: $estado) {
          id
          estado
          maquinaria {
            id
            nombre
            estado
            descripcion
          }
          carpintero {
            id
            nombre
            apellido
            email
          }
        }
      }
    `;

    return this.graphql.mutate<{ asignarCarpinteroAMaquinaria: GraphQLMaquinariaCarpintero }>(mutation, {
      maquinariaId: maquinariaId.toString(),
      carpinteroId: carpinteroId.toString(),
      estado: estado || null
    }).pipe(
      map(response => this.mapGraphQLToMaquinariaCarpintero(response.asignarCarpinteroAMaquinaria))
    );
  }

  /**
   * Libera una maquinaria
   * 
   * @param maquinariaId - ID de la maquinaria
   * @returns Observable con la asignación actualizada
   */
  liberarMaquinaria(maquinariaId: number): Observable<MaquinariaCarpintero> {
    const mutation = `
      mutation LiberarMaquinaria($maquinariaId: ID!) {
        liberarMaquinaria(maquinariaId: $maquinariaId) {
          id
          estado
          maquinaria {
            id
            nombre
            estado
            descripcion
          }
          carpintero {
            id
            nombre
            apellido
            email
          }
        }
      }
    `;

    return this.graphql.mutate<{ liberarMaquinaria: GraphQLMaquinariaCarpintero }>(mutation, {
      maquinariaId: maquinariaId.toString()
    }).pipe(
      map(response => this.mapGraphQLToMaquinariaCarpintero(response.liberarMaquinaria))
    );
  }

  /**
   * Cambia el estado de una asignación
   * 
   * @param asignacionId - ID de la asignación
   * @param nuevoEstado - Nuevo estado
   * @returns Observable con la asignación actualizada
   */
  cambiarEstadoAsignacion(asignacionId: number, nuevoEstado: string): Observable<MaquinariaCarpintero> {
    const mutation = `
      mutation CambiarEstadoAsignacion($asignacionId: ID!, $nuevoEstado: String!) {
        cambiarEstadoAsignacion(asignacionId: $asignacionId, nuevoEstado: $nuevoEstado) {
          id
          estado
          maquinaria {
            id
            nombre
            estado
            descripcion
          }
          carpintero {
            id
            nombre
            apellido
            email
          }
        }
      }
    `;

    return this.graphql.mutate<{ cambiarEstadoAsignacion: GraphQLMaquinariaCarpintero }>(mutation, {
      asignacionId: asignacionId.toString(),
      nuevoEstado
    }).pipe(
      map(response => this.mapGraphQLToMaquinariaCarpintero(response.cambiarEstadoAsignacion))
    );
  }

  /**
   * Obtiene asignaciones por maquinaria
   * 
   * @param maquinariaId - ID de la maquinaria
   * @returns Observable con array de asignaciones
   */
  getAsignacionesPorMaquinaria(maquinariaId: number): Observable<MaquinariaCarpintero[]> {
    const query = `
      query GetAsignacionesPorMaquinaria($maquinariaId: ID!) {
        getAsignacionesPorMaquinaria(maquinariaId: $maquinariaId) {
          id
          estado
          maquinaria {
            id
            nombre
            estado
            descripcion
          }
          carpintero {
            id
            nombre
            apellido
            email
          }
        }
      }
    `;

    return this.graphql.query<{ getAsignacionesPorMaquinaria: GraphQLMaquinariaCarpintero[] }>(query, {
      maquinariaId: maquinariaId.toString()
    }).pipe(
      map(response => {
        return response.getAsignacionesPorMaquinaria.map(asig => this.mapGraphQLToMaquinariaCarpintero(asig));
      })
    );
  }

  /**
   * Obtiene asignaciones por carpintero
   * 
   * @param carpinteroId - ID del carpintero
   * @returns Observable con array de asignaciones
   */
  getAsignacionesPorCarpintero(carpinteroId: number): Observable<MaquinariaCarpintero[]> {
    const query = `
      query GetAsignacionesPorCarpintero($carpinteroId: ID!) {
        getAsignacionesPorCarpintero(carpinteroId: $carpinteroId) {
          id
          estado
          maquinaria {
            id
            nombre
            estado
            descripcion
          }
          carpintero {
            id
            nombre
            apellido
            email
          }
        }
      }
    `;

    return this.graphql.query<{ getAsignacionesPorCarpintero: GraphQLMaquinariaCarpintero[] }>(query, {
      carpinteroId: carpinteroId.toString()
    }).pipe(
      map(response => {
        return response.getAsignacionesPorCarpintero.map(asig => this.mapGraphQLToMaquinariaCarpintero(asig));
      })
    );
  }

  /**
   * Obtiene maquinarias en uso por carpintero
   * 
   * @param carpinteroId - ID del carpintero
   * @returns Observable con array de asignaciones
   */
  getMaquinariasEnUsoPorCarpintero(carpinteroId: number): Observable<MaquinariaCarpintero[]> {
    const query = `
      query GetMaquinariasEnUsoPorCarpintero($carpinteroId: ID!) {
        getMaquinariasEnUsoPorCarpintero(carpinteroId: $carpinteroId) {
          id
          estado
          maquinaria {
            id
            nombre
            estado
            descripcion
          }
          carpintero {
            id
            nombre
            apellido
            email
          }
        }
      }
    `;

    return this.graphql.query<{ getMaquinariasEnUsoPorCarpintero: GraphQLMaquinariaCarpintero[] }>(query, {
      carpinteroId: carpinteroId.toString()
    }).pipe(
      map(response => {
        return response.getMaquinariasEnUsoPorCarpintero.map(asig => this.mapGraphQLToMaquinariaCarpintero(asig));
      })
    );
  }

  /**
   * Obtiene asignaciones por estado
   * 
   * @param estado - Estado de la asignación
   * @returns Observable con array de asignaciones
   */
  getAsignacionesPorEstado(estado: string): Observable<MaquinariaCarpintero[]> {
    const query = `
      query GetAsignacionesPorEstado($estado: String!) {
        getAsignacionesPorEstado(estado: $estado) {
          id
          estado
          maquinaria {
            id
            nombre
            estado
            descripcion
          }
          carpintero {
            id
            nombre
            apellido
            email
          }
        }
      }
    `;

    return this.graphql.query<{ getAsignacionesPorEstado: GraphQLMaquinariaCarpintero[] }>(query, { estado }).pipe(
      map(response => {
        return response.getAsignacionesPorEstado.map(asig => this.mapGraphQLToMaquinariaCarpintero(asig));
      })
    );
  }

  /**
   * Verifica la disponibilidad de una maquinaria
   * 
   * @param maquinariaId - ID de la maquinaria
   * @returns Observable con resultado de disponibilidad
   */
  verificarDisponibilidad(maquinariaId: number): Observable<{ disponible: boolean }> {
    const query = `
      query VerificarDisponibilidadMaquinaria($maquinariaId: ID!) {
        verificarDisponibilidadMaquinaria(maquinariaId: $maquinariaId)
      }
    `;

    return this.graphql.query<{ verificarDisponibilidadMaquinaria: boolean }>(query, {
      maquinariaId: maquinariaId.toString()
    }).pipe(
      map(response => ({
        disponible: response.verificarDisponibilidadMaquinaria
      }))
    );
  }

  /**
   * Actualiza una asignación completa
   * 
   * @param asignacionId - ID de la asignación
   * @param dto - Datos actualizados de la asignación
   * @returns Observable con la asignación actualizada
   */
  actualizarAsignacion(asignacionId: number, dto: MaquinariaCarpinteroDTO): Observable<MaquinariaCarpintero> {
    const mutation = `
      mutation ActualizarAsignacion($asignacionId: ID!, $input: MaquinariaCarpinteroInput!) {
        actualizarAsignacion(asignacionId: $asignacionId, input: $input) {
          id
          estado
          maquinaria {
            id
            nombre
            estado
            descripcion
          }
          carpintero {
            id
            nombre
            apellido
            email
          }
        }
      }
    `;

    const input = {
      estado: dto.estado || null,
      maquinariaId: dto.maquinariaId.toString(),
      carpinteroId: dto.carpinteroId.toString()
    };

    return this.graphql.mutate<{ actualizarAsignacion: GraphQLMaquinariaCarpintero }>(mutation, {
      asignacionId: asignacionId.toString(),
      input
    }).pipe(
      map(response => this.mapGraphQLToMaquinariaCarpintero(response.actualizarAsignacion))
    );
  }

  /**
   * Elimina una asignación
   * 
   * @param asignacionId - ID de la asignación
   * @returns Observable vacío
   */
  eliminarAsignacion(asignacionId: number): Observable<void> {
    const mutation = `
      mutation EliminarAsignacion($asignacionId: ID!) {
        eliminarAsignacion(asignacionId: $asignacionId)
      }
    `;

    return this.graphql.mutate<{ eliminarAsignacion: boolean }>(mutation, { asignacionId: asignacionId.toString() }).pipe(
      map(response => {
        if (!response.eliminarAsignacion) {
          throw new Error('No se pudo eliminar la asignación');
        }
        return undefined as void;
      })
    );
  }

  /**
   * Obtiene información completa de una maquinaria
   * 
   * ⚠️ NO DISPONIBLE DIRECTAMENTE EN GRAPHQL
   * Se combinan múltiples queries para obtener la información.
   * 
   * @param maquinariaId - ID de la maquinaria
   * @returns Observable con información completa
   */
  getInfoCompletaMaquinaria(maquinariaId: number): Observable<{
    asignaciones: MaquinariaCarpintero[];
    disponible: boolean;
    totalAsignaciones: number;
  }> {
    // Combinar queries para obtener información completa
    return this.getAsignacionesPorMaquinaria(maquinariaId).pipe(
      switchMap(asignaciones => {
        return this.verificarDisponibilidad(maquinariaId).pipe(
          map(disponibilidad => ({
            asignaciones,
            disponible: disponibilidad.disponible,
            totalAsignaciones: asignaciones.length
          }))
        );
      })
    );
  }

  /**
   * Obtiene resumen por carpintero
   * 
   * ⚠️ NO DISPONIBLE DIRECTAMENTE EN GRAPHQL
   * Se obtienen las asignaciones y se calcula el resumen en el cliente.
   * 
   * @param carpinteroId - ID del carpintero
   * @returns Observable con resumen del carpintero
   */
  getResumenCarpintero(carpinteroId: number): Observable<ResumenCarpintero> {
    // Obtener asignaciones y calcular resumen
    return this.getAsignacionesPorCarpintero(carpinteroId).pipe(
      map(asignaciones => {
        const enUso = asignaciones.filter(a => a.estado === 'en_uso');
        const total = asignaciones.length;
        
        return {
          todasAsignaciones: asignaciones,
          maquinariasEnUso: enUso,
          totalMaquinariasEnUso: enUso.length,
          totalAsignaciones: total
        };
      })
    );
  }

  /**
   * Mapea una asignación de GraphQL al formato esperado por los componentes
   * 
   * @param graphqlAsignacion - Asignación en formato GraphQL
   * @returns Asignación en formato TypeScript
   */
  private mapGraphQLToMaquinariaCarpintero(graphqlAsignacion: GraphQLMaquinariaCarpintero): MaquinariaCarpintero {
    // Asegurar que maquinaria y carpintero existan, usar valores por defecto si no
    const maquinaria = graphqlAsignacion.maquinaria ? {
      id: parseInt(graphqlAsignacion.maquinaria.id, 10),
      nombre: graphqlAsignacion.maquinaria.nombre,
      estado: graphqlAsignacion.maquinaria.estado,
      descripcion: graphqlAsignacion.maquinaria.descripcion
    } : {
      id: 0,
      nombre: 'Desconocida',
      estado: 'desconocido',
      descripcion: ''
    };

    const carpintero = graphqlAsignacion.carpintero ? {
      id: parseInt(graphqlAsignacion.carpintero.id, 10),
      nombre_completo: `${graphqlAsignacion.carpintero.nombre} ${graphqlAsignacion.carpintero.apellido}`,
      email: graphqlAsignacion.carpintero.email,
      telefono: '',
      direccion: '',
      estado: true,
      rol: {
        id: 0,
        nombre: ''
      }
    } : {
      id: 0,
      nombre_completo: 'Desconocido',
      email: '',
      telefono: '',
      direccion: '',
      estado: false,
      rol: {
        id: 0,
        nombre: ''
      }
    };

    return {
      id: parseInt(graphqlAsignacion.id, 10),
      estado: graphqlAsignacion.estado,
      maquinaria,
      carpintero
    };
  }
}