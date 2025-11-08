import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GraphQLService } from './graphql.service';

/**
 * Interfaz para la respuesta GraphQL de categorías
 */
interface GraphQLCategoria {
  id: string;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
  subCategoria?: {
    id: string;
    nombre: string;
    descripcion?: string | null;
  } | null;
}

/**
 * Servicio para gestionar categorías usando GraphQL
 * 
 * Migrado de REST a GraphQL manteniendo la misma interfaz pública
 * para compatibilidad con componentes existentes.
 */
@Injectable({
  providedIn: 'root'
})
export class CategoriasService {
  constructor(private graphql: GraphQLService) {}

  /**
   * Obtiene todas las categorías
   * 
   * @returns Observable con array de categorías
   */
  getCategorias(): Observable<any[]> {
    const query = `
      query {
        getAllCategorias {
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

    return this.graphql.query<{ getAllCategorias: GraphQLCategoria[] }>(query).pipe(
      map(response => {
        return response.getAllCategorias.map(this.mapGraphQLToCategoria);
      })
    );
  }

  /**
   * Obtiene una categoría por su ID
   * 
   * @param id - ID de la categoría
   * @returns Observable con la categoría
   */
  getCategoria(id: number): Observable<any> {
    const query = `
      query GetCategoria($id: ID!) {
        getCategoriaById(id: $id) {
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

    return this.graphql.query<{ getCategoriaById: GraphQLCategoria }>(query, { id: id.toString() }).pipe(
      map(response => this.mapGraphQLToCategoria(response.getCategoriaById))
    );
  }

  /**
   * Crea una nueva categoría
   * 
   * @param categoria - Datos de la categoría a crear
   * @returns Observable con la categoría creada
   */
  createCategoria(categoria: {
    nombre: string;
    descripcion: string;
    subCategoriaId: number;
  }): Observable<any> {
    const mutation = `
      mutation CreateCategoria($input: CategoriaInput!) {
        createCategoria(input: $input) {
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

    const input = {
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || null,
      subCategoriaId: categoria.subCategoriaId ? categoria.subCategoriaId.toString() : null
    };

    return this.graphql.mutate<{ createCategoria: GraphQLCategoria }>(mutation, { input }).pipe(
      map(response => this.mapGraphQLToCategoria(response.createCategoria))
    );
  }

  /**
   * Actualiza una categoría existente
   * 
   * @param id - ID de la categoría a actualizar
   * @param categoria - Datos actualizados de la categoría
   * @returns Observable con la categoría actualizada
   */
  updateCategoria(id: number, categoria: {
    nombre: string;
    descripcion: string;
    subCategoriaId: number;
  }): Observable<any> {
    const mutation = `
      mutation UpdateCategoria($id: ID!, $input: CategoriaInput!) {
        updateCategoria(id: $id, input: $input) {
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

    const input = {
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || null,
      subCategoriaId: categoria.subCategoriaId ? categoria.subCategoriaId.toString() : null
    };

    return this.graphql.mutate<{ updateCategoria: GraphQLCategoria }>(mutation, {
      id: id.toString(),
      input
    }).pipe(
      map(response => this.mapGraphQLToCategoria(response.updateCategoria))
    );
  }

  /**
   * Elimina (desactiva) una categoría
   * 
   * @param id - ID de la categoría a eliminar
   * @returns Observable con el resultado
   */
  deleteCategoria(id: number): Observable<any> {
    const mutation = `
      mutation DeleteCategoria($id: ID!) {
        deleteCategoria(id: $id)
      }
    `;

    return this.graphql.mutate<{ deleteCategoria: boolean }>(mutation, { id: id.toString() }).pipe(
      map(response => {
        if (!response.deleteCategoria) {
          throw new Error('No se pudo eliminar la categoría');
        }
        return { success: true };
      })
    );
  }

  /**
   * Busca una categoría por nombre
   * 
   * @param nombre - Nombre de la categoría a buscar
   * @returns Observable con la categoría encontrada
   */
  buscarPorNombre(nombre: string): Observable<any> {
    const query = `
      query GetCategoriaByNombre($nombre: String!) {
        getCategoriaByNombre(nombre: $nombre) {
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

    return this.graphql.query<{ getCategoriaByNombre: GraphQLCategoria }>(query, { nombre }).pipe(
      map(response => {
        // Si no se encuentra, puede retornar null
        if (!response.getCategoriaByNombre) {
          return null;
        }
        return this.mapGraphQLToCategoria(response.getCategoriaByNombre);
      })
    );
  }

  /**
   * Mapea una categoría de GraphQL al formato esperado por los componentes
   * 
   * @param graphqlCategoria - Categoría en formato GraphQL
   * @returns Categoría en formato TypeScript
   */
  private mapGraphQLToCategoria(graphqlCategoria: GraphQLCategoria): any {
    return {
      id: parseInt(graphqlCategoria.id, 10),
      nombre: graphqlCategoria.nombre,
      descripcion: graphqlCategoria.descripcion || '',
      activo: graphqlCategoria.activo,
      subCategoriaId: graphqlCategoria.subCategoria ? parseInt(graphqlCategoria.subCategoria.id, 10) : null,
      subCategoria: graphqlCategoria.subCategoria ? {
        id: parseInt(graphqlCategoria.subCategoria.id, 10),
        nombre: graphqlCategoria.subCategoria.nombre,
        descripcion: graphqlCategoria.subCategoria.descripcion || ''
      } : null
    };
  }
}
