import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Rol } from '../models/rol.model';
import { GraphQLService } from './graphql.service';

/**
 * Interfaz para la respuesta GraphQL de roles
 */
interface GraphQLRol {
  id: string;
  nombre: string;
}

/**
 * Servicio para gestionar roles usando GraphQL
 * 
 * Migrado de REST a GraphQL manteniendo la misma interfaz pública
 * para compatibilidad con componentes existentes.
 */
@Injectable({
  providedIn: 'root'
})
export class RoleService {
  constructor(private graphql: GraphQLService) {}

  /**
   * Obtiene todos los roles
   * 
   * @returns Observable con array de roles
   */
  getRoles(): Observable<Rol[]> {
    const query = `
      query {
        getAllRoles {
          id
          nombre
        }
      }
    `;

    return this.graphql.query<{ getAllRoles: GraphQLRol[] }>(query).pipe(
      map(response => {
        return response.getAllRoles.map(rol => this.mapGraphQLToRol(rol));
      })
    );
  }

  /**
   * Obtiene un rol por su ID
   * 
   * @param id - ID del rol
   * @returns Observable con el rol
   */
  getRoleById(id: number): Observable<Rol> {
    const query = `
      query GetRole($id: ID!) {
        getRoleById(id: $id) {
          id
          nombre
        }
      }
    `;

    return this.graphql.query<{ getRoleById: GraphQLRol }>(query, { id: id.toString() }).pipe(
      map(response => this.mapGraphQLToRol(response.getRoleById))
    );
  }

  /**
   * Crea un nuevo rol
   * 
   * @param nombreRol - Nombre del rol a crear
   * @returns Observable con el rol creado
   */
  createRole(nombreRol: string): Observable<Rol> {
    const mutation = `
      mutation CreateRole($input: RolInput!) {
        createRole(input: $input) {
          id
          nombre
        }
      }
    `;

    const input = {
      nombre: nombreRol,
      permisos: [] // GraphQL espera permisos como array, puede estar vacío
    };

    return this.graphql.mutate<{ createRole: GraphQLRol }>(mutation, { input }).pipe(
      map(response => this.mapGraphQLToRol(response.createRole))
    );
  }

  /**
   * Actualiza un rol existente
   * 
   * @param id - ID del rol a actualizar
   * @param nombreRol - Nuevo nombre del rol
   * @returns Observable con el rol actualizado
   */
  updateRole(id: number, nombreRol: string): Observable<Rol> {
    const mutation = `
      mutation UpdateRole($id: ID!, $input: RolInput!) {
        updateRole(id: $id, input: $input) {
          id
          nombre
        }
      }
    `;

    const input = {
      nombre: nombreRol,
      permisos: [] // GraphQL espera permisos como array
    };

    return this.graphql.mutate<{ updateRole: GraphQLRol }>(mutation, {
      id: id.toString(),
      input
    }).pipe(
      map(response => this.mapGraphQLToRol(response.updateRole))
    );
  }

  /**
   * Elimina un rol
   * 
   * @param id - ID del rol a eliminar
   * @returns Observable vacío
   */
  deleteRole(id: number): Observable<void> {
    const mutation = `
      mutation DeleteRole($id: ID!) {
        deleteRole(id: $id)
      }
    `;

    return this.graphql.mutate<{ deleteRole: boolean }>(mutation, { id: id.toString() }).pipe(
      map(response => {
        if (!response.deleteRole) {
          throw new Error('No se pudo eliminar el rol');
        }
        return undefined as void;
      })
    );
  }

  /**
   * Mapea un rol de GraphQL al formato esperado por los componentes
   * 
   * @param graphqlRol - Rol en formato GraphQL
   * @returns Rol en formato TypeScript
   */
  private mapGraphQLToRol(graphqlRol: GraphQLRol): Rol {
    return {
      id: parseInt(graphqlRol.id, 10),
      nombre: graphqlRol.nombre
    };
  }
}
