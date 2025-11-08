import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap, switchMap } from 'rxjs/operators';
import { GraphQLService } from './graphql.service';

/**
 * Interfaz para la respuesta GraphQL de proveedores
 */
interface GraphQLProveedor {
  id: string;
  nombre: string;
  ruc?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
  personaContacto?: string | null;
  activo: boolean;
}

/**
 * Servicio para gestionar proveedores usando GraphQL
 * 
 * Migrado de REST a GraphQL manteniendo la misma interfaz pública
 * para compatibilidad con componentes existentes.
 */
@Injectable({
  providedIn: 'root'
})
export class ProveedoresService {
  constructor(private graphql: GraphQLService) {
    console.log('ProveedoresService inicializado con GraphQL');
  }

  /**
   * Obtiene todos los proveedores
   * 
   * @returns Observable con array de proveedores
   */
  getProveedores(): Observable<any[]> {
    const query = `
      query {
        getAllProveedores {
          id
          nombre
          ruc
          direccion
          telefono
          email
          personaContacto
          activo
        }
      }
    `;

    return this.graphql.query<{ getAllProveedores: GraphQLProveedor[] }>(query).pipe(
      tap(response => console.log('Respuesta completa de proveedores:', response)),
      map(response => {
        return response.getAllProveedores.map(proveedor => this.mapGraphQLToProveedor(proveedor));
      })
    );
  }

  /**
   * Obtiene un proveedor por su ID
   * 
   * @param id - ID del proveedor
   * @returns Observable con el proveedor
   */
  getProveedor(id: number): Observable<any> {
    const query = `
      query GetProveedor($id: ID!) {
        getProveedorById(id: $id) {
          id
          nombre
          ruc
          direccion
          telefono
          email
          personaContacto
          activo
        }
      }
    `;

    return this.graphql.query<{ getProveedorById: GraphQLProveedor }>(query, { id: id.toString() }).pipe(
      map(response => this.mapGraphQLToProveedor(response.getProveedorById))
    );
  }

  /**
   * Crea un nuevo proveedor
   * 
   * @param proveedor - Datos del proveedor a crear
   * @returns Observable con el proveedor creado
   */
  createProveedor(proveedor: any): Observable<any> {
    const mutation = `
      mutation CreateProveedor($input: ProveedorInput!) {
        createProveedor(input: $input) {
          id
          nombre
          ruc
          direccion
          telefono
          email
          personaContacto
          activo
        }
      }
    `;

    const input = {
      nombre: proveedor.nombre,
      ruc: proveedor.ruc || null,
      direccion: proveedor.direccion || null,
      telefono: proveedor.telefono || null,
      email: proveedor.email || null,
      personaContacto: proveedor.personaContacto || null,
      activo: proveedor.activo !== undefined ? proveedor.activo : true
    };

    return this.graphql.mutate<{ createProveedor: GraphQLProveedor }>(mutation, { input }).pipe(
      map(response => this.mapGraphQLToProveedor(response.createProveedor))
    );
  }

  /**
   * Actualiza un proveedor existente
   * 
   * @param id - ID del proveedor a actualizar
   * @param proveedor - Datos actualizados del proveedor
   * @returns Observable con el proveedor actualizado
   */
  updateProveedor(id: number, proveedor: any): Observable<any> {
    const mutation = `
      mutation UpdateProveedor($id: ID!, $input: ProveedorInput!) {
        updateProveedor(id: $id, input: $input) {
          id
          nombre
          ruc
          direccion
          telefono
          email
          personaContacto
          activo
        }
      }
    `;

    const input = {
      nombre: proveedor.nombre,
      ruc: proveedor.ruc || null,
      direccion: proveedor.direccion || null,
      telefono: proveedor.telefono || null,
      email: proveedor.email || null,
      personaContacto: proveedor.personaContacto || null,
      activo: proveedor.activo !== undefined ? proveedor.activo : true
    };

    return this.graphql.mutate<{ updateProveedor: GraphQLProveedor }>(mutation, {
      id: id.toString(),
      input
    }).pipe(
      map(response => this.mapGraphQLToProveedor(response.updateProveedor))
    );
  }

  /**
   * Elimina un proveedor
   * 
   * @param id - ID del proveedor a eliminar
   * @returns Observable con el resultado
   */
  deleteProveedor(id: number): Observable<any> {
    const mutation = `
      mutation DeleteProveedor($id: ID!) {
        deleteProveedor(id: $id)
      }
    `;

    return this.graphql.mutate<{ deleteProveedor: boolean }>(mutation, { id: id.toString() }).pipe(
      map(response => {
        if (!response.deleteProveedor) {
          throw new Error('No se pudo eliminar el proveedor');
        }
        return { success: true };
      })
    );
  }

  /**
   * Cambia el estado (activo/inactivo) de un proveedor
   * 
   * @param id - ID del proveedor
   * @param activo - Nuevo estado
   * @returns Observable con el proveedor actualizado
   */
  cambiarEstadoProveedor(id: number, activo: boolean): Observable<any> {
    const mutation = `
      mutation CambiarEstadoProveedor($id: ID!, $activo: Boolean!) {
        cambiarEstadoProveedor(id: $id, activo: $activo) {
          id
          nombre
          ruc
          direccion
          telefono
          email
          personaContacto
          activo
        }
      }
    `;

    return this.graphql.mutate<{ cambiarEstadoProveedor: GraphQLProveedor }>(mutation, {
      id: id.toString(),
      activo
    }).pipe(
      map(response => this.mapGraphQLToProveedor(response.cambiarEstadoProveedor))
    );
  }

  /**
   * Obtiene un proveedor con sus materiales asociados
   * 
   * ⚠️ NO DISPONIBLE DIRECTAMENTE EN GRAPHQL
   * Se obtiene el proveedor y luego sus materiales usando getMaterialesPorProveedor.
   * 
   * @param id - ID del proveedor
   * @returns Observable con el proveedor y sus materiales
   */
  getProveedorConMateriales(id: number): Observable<any> {
    // Obtener proveedor y materiales en paralelo
    return this.getProveedor(id).pipe(
      switchMap(proveedor => {
        // Usar el servicio de materiales para obtener materiales del proveedor
        // Nota: Esto requiere importar MaterialesService, pero para mantener la interfaz
        // podemos hacer una query GraphQL directa
        const query = `
          query GetMaterialesPorProveedor($proveedorId: ID!) {
            getMaterialesPorProveedor(proveedorId: $proveedorId) {
              id
              precio
              cantidadMinima
              descripcion
              material {
                id
                nombre
                descripcion
                unidadMedida
                precio
                stockActual
                stockMinimo
              }
            }
          }
        `;

        return this.graphql.query<{ getMaterialesPorProveedor: any[] }>(query, { proveedorId: id.toString() }).pipe(
          map(materialesResponse => {
            return {
              ...proveedor,
              materiales: materialesResponse.getMaterialesPorProveedor.map((pm: any) => ({
                id: parseInt(pm.id, 10),
                precio: pm.precio,
                cantidadMinima: pm.cantidadMinima,
                descripcion: pm.descripcion,
                material: pm.material ? {
                  id: parseInt(pm.material.id, 10),
                  nombre: pm.material.nombre,
                  descripcion: pm.material.descripcion,
                  unidadMedida: pm.material.unidadMedida,
                  precio: pm.material.precio,
                  stockActual: pm.material.stockActual,
                  stockMinimo: pm.material.stockMinimo
                } : null
              }))
            };
          })
        );
      })
    );
  }

  /**
   * Obtiene un proveedor por nombre
   * 
   * @param nombre - Nombre del proveedor
   * @returns Observable con el proveedor encontrado
   */
  getProveedorPorNombre(nombre: string): Observable<any> {
    const query = `
      query GetProveedorByNombre($nombre: String!) {
        getProveedorByNombre(nombre: $nombre) {
          id
          nombre
          ruc
          direccion
          telefono
          email
          personaContacto
          activo
        }
      }
    `;

    return this.graphql.query<{ getProveedorByNombre: GraphQLProveedor }>(query, { nombre }).pipe(
      map(response => {
        if (!response.getProveedorByNombre) {
          return null;
        }
        return this.mapGraphQLToProveedor(response.getProveedorByNombre);
      })
    );
  }

  /**
   * Obtiene proveedores por estado (activo/inactivo)
   * 
   * @param activo - Estado del proveedor
   * @returns Observable con array de proveedores
   */
  getProveedoresPorEstado(activo: boolean): Observable<any[]> {
    const query = `
      query GetProveedoresByEstado($activo: Boolean!) {
        getProveedoresByEstado(activo: $activo) {
          id
          nombre
          ruc
          direccion
          telefono
          email
          personaContacto
          activo
        }
      }
    `;

    return this.graphql.query<{ getProveedoresByEstado: GraphQLProveedor[] }>(query, { activo }).pipe(
      map(response => {
        return response.getProveedoresByEstado.map(proveedor => this.mapGraphQLToProveedor(proveedor));
      })
    );
  }

  /**
   * Busca proveedores por término de búsqueda
   * 
   * @param termino - Término de búsqueda
   * @returns Observable con array de proveedores encontrados
   */
  buscarProveedores(termino: string): Observable<any[]> {
    const query = `
      query BuscarProveedores($texto: String!) {
        buscarProveedores(texto: $texto) {
          id
          nombre
          ruc
          direccion
          telefono
          email
          personaContacto
          activo
        }
      }
    `;

    return this.graphql.query<{ buscarProveedores: GraphQLProveedor[] }>(query, { texto: termino }).pipe(
      map(response => {
        return response.buscarProveedores.map(proveedor => this.mapGraphQLToProveedor(proveedor));
      })
    );
  }

  /**
   * Mapea un proveedor de GraphQL al formato esperado por los componentes
   * 
   * @param graphqlProveedor - Proveedor en formato GraphQL
   * @returns Proveedor en formato TypeScript
   */
  private mapGraphQLToProveedor(graphqlProveedor: GraphQLProveedor): any {
    return {
      id: parseInt(graphqlProveedor.id, 10),
      nombre: graphqlProveedor.nombre,
      ruc: graphqlProveedor.ruc || '',
      direccion: graphqlProveedor.direccion || '',
      telefono: graphqlProveedor.telefono || '',
      email: graphqlProveedor.email || '',
      personaContacto: graphqlProveedor.personaContacto || '',
      activo: graphqlProveedor.activo
    };
  }
}
