import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GraphQLService } from './graphql.service';
import { Compra, CompraDTO } from '../models/compra.model';

/**
 * Interfaz para la respuesta GraphQL de Compra
 */
interface GraphQLCompra {
  id: string;
  estado?: string | null;
  fecha?: string | null;
  importe_total?: number | null;
  importe_descuento?: number | null;
  proveedor?: {
    id: string;
    nombre: string;
  } | null;
  usuario?: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
  } | null;
}

/**
 * Servicio para gestionar compras usando GraphQL
 * 
 * Migrado de REST a GraphQL manteniendo la misma interfaz pública
 * para compatibilidad con componentes existentes.
 */
@Injectable({
  providedIn: 'root'
})
export class ComprasService {
  constructor(private graphql: GraphQLService) {}

  /**
   * Obtiene todas las compras
   * 
   * @returns Observable con array de compras
   */
  getCompras(): Observable<Compra[]> {
    const query = `
      query {
        getAllCompras {
          id
          estado
          fecha
          importe_total
          importe_descuento
          proveedor {
            id
            nombre
          }
          usuario {
            id
            nombre
            apellido
            email
          }
        }
      }
    `;

    return this.graphql.query<{ getAllCompras: GraphQLCompra[] }>(query).pipe(
      map(response => {
        return response.getAllCompras.map(compra => this.mapGraphQLToCompra(compra));
      })
    );
  }

  /**
   * Obtiene una compra por ID
   * 
   * @param id - ID de la compra
   * @returns Observable con la compra
   */
  getCompra(id: number): Observable<any> {
    const query = `
      query GetCompra($id: ID!) {
        getCompraById(id: $id) {
          id
          estado
          fecha
          importe_total
          importe_descuento
          proveedor {
            id
            nombre
          }
          usuario {
            id
            nombre
            apellido
            email
          }
        }
      }
    `;

    return this.graphql.query<{ getCompraById: GraphQLCompra }>(query, { id: id.toString() }).pipe(
      map(response => this.mapGraphQLToCompra(response.getCompraById))
    );
  }

  /**
   * Crea una nueva compra
   * 
   * @param compra - Datos de la compra a crear
   * @returns Observable con la compra creada
   */
  createCompra(compra: CompraDTO): Observable<any> {
    const mutation = `
      mutation CreateCompra($input: CompraInput!) {
        createCompra(input: $input) {
          id
          estado
          fecha
          importe_total
          importe_descuento
          proveedor {
            id
            nombre
          }
          usuario {
            id
            nombre
            apellido
            email
          }
        }
      }
    `;

    const input = {
      estado: compra.estado,
      fecha: compra.fecha ? (typeof compra.fecha === 'string' ? compra.fecha : this.formatDate(new Date(compra.fecha))) : null,
      importe_total: compra.importe_total || null,
      importe_descuento: compra.importe_descuento || null,
      proveedor_id: compra.proveedorId.toString(),
      usuario_id: compra.usuarioId.toString()
    };

    return this.graphql.mutate<{ createCompra: GraphQLCompra }>(mutation, { input }).pipe(
      map(response => this.mapGraphQLToCompra(response.createCompra))
    );
  }

  /**
   * Actualiza una compra existente
   * 
   * @param id - ID de la compra a actualizar
   * @param compra - Datos actualizados de la compra
   * @returns Observable con la compra actualizada
   */
  updateCompra(id: number, compra: CompraDTO): Observable<any> {
    const mutation = `
      mutation UpdateCompra($id: ID!, $input: CompraInput!) {
        updateCompra(id: $id, input: $input) {
          id
          estado
          fecha
          importe_total
          importe_descuento
          proveedor {
            id
            nombre
          }
          usuario {
            id
            nombre
            apellido
            email
          }
        }
      }
    `;

    const input = {
      estado: compra.estado,
      fecha: compra.fecha ? (typeof compra.fecha === 'string' ? compra.fecha : this.formatDate(new Date(compra.fecha))) : null,
      importe_total: compra.importe_total || null,
      importe_descuento: compra.importe_descuento || null,
      proveedor_id: compra.proveedorId.toString(),
      usuario_id: compra.usuarioId.toString()
    };

    return this.graphql.mutate<{ updateCompra: GraphQLCompra }>(mutation, {
      id: id.toString(),
      input
    }).pipe(
      map(response => this.mapGraphQLToCompra(response.updateCompra))
    );
  }

  /**
   * Elimina una compra
   * 
   * @param id - ID de la compra a eliminar
   * @returns Observable con el resultado
   */
  deleteCompra(id: number): Observable<any> {
    const mutation = `
      mutation DeleteCompra($id: ID!) {
        deleteCompra(id: $id)
      }
    `;

    return this.graphql.mutate<{ deleteCompra: boolean }>(mutation, { id: id.toString() }).pipe(
      map(response => {
        if (!response.deleteCompra) {
          throw new Error('No se pudo eliminar la compra');
        }
        return { success: true };
      })
    );
  }

  /**
   * Obtiene compras por estado
   * 
   * @param estado - Estado de la compra
   * @returns Observable con array de compras
   */
  getComprasPorEstado(estado: string): Observable<Compra[]> {
    return this.getComprasByEstado(estado);
  }

  /**
   * Obtiene compras por proveedor
   * 
   * @param proveedorId - ID del proveedor
   * @returns Observable con array de compras
   */
  getComprasPorProveedor(proveedorId: number): Observable<Compra[]> {
    return this.getComprasByProveedor(proveedorId);
  }

  /**
   * Obtiene compras por estado
   * 
   * @param estado - Estado de la compra
   * @returns Observable con array de compras
   */
  getComprasByEstado(estado: string): Observable<any[]> {
    const query = `
      query GetComprasByEstado($estado: String!) {
        getComprasByEstado(estado: $estado) {
          id
          estado
          fecha
          importe_total
          importe_descuento
          proveedor {
            id
            nombre
          }
          usuario {
            id
            nombre
            apellido
            email
          }
        }
      }
    `;

    return this.graphql.query<{ getComprasByEstado: GraphQLCompra[] }>(query, { estado }).pipe(
      map(response => {
        return response.getComprasByEstado.map(compra => this.mapGraphQLToCompra(compra));
      })
    );
  }

  /**
   * Obtiene compras por proveedor
   * 
   * @param proveedorId - ID del proveedor
   * @returns Observable con array de compras
   */
  getComprasByProveedor(proveedorId: number): Observable<any[]> {
    const query = `
      query GetComprasByProveedor($proveedorId: ID!) {
        getComprasByProveedor(proveedorId: $proveedorId) {
          id
          estado
          fecha
          importe_total
          importe_descuento
          proveedor {
            id
            nombre
          }
          usuario {
            id
            nombre
            apellido
            email
          }
        }
      }
    `;

    return this.graphql.query<{ getComprasByProveedor: GraphQLCompra[] }>(query, {
      proveedorId: proveedorId.toString()
    }).pipe(
      map(response => {
        return response.getComprasByProveedor.map(compra => this.mapGraphQLToCompra(compra));
      })
    );
  }

  /**
   * Obtiene compras por rango de fechas
   * 
   * ⚠️ NO DISPONIBLE DIRECTAMENTE EN GRAPHQL
   * Se obtienen todas las compras y se filtran por fechas en el cliente.
   * 
   * @param fechaInicio - Fecha de inicio
   * @param fechaFin - Fecha de fin
   * @returns Observable con array de compras
   */
  getComprasByFechas(fechaInicio: Date, fechaFin: Date): Observable<any[]> {
    return this.getCompras().pipe(
      map(compras => compras.filter(compra => {
        const fechaCompra = new Date(compra.fecha);
        return fechaCompra >= fechaInicio && fechaCompra <= fechaFin;
      }))
    );
  }

  /**
   * Obtiene compras por material y rango de fechas
   * 
   * ⚠️ NO DISPONIBLE DIRECTAMENTE EN GRAPHQL
   * Se obtienen todas las compras y se filtran en el cliente.
   * 
   * @param materialId - ID del material
   * @param fechaInicio - Fecha de inicio
   * @param fechaFin - Fecha de fin
   * @returns Observable con array de compras
   */
  getComprasByMaterialYFechas(materialId: number, fechaInicio: Date, fechaFin: Date): Observable<any[]> {
    return this.getCompras().pipe(
      map(compras => compras.filter(compra => {
        const fechaCompra = new Date(compra.fecha);
        const tieneMaterial = compra.detalles?.some(detalle => detalle.materialId === materialId);
        return fechaCompra >= fechaInicio && fechaCompra <= fechaFin && tieneMaterial;
      }))
    );
  }

  /**
   * Obtiene compras por proveedor y rango de fechas
   * 
   * @param proveedorId - ID del proveedor
   * @param fechaInicio - Fecha de inicio
   * @param fechaFin - Fecha de fin
   * @returns Observable con array de compras
   */
  getComprasByProveedorYFechas(proveedorId: number, fechaInicio: Date, fechaFin: Date): Observable<any[]> {
    return this.getComprasByProveedor(proveedorId).pipe(
      map(compras => compras.filter(compra => {
        const fechaCompra = new Date(compra.fecha);
        return fechaCompra >= fechaInicio && fechaCompra <= fechaFin;
      }))
    );
  }

  /**
   * Obtiene compras por estado y rango de fechas
   * 
   * @param estado - Estado de la compra
   * @param fechaInicio - Fecha de inicio
   * @param fechaFin - Fecha de fin
   * @returns Observable con array de compras
   */
  getComprasByEstadoYFechas(estado: string, fechaInicio: Date, fechaFin: Date): Observable<any[]> {
    return this.getComprasByEstado(estado).pipe(
      map(compras => compras.filter(compra => {
        const fechaCompra = new Date(compra.fecha);
        return fechaCompra >= fechaInicio && fechaCompra <= fechaFin;
      }))
    );
  }

  /**
   * Formatea una fecha a string YYYY-MM-DD
   * 
   * @param date - Fecha a formatear
   * @returns String con la fecha formateada
   */
  private formatDate(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }

  /**
   * Mapea una compra de GraphQL al formato esperado por los componentes
   * 
   * @param graphqlCompra - Compra en formato GraphQL
   * @returns Compra en formato TypeScript
   */
  private mapGraphQLToCompra(graphqlCompra: GraphQLCompra): Compra {
    return {
      id: parseInt(graphqlCompra.id, 10),
      estado: graphqlCompra.estado || '',
      fecha: graphqlCompra.fecha || '',
      importe_total: graphqlCompra.importe_total || 0,
      importe_descuento: graphqlCompra.importe_descuento || 0,
      proveedorId: graphqlCompra.proveedor ? parseInt(graphqlCompra.proveedor.id, 10) : 0,
      usuarioId: graphqlCompra.usuario ? parseInt(graphqlCompra.usuario.id, 10) : 0,
      proveedor: graphqlCompra.proveedor ? {
        id: parseInt(graphqlCompra.proveedor.id, 10),
        nombre: graphqlCompra.proveedor.nombre
      } : undefined,
      usuario: graphqlCompra.usuario ? {
        id: parseInt(graphqlCompra.usuario.id, 10),
        nombre: graphqlCompra.usuario.nombre,
        apellido: graphqlCompra.usuario.apellido,
        email: graphqlCompra.usuario.email
      } : undefined
    };
  }
}
