import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { GraphQLService } from './graphql.service';

/**
 * Interfaz para la respuesta GraphQL de ProveedorMaterial
 */
interface GraphQLProveedorMaterial {
  id: string;
  precio?: number | null;
  cantidadMinima?: number | null;
  descripcion?: string | null;
  proveedor?: {
    id: string;
    nombre: string;
    ruc?: string | null;
    activo: boolean;
  } | null;
  material?: {
    id: string;
    nombre: string;
    descripcion?: string | null;
    unidadMedida: string;
    precio?: number | null;
    stockActual: number;
    stockMinimo: number;
  } | null;
}

/**
 * Servicio para gestionar relaciones proveedor-material usando GraphQL
 * 
 * Migrado de REST a GraphQL manteniendo la misma interfaz pública
 * para compatibilidad con componentes existentes.
 */
@Injectable({
  providedIn: 'root'
})
export class ProveedorMaterialService {
  constructor(private graphql: GraphQLService) {}

  /**
   * Obtiene todos los materiales asociados a un proveedor
   * 
   * @param proveedorId - ID del proveedor
   * @returns Observable con array de relaciones proveedor-material
   */
  getMaterialesByProveedor(proveedorId: number): Observable<any> {
    const query = `
      query GetMaterialesPorProveedor($proveedorId: ID!) {
        getMaterialesPorProveedor(proveedorId: $proveedorId) {
          id
          precio
          cantidadMinima
          descripcion
          proveedor {
            id
            nombre
            ruc
            activo
          }
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

    return this.graphql.query<{ getMaterialesPorProveedor: GraphQLProveedorMaterial[] }>(query, {
      proveedorId: proveedorId.toString()
    }).pipe(
      map(response => {
        return response.getMaterialesPorProveedor.map(relacion => this.mapGraphQLToProveedorMaterial(relacion));
      })
    );
  }

  /**
   * Asocia un material a un proveedor
   * 
   * @param proveedorId - ID del proveedor
   * @param material - Datos del material a asociar
   * @returns Observable con la relación creada
   */
  asociarMaterialAProveedor(proveedorId: number, material: any): Observable<any> {
    const mutation = `
      mutation AsociarMaterialAProveedor($proveedorId: ID!, $input: ProveedorMaterialInput!) {
        asociarMaterialAProveedor(proveedorId: $proveedorId, input: $input) {
          id
          precio
          cantidadMinima
          descripcion
          proveedor {
            id
            nombre
            ruc
            activo
          }
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

    const input = {
      materialId: material.materialId ? material.materialId.toString() : material.id.toString(),
      precio: material.precio || null,
      cantidadMinima: material.cantidadMinima || null,
      descripcion: material.descripcion || null
    };

    return this.graphql.mutate<{ asociarMaterialAProveedor: GraphQLProveedorMaterial }>(mutation, {
      proveedorId: proveedorId.toString(),
      input
    }).pipe(
      map(response => this.mapGraphQLToProveedorMaterial(response.asociarMaterialAProveedor))
    );
  }

  /**
   * Elimina la asociación entre un proveedor y un material
   * 
   * @param proveedorId - ID del proveedor
   * @param materialId - ID del material
   * @returns Observable con el resultado
   */
  eliminarMaterialDeProveedor(proveedorId: number, materialId: number): Observable<any> {
    const mutation = `
      mutation EliminarAsociacionProveedorMaterial($proveedorId: ID!, $materialId: ID!) {
        eliminarAsociacionProveedorMaterial(proveedorId: $proveedorId, materialId: $materialId)
      }
    `;

    return this.graphql.mutate<{ eliminarAsociacionProveedorMaterial: boolean }>(mutation, {
      proveedorId: proveedorId.toString(),
      materialId: materialId.toString()
    }).pipe(
      map(response => {
        if (!response.eliminarAsociacionProveedorMaterial) {
          throw new Error('No se pudo eliminar la asociación');
        }
        return { success: true };
      })
    );
  }

  /**
   * Obtiene todas las relaciones proveedor-material
   * 
   * ⚠️ NO DISPONIBLE DIRECTAMENTE EN GRAPHQL
   * No hay una query que obtenga todas las relaciones.
   * Se puede obtener por proveedor o por material.
   * 
   * @returns Observable con error indicando que no está disponible
   */
  getAllRelacionesProveedorMaterial(): Observable<any> {
    return throwError(() => new Error(
      'getAllRelacionesProveedorMaterial no está disponible en GraphQL. ' +
      'Usa getMaterialesPorProveedor o getProveedoresPorMaterial.'
    ));
  }

  /**
   * Actualiza un material asociado a un proveedor
   * 
   * ⚠️ NO DISPONIBLE EN GRAPHQL
   * Este método no está disponible en el schema GraphQL actual.
   * Se debe eliminar y volver a crear la asociación o agregar la mutation en el backend.
   * 
   * @param proveedorId - ID del proveedor
   * @param materialId - ID del material
   * @param materialActualizado - Datos actualizados
   * @returns Observable con la relación actualizada
   */
  actualizarMaterialDeProveedor(proveedorId: number, materialId: number, materialActualizado: any): Observable<any> {
    // Alternativa: Eliminar y volver a crear
    return this.eliminarMaterialDeProveedor(proveedorId, materialId).pipe(
      switchMap(() => {
        return this.asociarMaterialAProveedor(proveedorId, {
          ...materialActualizado,
          materialId: materialId
        });
      })
    );
  }

  /**
   * Obtiene todos los proveedores asociados a un material
   * 
   * Método adicional disponible en GraphQL
   * 
   * @param materialId - ID del material
   * @returns Observable con array de relaciones proveedor-material
   */
  getProveedoresPorMaterial(materialId: number): Observable<any> {
    const query = `
      query GetProveedoresPorMaterial($materialId: ID!) {
        getProveedoresPorMaterial(materialId: $materialId) {
          id
          precio
          cantidadMinima
          descripcion
          proveedor {
            id
            nombre
            ruc
            direccion
            telefono
            email
            activo
          }
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

    return this.graphql.query<{ getProveedoresPorMaterial: GraphQLProveedorMaterial[] }>(query, {
      materialId: materialId.toString()
    }).pipe(
      map(response => {
        return response.getProveedoresPorMaterial.map(relacion => this.mapGraphQLToProveedorMaterial(relacion));
      })
    );
  }

  /**
   * Mapea una relación ProveedorMaterial de GraphQL al formato esperado por los componentes
   * 
   * @param graphqlProveedorMaterial - Relación en formato GraphQL
   * @returns Relación en formato TypeScript
   */
  private mapGraphQLToProveedorMaterial(graphqlProveedorMaterial: GraphQLProveedorMaterial): any {
    return {
      id: parseInt(graphqlProveedorMaterial.id, 10),
      precio: graphqlProveedorMaterial.precio || 0,
      cantidadMinima: graphqlProveedorMaterial.cantidadMinima || null,
      descripcion: graphqlProveedorMaterial.descripcion || '',
      proveedorId: graphqlProveedorMaterial.proveedor ? parseInt(graphqlProveedorMaterial.proveedor.id, 10) : null,
      materialId: graphqlProveedorMaterial.material ? parseInt(graphqlProveedorMaterial.material.id, 10) : null,
      proveedor: graphqlProveedorMaterial.proveedor ? {
        id: parseInt(graphqlProveedorMaterial.proveedor.id, 10),
        nombre: graphqlProveedorMaterial.proveedor.nombre,
        ruc: graphqlProveedorMaterial.proveedor.ruc || '',
        activo: graphqlProveedorMaterial.proveedor.activo
      } : null,
      material: graphqlProveedorMaterial.material ? {
        id: parseInt(graphqlProveedorMaterial.material.id, 10),
        nombre: graphqlProveedorMaterial.material.nombre,
        descripcion: graphqlProveedorMaterial.material.descripcion || '',
        unidadMedida: graphqlProveedorMaterial.material.unidadMedida,
        precio: graphqlProveedorMaterial.material.precio || 0,
        stockActual: graphqlProveedorMaterial.material.stockActual,
        stockMinimo: graphqlProveedorMaterial.material.stockMinimo
      } : null
    };
  }
}