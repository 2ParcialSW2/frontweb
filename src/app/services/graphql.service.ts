import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../enviroment';
import { AuthService } from './auth.service';

/**
 * Interfaz para la respuesta estándar de GraphQL
 */
export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: GraphQLError[];
}

/**
 * Interfaz para errores de GraphQL
 */
export interface GraphQLError {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: Array<string | number>;
  extensions?: {
    code?: string;
    [key: string]: any;
  };
}

/**
 * Opciones para peticiones GraphQL
 */
export interface GraphQLRequestOptions {
  operationName?: string;
  variables?: Record<string, any>;
}

/**
 * Servicio base para realizar peticiones GraphQL
 * 
 * Este servicio proporciona métodos para enviar queries y mutations
 * al endpoint GraphQL del backend, manejando autenticación, errores y tipado.
 */
@Injectable({
  providedIn: 'root'
})
export class GraphQLService {
  private graphqlUrl: string;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    // Construir la URL del endpoint GraphQL
    // El backend tiene GraphQL en /graphql según application.properties
    const baseUrl = environment.apiUrl.endsWith('/') 
      ? environment.apiUrl.slice(0, -1) 
      : environment.apiUrl;
    this.graphqlUrl = `${baseUrl}/graphql`;
  }

  /**
   * Ejecuta una query GraphQL
   * 
   * @param query - La query GraphQL como string
   * @param variables - Variables opcionales para la query
   * @param operationName - Nombre opcional de la operación
   * @returns Observable con los datos de la respuesta
   * 
   * @example
   * ```typescript
   * this.graphql.query<{ getAllUsuarios: Usuario[] }>(`
   *   query {
   *     getAllUsuarios {
   *       id
   *       nombre
   *       email
   *     }
   *   }
   * `).subscribe(data => {
   *   console.log(data.getAllUsuarios);
   * });
   * ```
   */
  query<T = any>(
    query: string,
    variables?: Record<string, any>,
    operationName?: string
  ): Observable<T> {
    return this.execute<T>(query, variables, operationName);
  }

  /**
   * Ejecuta una mutation GraphQL
   * 
   * @param mutation - La mutation GraphQL como string
   * @param variables - Variables para la mutation
   * @param operationName - Nombre opcional de la operación
   * @returns Observable con los datos de la respuesta
   * 
   * @example
   * ```typescript
   * this.graphql.mutate<{ createUsuario: Usuario }>(`
   *   mutation CreateUsuario($input: UsuarioInput!) {
   *     createUsuario(input: $input) {
   *       id
   *       nombre
   *       email
   *     }
   *   }
   * `, { input: usuarioData }).subscribe(data => {
   *   console.log(data.createUsuario);
   * });
   * ```
   */
  mutate<T = any>(
    mutation: string,
    variables?: Record<string, any>,
    operationName?: string
  ): Observable<T> {
    return this.execute<T>(mutation, variables, operationName);
  }

  /**
   * Método interno para ejecutar peticiones GraphQL
   * 
   * @param operation - Query o mutation GraphQL
   * @param variables - Variables para la operación
   * @param operationName - Nombre de la operación
   * @returns Observable con los datos de la respuesta
   */
  private execute<T>(
    operation: string,
    variables?: Record<string, any>,
    operationName?: string
  ): Observable<T> {
    // Obtener el token JWT si está disponible
    const token = this.authService.obtenerToken();
    
    // Construir headers
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });

    // Construir el body de la petición GraphQL
    const body: any = {
      query: operation
    };

    if (variables && Object.keys(variables).length > 0) {
      body.variables = variables;
    }

    if (operationName) {
      body.operationName = operationName;
    }

    console.log('🔵 [GraphQL] Enviando petición:', {
      url: this.graphqlUrl,
      operation: operation.substring(0, 100) + '...',
      hasVariables: !!variables,
      hasToken: !!token
    });

    // Realizar la petición HTTP POST
    return this.http.post<GraphQLResponse<T>>(this.graphqlUrl, body, { headers })
      .pipe(
        map(response => {
          // Verificar si hay errores en la respuesta
          if (response.errors && response.errors.length > 0) {
            console.error('❌ [GraphQL] Errores en la respuesta:', response.errors);
            throw this.createGraphQLError(response.errors);
          }

          // Si no hay datos, puede ser un error
          if (!response.data) {
            console.warn('⚠️ [GraphQL] Respuesta sin datos');
            throw new Error('La respuesta GraphQL no contiene datos');
          }

          console.log('✅ [GraphQL] Respuesta exitosa');
          return response.data as T;
        }),
        catchError((error: HttpErrorResponse | Error) => {
          return this.handleError(error);
        })
      );
  }

  /**
   * Maneja errores de peticiones GraphQL
   * 
   * @param error - Error HTTP o de GraphQL
   * @returns Observable que emite el error
   */
  private handleError(error: HttpErrorResponse | Error): Observable<never> {
    let errorMessage = 'Error desconocido en la petición GraphQL';

    if (error instanceof HttpErrorResponse) {
      // Error HTTP (red, servidor, etc.)
      if (error.status === 0) {
        errorMessage = 'Error de conexión. Verifica que el servidor esté disponible.';
      } else if (error.status === 401) {
        errorMessage = 'No autorizado. Por favor, inicia sesión nuevamente.';
        // Opcional: cerrar sesión automáticamente
        // this.authService.cerrarSesion();
      } else if (error.status === 403) {
        errorMessage = 'Acceso denegado. No tienes permisos para esta operación.';
      } else if (error.status >= 500) {
        errorMessage = 'Error del servidor. Por favor, intenta más tarde.';
      } else {
        errorMessage = `Error HTTP ${error.status}: ${error.message}`;
      }

      console.error('❌ [GraphQL] Error HTTP:', {
        status: error.status,
        statusText: error.statusText,
        message: errorMessage,
        error: error.error
      });
    } else {
      // Error de GraphQL (errores en la respuesta)
      errorMessage = error.message;
      console.error('❌ [GraphQL] Error:', errorMessage);
    }

    return throwError(() => new Error(errorMessage));
  }

  /**
   * Crea un error a partir de los errores de GraphQL
   * 
   * @param errors - Array de errores de GraphQL
   * @returns Error con mensaje combinado
   */
  private createGraphQLError(errors: GraphQLError[]): Error {
    const messages = errors.map(err => {
      let message = err.message;
      
      // Agregar información adicional si está disponible
      if (err.extensions?.code) {
        message = `[${err.extensions.code}] ${message}`;
      }
      
      if (err.path && err.path.length > 0) {
        message = `${message} (path: ${err.path.join('.')})`;
      }
      
      return message;
    });

    return new Error(messages.join('; '));
  }

  /**
   * Obtiene la URL del endpoint GraphQL
   * 
   * @returns URL del endpoint GraphQL
   */
  getGraphQLUrl(): string {
    return this.graphqlUrl;
  }
}

