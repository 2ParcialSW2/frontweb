import { Injectable } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { map, tap, switchMap, catchError } from 'rxjs/operators';
import { GraphQLService } from './graphql.service';

/**
 * Interfaz para la respuesta GraphQL de materiales
 */
interface GraphQLMaterial {
  id: string;
  nombre: string;
  descripcion?: string | null;
  unidadMedida: string;
  precio?: number | null;
  stockActual: number;
  stockMinimo: number;
  puntoReorden?: number | null;
  categoriaText?: string | null;
  activo: boolean;
  imagen?: string | null;
  categoria?: {
    id: string;
    nombre: string;
    descripcion?: string | null;
    activo: boolean;
  } | null;
}

/**
 * Servicio para gestionar materiales usando GraphQL
 * 
 * Migrado de REST a GraphQL manteniendo la misma interfaz pública
 * para compatibilidad con componentes existentes.
 */
@Injectable({
  providedIn: 'root'
})
export class MaterialesService {
  constructor(private graphql: GraphQLService) {
    console.log('MaterialesService inicializado con GraphQL');
  }

  /**
   * Obtiene todos los materiales
   * 
   * @returns Observable con array de materiales
   */
  getMateriales(): Observable<any[]> {
    const query = `
      query {
        getAllMateriales {
          id
          nombre
          descripcion
          unidadMedida
          precio
          stockActual
          stockMinimo
          puntoReorden
          categoriaText
          activo
          imagen
          categoria {
            id
            nombre
            descripcion
            activo
          }
        }
      }
    `;

    return this.graphql.query<{ getAllMateriales: GraphQLMaterial[] }>(query).pipe(
      tap(response => console.log('Respuesta completa de materiales:', response)),
      map(response => {
        return response.getAllMateriales.map(material => this.mapGraphQLToMaterial(material));
      })
    );
  }

  /**
   * Obtiene todos los materiales con información completa procesada
   * 
   * Similar a getMateriales() pero con validación y procesamiento adicional
   * 
   * @returns Observable con array de materiales procesados
   */
  getMaterialesCompletos(): Observable<any[]> {
    console.log('Llamando a getMaterialesCompletos...');
    return this.getMateriales().pipe(
      map(materiales => {
        if (!materiales || !Array.isArray(materiales)) {
          console.warn('getMaterialesCompletos: No se recibieron materiales válidos');
          return [];
        }
        
        if (materiales.length === 0) {
          console.warn('getMaterialesCompletos: Se recibió un array vacío de materiales');
          return [];
        }
        
        console.log(`Procesando ${materiales.length} materiales para completar información`);
        
        return materiales.map((material, index) => {
          if (!material) {
            console.warn(`Material #${index} es null o undefined`);
            return {
              id: 0,
              nombre: `Material inválido #${index}`,
              descripcion: 'Sin descripción',
              stockActual: 0,
              stockMinimo: 0,
              precio: 0
            };
          }
          
          // Asegurar valores numéricos válidos
          const stockActual = Number(material.stockActual) || 0;
          const stockMinimo = Number(material.stockMinimo) || 0;
          const precio = Number(material.precio) || 0;
          
          const materialProcesado = {
            ...material,
            id: material.id || 0,
            nombre: material.nombre || 'Sin nombre',
            descripcion: material.descripcion || 'Sin descripción',
            stockActual: stockActual,
            stockMinimo: stockMinimo,
            precio: precio
          };
          
          if (!material.id || !material.nombre) {
            console.warn(`Material con datos incompletos - ID: ${material.id}, Nombre: ${material.nombre || 'FALTA NOMBRE'}`);
          }
          
          return materialProcesado;
        });
      }),
      tap(materialesProcesados => {
        console.log(`getMaterialesCompletos completado: ${materialesProcesados.length} materiales procesados`);
      })
    );
  }

  /**
   * Obtiene el último precio de un material desde compras
   * 
   * ⚠️ NO DISPONIBLE EN GRAPHQL
   * Este método requiere acceso a detalles de compra que no están disponibles
   * en el schema GraphQL actual. Se debe usar el endpoint REST o agregar la query.
   * 
   * @param materialId - ID del material
   * @returns Observable con el último precio (0 si no está disponible)
   */
  getUltimoPrecioMaterial(materialId: number): Observable<number> {
    // TODO: Agregar query en GraphQL para obtener último precio desde compras
    console.warn('getUltimoPrecioMaterial no está disponible en GraphQL. Usar endpoint REST.');
    return of(0);
  }

  /**
   * Obtiene un material por su ID
   * 
   * @param id - ID del material
   * @returns Observable con el material
   */
  getMaterial(id: number): Observable<any> {
    const query = `
      query GetMaterial($id: ID!) {
        getMaterialById(id: $id) {
          id
          nombre
          descripcion
          unidadMedida
          precio
          stockActual
          stockMinimo
          puntoReorden
          categoriaText
          activo
          imagen
          categoria {
            id
            nombre
            descripcion
            activo
          }
        }
      }
    `;

    return this.graphql.query<{ getMaterialById: GraphQLMaterial }>(query, { id: id.toString() }).pipe(
      map(response => this.mapGraphQLToMaterial(response.getMaterialById))
    );
  }

  /**
   * Crea un nuevo material
   * 
   * @param material - Datos del material a crear
   * @returns Observable con el material creado
   */
  createMaterial(material: any): Observable<any> {
    const mutation = `
      mutation CreateMaterial($input: MaterialInput!) {
        createMaterial(input: $input) {
          id
          nombre
          descripcion
          unidadMedida
          precio
          stockActual
          stockMinimo
          puntoReorden
          categoriaText
          activo
          imagen
          categoria {
            id
            nombre
            descripcion
            activo
          }
        }
      }
    `;

    const input = {
      nombre: material.nombre,
      descripcion: material.descripcion || null,
      unidadMedida: material.unidadMedida || 'UNIDAD',
      stockActual: material.stockActual || 0,
      stockMinimo: material.stockMinimo || 0,
      categoriaId: material.categoriaId ? material.categoriaId.toString() : null,
      sectorId: material.sectorId ? material.sectorId.toString() : null,
      imagen: material.imagen || null
    };

    return this.graphql.mutate<{ createMaterial: GraphQLMaterial }>(mutation, { input }).pipe(
      map(response => this.mapGraphQLToMaterial(response.createMaterial))
    );
  }

  /**
   * Actualiza un material existente
   * 
   * @param id - ID del material a actualizar
   * @param material - Datos actualizados del material
   * @returns Observable con el material actualizado
   */
  updateMaterial(id: number, material: any): Observable<any> {
    const mutation = `
      mutation UpdateMaterial($id: ID!, $input: MaterialInput!) {
        updateMaterial(id: $id, input: $input) {
          id
          nombre
          descripcion
          unidadMedida
          precio
          stockActual
          stockMinimo
          puntoReorden
          categoriaText
          activo
          imagen
          categoria {
            id
            nombre
            descripcion
            activo
          }
        }
      }
    `;

    const input = {
      nombre: material.nombre,
      descripcion: material.descripcion || null,
      unidadMedida: material.unidadMedida || 'UNIDAD',
      stockActual: material.stockActual || 0,
      stockMinimo: material.stockMinimo || 0,
      categoriaId: material.categoriaId ? material.categoriaId.toString() : null,
      sectorId: material.sectorId ? material.sectorId.toString() : null,
      imagen: material.imagen || null
    };

    return this.graphql.mutate<{ updateMaterial: GraphQLMaterial }>(mutation, {
      id: id.toString(),
      input
    }).pipe(
      map(response => this.mapGraphQLToMaterial(response.updateMaterial))
    );
  }

  /**
   * Elimina un material
   * 
   * @param id - ID del material a eliminar
   * @returns Observable con el resultado
   */
  deleteMaterial(id: number): Observable<any> {
    const mutation = `
      mutation DeleteMaterial($id: ID!) {
        deleteMaterial(id: $id)
      }
    `;

    return this.graphql.mutate<{ deleteMaterial: boolean }>(mutation, { id: id.toString() }).pipe(
      map(response => {
        if (!response.deleteMaterial) {
          throw new Error('No se pudo eliminar el material');
        }
        return { success: true };
      })
    );
  }

  /**
   * Actualiza el stock de un material
   * 
   * ⚠️ NO DISPONIBLE EN GRAPHQL
   * Se usa updateMaterial con el nuevo stock.
   * 
   * @param id - ID del material
   * @param payload - Objeto con la cantidad a actualizar
   * @returns Observable con el material actualizado
   */
  actualizarStock(id: number, payload: { cantidad: number }): Observable<any> {
    return this.getMaterial(id).pipe(
      switchMap(material => {
        material.stockActual = payload.cantidad;
        return this.updateMaterial(id, material);
      })
    );
  }

  /**
   * Actualiza la imagen de un material
   * 
   * ⚠️ NO DISPONIBLE EN GRAPHQL
   * Se usa updateMaterial con la nueva imagen.
   * 
   * @param id - ID del material
   * @param imagen - Objeto con la imagen (o URL)
   * @returns Observable con el material actualizado
   */
  actualizarImagen(id: number, imagen: any): Observable<any> {
    return this.getMaterial(id).pipe(
      switchMap(material => {
        material.imagen = imagen.imagen || imagen;
        return this.updateMaterial(id, material);
      })
    );
  }

  /**
   * Busca un material por nombre
   * 
   * @param nombre - Nombre del material a buscar
   * @returns Observable con el material encontrado (o array vacío)
   */
  buscarPorNombre(nombre: string): Observable<any> {
    const query = `
      query GetMaterialByNombre($nombre: String!) {
        getMaterialByNombre(nombre: $nombre) {
          id
          nombre
          descripcion
          unidadMedida
          precio
          stockActual
          stockMinimo
          activo
          imagen
          categoria {
            id
            nombre
          }
        }
      }
    `;

    return this.graphql.query<{ getMaterialByNombre: GraphQLMaterial }>(query, { nombre }).pipe(
      map(response => {
        if (!response.getMaterialByNombre) {
          return [];
        }
        return [this.mapGraphQLToMaterial(response.getMaterialByNombre)];
      }),
      catchError(() => of([]))
    );
  }

  /**
   * Obtiene materiales por proveedor
   * 
   * @param proveedorId - ID del proveedor
   * @returns Observable con array de materiales
   */
  getPorProveedor(proveedorId: number): Observable<any> {
    const query = `
      query GetMaterialesByProveedor($proveedorId: ID!) {
        getMaterialesByProveedor(proveedorId: $proveedorId) {
          id
          nombre
          descripcion
          unidadMedida
          precio
          stockActual
          stockMinimo
          activo
          imagen
          categoria {
            id
            nombre
          }
        }
      }
    `;

    return this.graphql.query<{ getMaterialesByProveedor: GraphQLMaterial[] }>(query, { proveedorId: proveedorId.toString() }).pipe(
      map(response => {
        return response.getMaterialesByProveedor.map(material => this.mapGraphQLToMaterial(material));
      })
    );
  }

  /**
   * Obtiene materiales que necesitan reabastecimiento
   * 
   * @returns Observable con array de materiales
   */
  getNecesitanReabastecimiento(): Observable<any[]> {
    const query = `
      query {
        getMaterialesNecesitanReabastecimiento {
          id
          nombre
          descripcion
          unidadMedida
          precio
          stockActual
          stockMinimo
          puntoReorden
          activo
          imagen
          categoria {
            id
            nombre
          }
        }
      }
    `;

    return this.graphql.query<{ getMaterialesNecesitanReabastecimiento: GraphQLMaterial[] }>(query).pipe(
      map(response => {
        return response.getMaterialesNecesitanReabastecimiento.map(material => this.mapGraphQLToMaterial(material));
      })
    );
  }

  /**
   * Obtiene materiales con stock bajo
   * 
   * @returns Observable con array de materiales
   */
  getBajoStock(): Observable<any[]> {
    const query = `
      query {
        getMaterialesConStockBajo {
          id
          nombre
          descripcion
          unidadMedida
          precio
          stockActual
          stockMinimo
          activo
          imagen
          categoria {
            id
            nombre
          }
        }
      }
    `;

    return this.graphql.query<{ getMaterialesConStockBajo: GraphQLMaterial[] }>(query).pipe(
      map(response => {
        return response.getMaterialesConStockBajo.map(material => this.mapGraphQLToMaterial(material));
      })
    );
  }

  /**
   * Busca materiales por término de búsqueda
   * 
   * @param q - Término de búsqueda
   * @returns Observable con array de materiales encontrados
   */
  buscar(q: string): Observable<any[]> {
    const query = `
      query BuscarMateriales($termino: String!) {
        buscarMateriales(termino: $termino) {
          id
          nombre
          descripcion
          unidadMedida
          precio
          stockActual
          stockMinimo
          activo
          imagen
          categoria {
            id
            nombre
          }
        }
      }
    `;

    return this.graphql.query<{ buscarMateriales: GraphQLMaterial[] }>(query, { termino: q }).pipe(
      map(response => {
        return response.buscarMateriales.map(material => this.mapGraphQLToMaterial(material));
      })
    );
  }

  /**
   * Mapea un material de GraphQL al formato esperado por los componentes
   * 
   * @param graphqlMaterial - Material en formato GraphQL
   * @returns Material en formato TypeScript
   */
  private mapGraphQLToMaterial(graphqlMaterial: GraphQLMaterial): any {
    return {
      id: parseInt(graphqlMaterial.id, 10),
      nombre: graphqlMaterial.nombre,
      descripcion: graphqlMaterial.descripcion || 'Sin descripción',
      unidadMedida: graphqlMaterial.unidadMedida,
      precio: graphqlMaterial.precio || 0,
      stockActual: graphqlMaterial.stockActual,
      stockMinimo: graphqlMaterial.stockMinimo,
      puntoReorden: graphqlMaterial.puntoReorden || null,
      categoriaText: graphqlMaterial.categoriaText || '',
      activo: graphqlMaterial.activo,
      imagen: graphqlMaterial.imagen || '',
      categoriaId: graphqlMaterial.categoria ? parseInt(graphqlMaterial.categoria.id, 10) : null,
      categoria: graphqlMaterial.categoria ? {
        id: parseInt(graphqlMaterial.categoria.id, 10),
        nombre: graphqlMaterial.categoria.nombre,
        descripcion: graphqlMaterial.categoria.descripcion || '',
        activo: graphqlMaterial.categoria.activo
      } : null,
      // Compatibilidad con nombres antiguos
      stock: graphqlMaterial.stockActual,
      stock_minimo: graphqlMaterial.stockMinimo
    };
  }
}
