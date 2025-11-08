import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { GraphQLService } from './graphql.service';

/**
 * Interfaz para la respuesta GraphQL de productos
 */
interface GraphQLProducto {
  id: string;
  nombre: string;
  descripcion?: string | null;
  stock: number;
  stockMinimo: number;
  imagen?: string | null;
  tiempo?: string | null;
  precioUnitario: number;
  categoria?: {
    id: string;
    nombre: string;
    descripcion?: string | null;
    activo: boolean;
  } | null;
}

/**
 * Servicio para gestionar productos usando GraphQL
 * 
 * Migrado de REST a GraphQL manteniendo la misma interfaz pública
 * para compatibilidad con componentes existentes.
 * 
 * Nota: Algunos métodos no están disponibles en GraphQL y se mantienen
 * como placeholders o se implementan con filtrado en cliente.
 */
@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  constructor(private graphql: GraphQLService) {}

  /**
   * Obtiene todos los productos
   * 
   * @returns Observable con array de productos
   */
  getProductos(): Observable<any[]> {
    const query = `
      query {
        getAllProducts {
          id
          nombre
          descripcion
          stock
          stockMinimo
          imagen
          tiempo
          precioUnitario
          categoria {
            id
            nombre
            descripcion
            activo
          }
        }
      }
    `;

    return this.graphql.query<{ getAllProducts: GraphQLProducto[] }>(query).pipe(
      map(response => {
        return response.getAllProducts.map(this.mapGraphQLToProducto);
      })
    );
  }

  /**
   * Obtiene un producto por su ID
   * 
   * @param id - ID del producto
   * @returns Observable con el producto
   */
  getProducto(id: number): Observable<any> {
    const query = `
      query GetProducto($id: ID!) {
        getProductById(id: $id) {
          id
          nombre
          descripcion
          stock
          stockMinimo
          imagen
          tiempo
          precioUnitario
          categoria {
            id
            nombre
            descripcion
            activo
          }
        }
      }
    `;

    return this.graphql.query<{ getProductById: GraphQLProducto }>(query, { id: id.toString() }).pipe(
      map(response => this.mapGraphQLToProducto(response.getProductById))
    );
  }

  /**
   * Crea un nuevo producto
   * 
   * @param producto - Datos del producto a crear
   * @returns Observable con el producto creado
   */
  createProducto(producto: any): Observable<any> {
    const mutation = `
      mutation CreateProducto($input: ProductoInput!) {
        createProduct(input: $input) {
          id
          nombre
          descripcion
          stock
          stockMinimo
          imagen
          tiempo
          precioUnitario
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
      nombre: producto.nombre,
      descripcion: producto.descripcion || null,
      precioUnitario: producto.precioUnitario || producto.precio_unitario || 0,
      stock: producto.stock || 0,
      stockMinimo: producto.stockMinimo || producto.stock_minimo || 0,
      tiempo: producto.tiempo || null,
      imagen: producto.imagen || null,
      categoriaId: producto.categoriaId || producto.categoria_id ? (producto.categoriaId || producto.categoria_id).toString() : null
    };

    return this.graphql.mutate<{ createProduct: GraphQLProducto }>(mutation, { input }).pipe(
      map(response => this.mapGraphQLToProducto(response.createProduct))
    );
  }

  /**
   * Actualiza un producto existente
   * 
   * @param id - ID del producto a actualizar
   * @param producto - Datos actualizados del producto
   * @returns Observable con el producto actualizado
   */
  updateProducto(id: number, producto: any): Observable<any> {
    const mutation = `
      mutation UpdateProducto($id: ID!, $input: ProductoInput!) {
        updateProduct(id: $id, input: $input) {
          id
          nombre
          descripcion
          stock
          stockMinimo
          imagen
          tiempo
          precioUnitario
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
      nombre: producto.nombre,
      descripcion: producto.descripcion || null,
      precioUnitario: producto.precioUnitario || producto.precio_unitario || 0,
      stock: producto.stock || 0,
      stockMinimo: producto.stockMinimo || producto.stock_minimo || 0,
      tiempo: producto.tiempo || null,
      imagen: producto.imagen || null,
      categoriaId: producto.categoriaId || producto.categoria_id ? (producto.categoriaId || producto.categoria_id).toString() : null
    };

    return this.graphql.mutate<{ updateProduct: GraphQLProducto }>(mutation, {
      id: id.toString(),
      input
    }).pipe(
      map(response => this.mapGraphQLToProducto(response.updateProduct))
    );
  }

  /**
   * Elimina un producto
   * 
   * @param id - ID del producto a eliminar
   * @returns Observable con el resultado
   */
  deleteProducto(id: number): Observable<any> {
    const mutation = `
      mutation DeleteProducto($id: ID!) {
        deleteProduct(id: $id)
      }
    `;

    return this.graphql.mutate<{ deleteProduct: boolean }>(mutation, { id: id.toString() }).pipe(
      map(response => {
        if (!response.deleteProduct) {
          throw new Error('No se pudo eliminar el producto');
        }
        return { success: true };
      })
    );
  }

  /**
   * Busca productos por término de búsqueda
   * 
   * Nota: El backend GraphQL no tiene una query específica de búsqueda,
   * por lo que se obtienen todos y se filtran en el cliente.
   * Esto se puede optimizar agregando una query de búsqueda en el backend.
   * 
   * @param query - Término de búsqueda
   * @returns Observable con array de productos filtrados
   */
  buscarProductos(query: string): Observable<any[]> {
    // Por ahora, obtener todos y filtrar en el cliente
    // TODO: Agregar query de búsqueda en el backend GraphQL
    return this.getProductos().pipe(
      map(productos => {
        if (!query || query.trim() === '') {
          return productos;
        }
        const termino = query.toLowerCase();
        return productos.filter(producto =>
          producto.nombre?.toLowerCase().includes(termino) ||
          producto.descripcion?.toLowerCase().includes(termino)
        );
      })
    );
  }

  /**
   * Registra producción de un producto
   * 
   * ⚠️ NO DISPONIBLE EN GRAPHQL
   * Este método no está disponible en el schema GraphQL actual.
   * Se debe usar el endpoint REST o agregar la mutation en el backend.
   * 
   * @param id - ID del producto
   * @param cantidad - Cantidad a producir
   * @returns Observable con error indicando que no está disponible
   */
  registerProduction(id: number, cantidad: number): Observable<any> {
    return throwError(() => new Error(
      'registerProduction no está disponible en GraphQL. ' +
      'Usa el endpoint REST o agrega la mutation en el backend GraphQL.'
    ));
  }

  /**
   * Actualiza el stock de un producto
   * 
   * ⚠️ NO DISPONIBLE EN GRAPHQL
   * Este método no está disponible en el schema GraphQL actual.
   * Se puede usar updateProducto con el nuevo stock.
   * 
   * @param id - ID del producto
   * @param cantidad - Nueva cantidad de stock
   * @returns Observable con el producto actualizado
   */
  updateStockProducto(id: number, cantidad: number): Observable<any> {
    // Alternativa: Obtener el producto y actualizarlo con el nuevo stock
    return this.getProducto(id).pipe(
      switchMap(producto => {
        producto.stock = cantidad;
        return this.updateProducto(id, producto);
      })
    );
  }

  /**
   * Actualiza la imagen de un producto
   * 
   * ⚠️ NO DISPONIBLE EN GRAPHQL
   * Este método no está disponible en el schema GraphQL actual.
   * Se puede usar updateProducto con la nueva imagen.
   * 
   * @param id - ID del producto
   * @param url - URL de la nueva imagen
   * @returns Observable con el producto actualizado
   */
  updateImageProducto(id: number, url: string): Observable<any> {
    // Alternativa: Obtener el producto y actualizarlo con la nueva imagen
    return this.getProducto(id).pipe(
      switchMap(producto => {
        producto.imagen = url;
        return this.updateProducto(id, producto);
      })
    );
  }

  /**
   * Obtiene los materiales de un producto
   * 
   * ⚠️ NO DISPONIBLE EN GRAPHQL
   * Este método no está disponible en el schema GraphQL actual.
   * Se debe usar el endpoint REST o agregar la query en el backend.
   * 
   * @param id - ID del producto
   * @returns Observable con error indicando que no está disponible
   */
  getMateriales(id: number): Observable<any> {
    return throwError(() => new Error(
      'getMateriales no está disponible en GraphQL. ' +
      'Usa el endpoint REST o agrega la query en el backend GraphQL.'
    ));
  }

  /**
   * Obtiene productos con stock bajo
   * 
   * ⚠️ NO DISPONIBLE EN GRAPHQL
   * Este método no está disponible en el schema GraphQL actual.
   * Se puede filtrar en el cliente o agregar la query en el backend.
   * 
   * @param id - Parámetro no usado (mantenido para compatibilidad)
   * @returns Observable con productos con stock bajo
   */
  getBajoStock(id: number): Observable<any> {
    // Alternativa: Obtener todos y filtrar en el cliente
    return this.getProductos().pipe(
      map(productos => {
        return productos.filter(producto => 
          producto.stock <= producto.stockMinimo
        );
      })
    );
  }

  /**
   * Verifica la disponibilidad de un producto
   * 
   * ⚠️ NO DISPONIBLE EN GRAPHQL
   * Este método no está disponible en el schema GraphQL actual.
   * Se puede verificar obteniendo el producto y comparando stock.
   * 
   * @param id - ID del producto
   * @param cantidad - Cantidad a verificar
   * @returns Observable con resultado de disponibilidad
   */
  verificarDisponibilidad(id: number, cantidad: number): Observable<any> {
    // Alternativa: Obtener el producto y verificar stock
    return this.getProducto(id).pipe(
      map(producto => {
        return {
          disponible: producto.stock >= cantidad,
          stockDisponible: producto.stock,
          cantidadSolicitada: cantidad
        };
      })
    );
  }

  /**
   * Mapea un producto de GraphQL al formato esperado por los componentes
   * 
   * @param graphqlProducto - Producto en formato GraphQL
   * @returns Producto en formato TypeScript
   */
  private mapGraphQLToProducto(graphqlProducto: GraphQLProducto): any {
    return {
      id: parseInt(graphqlProducto.id, 10),
      nombre: graphqlProducto.nombre,
      descripcion: graphqlProducto.descripcion || '',
      stock: graphqlProducto.stock,
      stockMinimo: graphqlProducto.stockMinimo,
      stock_minimo: graphqlProducto.stockMinimo, // Compatibilidad con formato antiguo
      imagen: graphqlProducto.imagen || '',
      tiempo: graphqlProducto.tiempo || '',
      precioUnitario: graphqlProducto.precioUnitario,
      precio_unitario: graphqlProducto.precioUnitario, // Compatibilidad con formato antiguo
      categoriaId: graphqlProducto.categoria ? parseInt(graphqlProducto.categoria.id, 10) : null,
      categoria_id: graphqlProducto.categoria ? parseInt(graphqlProducto.categoria.id, 10) : null, // Compatibilidad
      categoria: graphqlProducto.categoria ? {
        id: parseInt(graphqlProducto.categoria.id, 10),
        nombre: graphqlProducto.categoria.nombre,
        descripcion: graphqlProducto.categoria.descripcion || '',
        activo: graphqlProducto.categoria.activo
      } : null
    };
  }
}
