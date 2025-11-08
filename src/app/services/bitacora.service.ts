import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GraphQLService } from './graphql.service';
import { Bitacora } from '../models/bitacora.model';

/**
 * Interfaz para la respuesta GraphQL de Bitacora
 */
interface GraphQLBitacora {
  id: string;
  accion: string;
  detalles?: string | null;
  fecha: string;
  direccionIp?: string | null;
  usuario?: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
  } | null;
}

/**
 * Servicio para gestionar bitácoras usando GraphQL
 * 
 * Migrado de REST a GraphQL manteniendo la misma interfaz pública
 * para compatibilidad con componentes existentes.
 */
@Injectable({
  providedIn: 'root'
})
export class BitacoraService {
  constructor(private graphql: GraphQLService) {}

  /**
   * Obtiene todos los eventos de la bitácora
   * 
   * @returns Observable con array de bitácoras
   */
  getBitacoras(): Observable<Bitacora[]> {
    const query = `
      query {
        getAllBitacoras {
          id
          accion
          detalles
          fecha
          direccionIp
          usuario {
            id
            nombre
            apellido
            email
          }
        }
      }
    `;

    return this.graphql.query<{ getAllBitacoras: GraphQLBitacora[] }>(query).pipe(
      map(response => {
        return response.getAllBitacoras.map(bitacora => this.mapGraphQLToBitacora(bitacora));
      })
    );
  }

  /**
   * Obtiene un evento de la bitácora por su ID
   * 
   * ⚠️ NO DISPONIBLE DIRECTAMENTE EN GRAPHQL
   * Se puede obtener todas las bitácoras y filtrar por ID.
   * 
   * @param id - ID de la bitácora
   * @returns Observable con la bitácora
   */
  getBitacoraById(id: number): Observable<Bitacora> {
    return this.getBitacoras().pipe(
      map(bitacoras => {
        const bitacora = bitacoras.find(b => b.id === id);
        if (!bitacora) {
          throw new Error(`Bitácora con ID ${id} no encontrada`);
        }
        return bitacora;
      })
    );
  }

  /**
   * Mapea una bitácora de GraphQL al formato esperado por los componentes
   * 
   * @param graphqlBitacora - Bitácora en formato GraphQL
   * @returns Bitácora en formato TypeScript
   */
  private mapGraphQLToBitacora(graphqlBitacora: GraphQLBitacora): Bitacora {
    return {
      id: parseInt(graphqlBitacora.id, 10),
      accion: graphqlBitacora.accion,
      detalles: graphqlBitacora.detalles || '',
      fecha: new Date(graphqlBitacora.fecha),
      direccionIp: graphqlBitacora.direccionIp || '',
      nombreUsuario: graphqlBitacora.usuario 
        ? `${graphqlBitacora.usuario.nombre} ${graphqlBitacora.usuario.apellido}` 
        : ''
    };
  }
}
