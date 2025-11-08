import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { GraphQLService } from './graphql.service';
import { MetodoPago, MetodoPagoDTO } from '../models/pedido.model';

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

/**
 * Interfaz para la respuesta GraphQL de MetodoPago
 */
interface GraphQLMetodoPago {
  id: string;
  nombre?: string | null;
  descripcion?: string | null;
}

/**
 * Servicio para gestionar métodos de pago usando GraphQL
 * 
 * Migrado de REST a GraphQL manteniendo la misma interfaz pública
 * para compatibilidad con componentes existentes.
 */
@Injectable({
  providedIn: 'root'
})
export class MetodoPagoService {
  constructor(private graphql: GraphQLService) {}

  /**
   * Obtiene todos los métodos de pago
   * 
   * @returns Observable con respuesta API conteniendo array de métodos de pago
   */
  listarMetodosPago(): Observable<ApiResponse<MetodoPago[]>> {
    const query = `
      query {
        getAllMetodosPago {
          id
          nombre
          descripcion
        }
      }
    `;

    return this.graphql.query<{ getAllMetodosPago: GraphQLMetodoPago[] }>(query).pipe(
      map(response => {
        const metodos = response.getAllMetodosPago.map(metodo => this.mapGraphQLToMetodoPago(metodo));
        return {
          statusCode: 200,
          message: 'Métodos de pago obtenidos exitosamente',
          data: metodos
        };
      })
    );
  }

  /**
   * Obtiene un método de pago por ID
   * 
   * @param id - ID del método de pago
   * @returns Observable con respuesta API conteniendo el método de pago
   */
  obtenerMetodoPago(id: number): Observable<ApiResponse<MetodoPago>> {
    const query = `
      query GetMetodoPago($id: ID!) {
        getMetodoPagoById(id: $id) {
          id
          nombre
          descripcion
        }
      }
    `;

    return this.graphql.query<{ getMetodoPagoById: GraphQLMetodoPago }>(query, { id: id.toString() }).pipe(
      map(response => ({
        statusCode: 200,
        message: 'Método de pago obtenido exitosamente',
        data: this.mapGraphQLToMetodoPago(response.getMetodoPagoById)
      }))
    );
  }

  /**
   * Crea un nuevo método de pago
   * 
   * @param metodoPagoDTO - Datos del método de pago a crear
   * @returns Observable con respuesta API conteniendo el método de pago creado
   */
  crearMetodoPago(metodoPagoDTO: MetodoPagoDTO): Observable<ApiResponse<MetodoPago>> {
    const mutation = `
      mutation CreateMetodoPago($input: MetodoPagoInput!) {
        createMetodoPago(input: $input) {
          id
          nombre
          descripcion
        }
      }
    `;

    const input = {
      nombre: metodoPagoDTO.nombre,
      descripcion: metodoPagoDTO.descripcion || null
    };

    return this.graphql.mutate<{ createMetodoPago: GraphQLMetodoPago }>(mutation, { input }).pipe(
      map(response => ({
        statusCode: 201,
        message: 'Método de pago creado exitosamente',
        data: this.mapGraphQLToMetodoPago(response.createMetodoPago)
      }))
    );
  }

  /**
   * Actualiza un método de pago existente
   * 
   * @param id - ID del método de pago a actualizar
   * @param metodoPagoDTO - Datos actualizados del método de pago
   * @returns Observable con respuesta API conteniendo el método de pago actualizado
   */
  actualizarMetodoPago(id: number, metodoPagoDTO: MetodoPagoDTO): Observable<ApiResponse<MetodoPago>> {
    const mutation = `
      mutation UpdateMetodoPago($id: ID!, $input: MetodoPagoInput!) {
        updateMetodoPago(id: $id, input: $input) {
          id
          nombre
          descripcion
        }
      }
    `;

    const input = {
      nombre: metodoPagoDTO.nombre,
      descripcion: metodoPagoDTO.descripcion || null
    };

    return this.graphql.mutate<{ updateMetodoPago: GraphQLMetodoPago }>(mutation, {
      id: id.toString(),
      input
    }).pipe(
      map(response => ({
        statusCode: 200,
        message: 'Método de pago actualizado exitosamente',
        data: this.mapGraphQLToMetodoPago(response.updateMetodoPago)
      }))
    );
  }

  /**
   * Elimina un método de pago
   * 
   * @param id - ID del método de pago a eliminar
   * @returns Observable con respuesta API
   */
  eliminarMetodoPago(id: number): Observable<ApiResponse<void>> {
    const mutation = `
      mutation DeleteMetodoPago($id: ID!) {
        deleteMetodoPago(id: $id)
      }
    `;

    return this.graphql.mutate<{ deleteMetodoPago: boolean }>(mutation, { id: id.toString() }).pipe(
      map(response => {
        if (!response.deleteMetodoPago) {
          throw new Error('No se pudo eliminar el método de pago');
        }
        return {
          statusCode: 200,
          message: 'Método de pago eliminado exitosamente',
          data: undefined as void
        };
      })
    );
  }

  /**
   * Busca un método de pago por nombre
   * 
   * @param nombre - Nombre del método de pago
   * @returns Observable con respuesta API conteniendo el método de pago
   */
  buscarPorNombre(nombre: string): Observable<ApiResponse<MetodoPago>> {
    const query = `
      query GetMetodoPagoByNombre($nombre: String!) {
        getMetodoPagoByNombre(nombre: $nombre) {
          id
          nombre
          descripcion
        }
      }
    `;

    return this.graphql.query<{ getMetodoPagoByNombre: GraphQLMetodoPago }>(query, { nombre }).pipe(
      map(response => ({
        statusCode: 200,
        message: 'Método de pago encontrado exitosamente',
        data: this.mapGraphQLToMetodoPago(response.getMetodoPagoByNombre)
      }))
    );
  }

  /**
   * Verifica si un método de pago existe
   * 
   * ⚠️ NO DISPONIBLE DIRECTAMENTE EN GRAPHQL
   * Se puede verificar intentando obtener el método de pago por ID.
   * 
   * @param id - ID del método de pago
   * @returns Observable con respuesta API conteniendo boolean
   */
  verificarMetodoPago(id: number): Observable<ApiResponse<boolean>> {
    return this.obtenerMetodoPago(id).pipe(
      map(() => ({
        statusCode: 200,
        message: 'Método de pago verificado',
        data: true
      })),
      catchError(() => of({
        statusCode: 404,
        message: 'Método de pago no encontrado',
        data: false
      }))
    );
  }

  /**
   * Mapea un método de pago de GraphQL al formato esperado por los componentes
   * 
   * @param graphqlMetodoPago - Método de pago en formato GraphQL
   * @returns Método de pago en formato TypeScript
   */
  private mapGraphQLToMetodoPago(graphqlMetodoPago: GraphQLMetodoPago): MetodoPago {
    return {
      id: parseInt(graphqlMetodoPago.id, 10),
      nombre: graphqlMetodoPago.nombre || '',
      descripcion: graphqlMetodoPago.descripcion || ''
    };
  }
}
