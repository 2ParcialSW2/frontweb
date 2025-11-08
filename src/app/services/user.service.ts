import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GraphQLService } from './graphql.service';
import { Usuario, UsuarioDTO } from '../models/usuario.model';

/**
 * Interfaz para la respuesta GraphQL de usuarios
 */
interface GraphQLUsuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string | null;
  estado: boolean;
  disponibilidad: boolean;
  rol?: {
    id: string;
    nombre: string;
  } | null;
}

/**
 * Servicio para gestionar usuarios usando GraphQL
 * 
 * Migrado de REST a GraphQL manteniendo la misma interfaz pública
 * para compatibilidad con componentes existentes.
 */
@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private graphql: GraphQLService) {}

  /**
   * Obtiene todos los usuarios
   * 
   * @returns Observable con array de usuarios
   */
  listarUsuarios(): Observable<Usuario[]> {
    const query = `
      query {
        getAllUsuarios {
          id
          nombre
          apellido
          email
          telefono
          estado
          disponibilidad
          rol {
            id
            nombre
          }
        }
      }
    `;

    return this.graphql.query<{ getAllUsuarios: GraphQLUsuario[] }>(query).pipe(
      map(response => {
        return response.getAllUsuarios.map(this.mapGraphQLToUsuario);
      })
    );
  }

  /**
   * Busca usuarios por término de búsqueda
   * 
   * Nota: El backend GraphQL no tiene una query específica de búsqueda,
   * por lo que se obtienen todos y se filtran en el cliente.
   * Esto se puede optimizar agregando una query de búsqueda en el backend.
   * 
   * @param search - Término de búsqueda
   * @returns Observable con array de usuarios filtrados
   */
  buscarUsuarios(search: string): Observable<Usuario[]> {
    // Por ahora, obtener todos y filtrar en el cliente
    // TODO: Agregar query de búsqueda en el backend GraphQL
    return this.listarUsuarios().pipe(
      map(usuarios => {
        if (!search || search.trim() === '') {
          return usuarios;
        }
        const termino = search.toLowerCase();
        return usuarios.filter(usuario =>
          usuario.nombre_completo.toLowerCase().includes(termino) ||
          usuario.email.toLowerCase().includes(termino) ||
          (usuario.telefono && usuario.telefono.includes(termino))
        );
      })
    );
  }

  /**
   * Obtiene un usuario por su ID
   * 
   * @param id - ID del usuario
   * @returns Observable con el usuario
   */
  obtenerUsuario(id: number): Observable<Usuario> {
    const query = `
      query GetUsuario($id: ID!) {
        getUsuarioById(id: $id) {
          id
          nombre
          apellido
          email
          telefono
          estado
          disponibilidad
          rol {
            id
            nombre
          }
        }
      }
    `;

    return this.graphql.query<{ getUsuarioById: GraphQLUsuario }>(query, { id: id.toString() }).pipe(
      map(response => this.mapGraphQLToUsuario(response.getUsuarioById))
    );
  }

  /**
   * Registra un nuevo usuario
   * 
   * @param usuario - Datos del usuario a registrar
   * @returns Observable con el usuario creado
   */
  registrarUsuario(usuario: UsuarioDTO): Observable<Usuario> {
    const mutation = `
      mutation CreateUsuario($input: UsuarioInput!) {
        createUsuario(input: $input) {
          id
          nombre
          apellido
          email
          telefono
          estado
          disponibilidad
          rol {
            id
            nombre
          }
        }
      }
    `;

    // Mapear UsuarioDTO a UsuarioInput de GraphQL
    const input = {
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      password: usuario.password,
      telefono: usuario.telefono || null,
      rolid: usuario.rolid.toString() // GraphQL espera ID como string
    };

    return this.graphql.mutate<{ createUsuario: GraphQLUsuario }>(mutation, { input }).pipe(
      map(response => this.mapGraphQLToUsuario(response.createUsuario))
    );
  }

  /**
   * Actualiza un usuario existente
   * 
   * @param id - ID del usuario a actualizar
   * @param usuario - Datos actualizados del usuario
   * @returns Observable con el usuario actualizado
   */
  actualizarUsuario(id: number, usuario: UsuarioDTO): Observable<Usuario> {
    const mutation = `
      mutation UpdateUsuario($id: ID!, $input: UsuarioInput!) {
        updateUsuario(id: $id, input: $input) {
          id
          nombre
          apellido
          email
          telefono
          estado
          disponibilidad
          rol {
            id
            nombre
          }
        }
      }
    `;

    // Mapear UsuarioDTO a UsuarioInput de GraphQL
    // Nota: password puede ser null para no cambiarlo
    const input = {
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      password: usuario.password || null, // null si no se quiere cambiar
      telefono: usuario.telefono || null,
      rolid: usuario.rolid.toString() // GraphQL espera ID como string
    };

    return this.graphql.mutate<{ updateUsuario: GraphQLUsuario }>(mutation, {
      id: id.toString(),
      input
    }).pipe(
      map(response => this.mapGraphQLToUsuario(response.updateUsuario))
    );
  }

  /**
   * Desactiva un usuario
   * 
   * Nota: En GraphQL, `deleteUsuario` en realidad desactiva el usuario
   * (establece estado=false y disponibilidad=false), no lo elimina físicamente.
   * Esto es consistente con el comportamiento del endpoint REST /desactivar.
   * 
   * @param id - ID del usuario a desactivar
   * @returns Observable vacío
   */
  desactivarUsuario(id: number): Observable<void> {
    // deleteUsuario en GraphQL desactiva el usuario (estado=false)
    const mutation = `
      mutation DeleteUsuario($id: ID!) {
        deleteUsuario(id: $id)
      }
    `;

    return this.graphql.mutate<{ deleteUsuario: boolean }>(mutation, { id: id.toString() }).pipe(
      map(response => {
        if (!response.deleteUsuario) {
          throw new Error('No se pudo desactivar el usuario');
        }
        return undefined as void;
      })
    );
  }

  /**
   * Activa un usuario
   * 
   * @param id - ID del usuario a activar
   * @returns Observable vacío
   */
  activarUsuario(id: number): Observable<void> {
    const mutation = `
      mutation ActivarUsuario($id: ID!) {
        activarUsuario(id: $id)
      }
    `;

    return this.graphql.mutate<{ activarUsuario: boolean }>(mutation, { id: id.toString() }).pipe(
      map(response => {
        if (!response.activarUsuario) {
          throw new Error('No se pudo activar el usuario');
        }
        return undefined as void;
      })
    );
  }

  /**
   * Elimina un usuario
   * 
   * @param id - ID del usuario a eliminar
   * @returns Observable vacío
   */
  deleteUser(id: number): Observable<void> {
    const mutation = `
      mutation DeleteUsuario($id: ID!) {
        deleteUsuario(id: $id)
      }
    `;

    return this.graphql.mutate<{ deleteUsuario: boolean }>(mutation, { id: id.toString() }).pipe(
      map(response => {
        if (!response.deleteUsuario) {
          throw new Error('No se pudo eliminar el usuario');
        }
        return undefined as void;
      })
    );
  }

  /**
   * Mapea un usuario de GraphQL al modelo Usuario de TypeScript
   * 
   * @param graphqlUsuario - Usuario en formato GraphQL
   * @returns Usuario en formato TypeScript
   */
  private mapGraphQLToUsuario(graphqlUsuario: GraphQLUsuario): Usuario {
    return {
      id: parseInt(graphqlUsuario.id, 10),
      nombre_completo: `${graphqlUsuario.nombre} ${graphqlUsuario.apellido}`.trim(),
      email: graphqlUsuario.email,
      telefono: graphqlUsuario.telefono || '',
      direccion: '', // GraphQL no tiene direccion, se deja vacío
      estado: graphqlUsuario.estado,
      rol: graphqlUsuario.rol ? {
        id: parseInt(graphqlUsuario.rol.id, 10),
        nombre: graphqlUsuario.rol.nombre
      } : {
        id: 0,
        nombre: ''
      }
    };
  }
}
