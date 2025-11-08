import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GraphQLService } from './graphql.service';

/**
 * Interfaz para la respuesta GraphQL de subcategorías
 */
interface GraphQLSubCategoria {
  id: string;
  nombre: string;
  descripcion?: string | null;
}

/**
 * Servicio para gestionar subcategorías usando GraphQL
 * 
 * Migrado de REST a GraphQL manteniendo la misma interfaz pública
 * para compatibilidad con componentes existentes.
 */
@Injectable({
  providedIn: 'root'
})
export class SubcategoriasService {
  constructor(private graphql: GraphQLService) {}

  /**
   * Obtiene todas las subcategorías
   * 
   * @returns Observable con array de subcategorías
   */
  getSubcategorias(): Observable<any[]> {
    const query = `
      query {
        getAllSubCategorias {
          id
          nombre
          descripcion
        }
      }
    `;

    return this.graphql.query<{ getAllSubCategorias: GraphQLSubCategoria[] }>(query).pipe(
      map(response => {
        return response.getAllSubCategorias.map(this.mapGraphQLToSubCategoria);
      })
    );
  }

  /**
   * Obtiene una subcategoría por su ID
   * 
   * @param subcategoriaId - ID de la subcategoría
   * @returns Observable con la subcategoría
   */
  getSubcategoria(subcategoriaId: number): Observable<any> {
    const query = `
      query GetSubCategoria($id: ID!) {
        getSubCategoriaById(id: $id) {
          id
          nombre
          descripcion
        }
      }
    `;

    return this.graphql.query<{ getSubCategoriaById: GraphQLSubCategoria }>(query, { id: subcategoriaId.toString() }).pipe(
      map(response => this.mapGraphQLToSubCategoria(response.getSubCategoriaById))
    );
  }

  /**
   * Crea una nueva subcategoría
   * 
   * @param subcategoria - Datos de la subcategoría a crear
   * @returns Observable con la subcategoría creada
   */
  createSubcategoria(subcategoria: any): Observable<any> {
    const mutation = `
      mutation CreateSubCategoria($input: SubCategoriaInput!) {
        createSubCategoria(input: $input) {
          id
          nombre
          descripcion
        }
      }
    `;

    const input = {
      nombre: subcategoria.nombre,
      descripcion: subcategoria.descripcion || null
    };

    return this.graphql.mutate<{ createSubCategoria: GraphQLSubCategoria }>(mutation, { input }).pipe(
      map(response => this.mapGraphQLToSubCategoria(response.createSubCategoria))
    );
  }

  /**
   * Actualiza una subcategoría existente
   * 
   * @param subcategoriaId - ID de la subcategoría a actualizar
   * @param subcategoria - Datos actualizados de la subcategoría
   * @returns Observable con la subcategoría actualizada
   */
  updateSubcategoria(subcategoriaId: number, subcategoria: any): Observable<any> {
    const mutation = `
      mutation UpdateSubCategoria($id: ID!, $input: SubCategoriaInput!) {
        updateSubCategoria(id: $id, input: $input) {
          id
          nombre
          descripcion
        }
      }
    `;

    const input = {
      nombre: subcategoria.nombre,
      descripcion: subcategoria.descripcion || null
    };

    return this.graphql.mutate<{ updateSubCategoria: GraphQLSubCategoria }>(mutation, {
      id: subcategoriaId.toString(),
      input
    }).pipe(
      map(response => this.mapGraphQLToSubCategoria(response.updateSubCategoria))
    );
  }

  /**
   * Elimina una subcategoría
   * 
   * @param subcategoriaId - ID de la subcategoría a eliminar
   * @returns Observable con el resultado
   */
  deleteSubcategoria(subcategoriaId: number): Observable<any> {
    const mutation = `
      mutation DeleteSubCategoria($id: ID!) {
        deleteSubCategoria(id: $id)
      }
    `;

    return this.graphql.mutate<{ deleteSubCategoria: boolean }>(mutation, { id: subcategoriaId.toString() }).pipe(
      map(response => {
        if (!response.deleteSubCategoria) {
          throw new Error('No se pudo eliminar la subcategoría');
        }
        return { success: true };
      })
    );
  }

  /**
   * Obtiene las categorías asociadas a una subcategoría
   * 
   * @param subcategoriaId - ID de la subcategoría
   * @returns Observable con array de categorías
   */
  getCategoriaBySubcategoria(subcategoriaId: number): Observable<any> {
    const query = `
      query GetCategoriasBySubCategoria($subCategoriaId: ID!) {
        getCategoriasBySubCategoria(subCategoriaId: $subCategoriaId) {
          id
          nombre
          descripcion
          activo
          subCategoria {
            id
            nombre
            descripcion
          }
        }
      }
    `;

    return this.graphql.query<{ getCategoriasBySubCategoria: any[] }>(query, { subCategoriaId: subcategoriaId.toString() }).pipe(
      map(response => {
        return response.getCategoriasBySubCategoria.map((cat: any) => ({
          id: parseInt(cat.id, 10),
          nombre: cat.nombre,
          descripcion: cat.descripcion || '',
          activo: cat.activo,
          subCategoriaId: cat.subCategoria ? parseInt(cat.subCategoria.id, 10) : null
        }));
      })
    );
  }

  /**
   * Mapea una subcategoría de GraphQL al formato esperado por los componentes
   * 
   * @param graphqlSubCategoria - Subcategoría en formato GraphQL
   * @returns Subcategoría en formato TypeScript
   */
  private mapGraphQLToSubCategoria(graphqlSubCategoria: GraphQLSubCategoria): any {
    return {
      id: parseInt(graphqlSubCategoria.id, 10),
      nombre: graphqlSubCategoria.nombre,
      descripcion: graphqlSubCategoria.descripcion || ''
    };
  }
}
