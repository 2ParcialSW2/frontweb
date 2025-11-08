import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { GraphQLService } from './graphql.service';
import { PreProducto, PreProductoDTO } from '../models/preProducto.model';

/**
 * Interfaz para la respuesta GraphQL de PreProducto
 */
interface GraphQLPreProducto {
  id: string;
  nombre: string;
  descripcion?: string | null;
  stock: number;
  tiempo: string;
  url_Image?: string | null;
}

/**
 * Servicio para gestionar pre-productos usando GraphQL
 * 
 * Migrado de REST a GraphQL manteniendo la misma interfaz pública
 * para compatibilidad con componentes existentes.
 */
@Injectable({
  providedIn: 'root'
})
export class PreProductoService {
  constructor(private graphql: GraphQLService) {}

  /**
   * Obtiene todos los pre-productos
   * 
   * @returns Observable con array de pre-productos
   */
  obtenerTodos(): Observable<PreProducto[]> {
    const query = `
      query {
        getAllPreProductos {
          id
          nombre
          descripcion
          stock
          tiempo
          url_Image
        }
      }
    `;

    return this.graphql.query<{ getAllPreProductos: GraphQLPreProducto[] }>(query).pipe(
      map(response => {
        return response.getAllPreProductos.map(preProd => this.mapGraphQLToPreProducto(preProd));
      })
    );
  }

  /**
   * Obtiene un pre-producto por su ID
   * 
   * @param id - ID del pre-producto
   * @returns Observable con el pre-producto
   */
  obtenerPorId(id: number): Observable<PreProducto> {
    const query = `
      query GetPreProducto($id: ID!) {
        getPreProductoById(id: $id) {
          id
          nombre
          descripcion
          stock
          tiempo
          url_Image
        }
      }
    `;

    return this.graphql.query<{ getPreProductoById: GraphQLPreProducto }>(query, { id: id.toString() }).pipe(
      map(response => this.mapGraphQLToPreProducto(response.getPreProductoById))
    );
  }

  /**
   * Crea un nuevo pre-producto
   * 
   * @param preProducto - Datos del pre-producto a crear
   * @returns Observable con el pre-producto creado
   */
  crear(preProducto: PreProductoDTO): Observable<PreProducto> {
    const mutation = `
      mutation CreatePreProducto($input: PreProductoInput!) {
        createPreProducto(input: $input) {
          id
          nombre
          descripcion
          stock
          tiempo
          url_Image
        }
      }
    `;

    const input = {
      nombre: preProducto.nombre,
      descripcion: preProducto.descripcion || null,
      stock: preProducto.stock || 0,
      tiempo: preProducto.tiempo || '',
      url_Image: preProducto.url_Image || null
    };

    return this.graphql.mutate<{ createPreProducto: GraphQLPreProducto }>(mutation, { input }).pipe(
      map(response => this.mapGraphQLToPreProducto(response.createPreProducto))
    );
  }

  /**
   * Actualiza un pre-producto existente
   * 
   * @param id - ID del pre-producto a actualizar
   * @param preProducto - Datos actualizados del pre-producto
   * @returns Observable con el pre-producto actualizado
   */
  actualizar(id: number, preProducto: PreProductoDTO): Observable<PreProducto> {
    const mutation = `
      mutation UpdatePreProducto($id: ID!, $input: PreProductoInput!) {
        updatePreProducto(id: $id, input: $input) {
          id
          nombre
          descripcion
          stock
          tiempo
          url_Image
        }
      }
    `;

    const input = {
      nombre: preProducto.nombre,
      descripcion: preProducto.descripcion || null,
      stock: preProducto.stock || 0,
      tiempo: preProducto.tiempo || '',
      url_Image: preProducto.url_Image || null
    };

    return this.graphql.mutate<{ updatePreProducto: GraphQLPreProducto }>(mutation, {
      id: id.toString(),
      input
    }).pipe(
      map(response => this.mapGraphQLToPreProducto(response.updatePreProducto))
    );
  }

  /**
   * Elimina un pre-producto
   * 
   * @param id - ID del pre-producto a eliminar
   * @returns Observable vacío
   */
  eliminar(id: number): Observable<void> {
    const mutation = `
      mutation DeletePreProducto($id: ID!) {
        deletePreProducto(id: $id)
      }
    `;

    return this.graphql.mutate<{ deletePreProducto: boolean }>(mutation, { id: id.toString() }).pipe(
      map(response => {
        if (!response.deletePreProducto) {
          throw new Error('No se pudo eliminar el pre-producto');
        }
        return undefined as void;
      })
    );
  }

  /**
   * Obtiene un pre-producto con sus planificaciones
   * 
   * ⚠️ NO DISPONIBLE DIRECTAMENTE EN GRAPHQL
   * Se obtiene el pre-producto y luego sus planificaciones.
   * 
   * @param id - ID del pre-producto
   * @returns Observable con el pre-producto y sus planificaciones
   */
  obtenerConPlanificaciones(id: number): Observable<any> {
    return this.obtenerPorId(id).pipe(
      switchMap(preProducto => {
        // Obtener planificaciones de planos y maquinarias
        // Por ahora, retornar estructura básica
        return throwError(() => new Error(
          'obtenerConPlanificaciones no está disponible directamente en GraphQL. ' +
          'Usa obtenerPlanificaciones() para obtener las planificaciones por separado.'
        ));
      })
    );
  }

  /**
   * Obtiene las planificaciones de un pre-producto
   * 
   * ⚠️ NO DISPONIBLE DIRECTAMENTE EN GRAPHQL
   * Se pueden obtener planos y maquinarias por separado.
   * 
   * @param id - ID del pre-producto
   * @returns Observable con array de planificaciones
   */
  obtenerPlanificaciones(id: number): Observable<any[]> {
    // Se pueden obtener planos y maquinarias por separado
    // Por ahora, retornar array vacío con mensaje
    return throwError(() => new Error(
      'obtenerPlanificaciones no está disponible directamente en GraphQL. ' +
      'Usa PrePlanoService.getPrePlanosPorPreProducto() y ' +
      'PreMaquinariaService.getPreMaquinariasPorProducto() para obtener las planificaciones.'
    ));
  }

  /**
   * Calcula el tiempo de producción de un pre-producto
   * 
   * @param id - ID del pre-producto
   * @returns Observable con el tiempo de producción
   */
  calcularTiempoProduccion(id: number): Observable<any> {
    const query = `
      query CalcularTiempoTotalEstimado($preProductoId: ID!) {
        calcularTiempoTotalEstimado(preProductoId: $preProductoId)
      }
    `;

    return this.graphql.query<{ calcularTiempoTotalEstimado: number }>(query, {
      preProductoId: id.toString()
    }).pipe(
      map(response => ({
        tiempoTotal: response.calcularTiempoTotalEstimado,
        tiempoTotalEstimado: response.calcularTiempoTotalEstimado
      }))
    );
  }

  /**
   * Verifica si la planificación de un pre-producto está completa
   * 
   * ⚠️ NO DISPONIBLE DIRECTAMENTE EN GRAPHQL
   * Se puede verificar obteniendo las planificaciones y validando en el cliente.
   * 
   * @param id - ID del pre-producto
   * @returns Observable con resultado de verificación
   */
  verificarPlanificacionCompleta(id: number): Observable<any> {
    return throwError(() => new Error(
      'verificarPlanificacionCompleta no está disponible directamente en GraphQL. ' +
      'Obtén las planificaciones y valida en el cliente.'
    ));
  }

  /**
   * Mapea un pre-producto de GraphQL al formato esperado por los componentes
   * 
   * @param graphqlPreProducto - Pre-producto en formato GraphQL
   * @returns Pre-producto en formato TypeScript
   */
  private mapGraphQLToPreProducto(graphqlPreProducto: GraphQLPreProducto): PreProducto {
    return {
      id: parseInt(graphqlPreProducto.id, 10),
      nombre: graphqlPreProducto.nombre,
      descripcion: graphqlPreProducto.descripcion || '',
      stock: graphqlPreProducto.stock,
      tiempo: graphqlPreProducto.tiempo,
      url_Image: graphqlPreProducto.url_Image || ''
    };
  }
}