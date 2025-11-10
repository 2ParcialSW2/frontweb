import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../enviroment';

export interface ProductCluster {
  cluster_id: number;
  nombre_cluster: string;
  margen_calculado: number;
  caracteristicas?: {
    margen_promedio: number;
    precio_promedio: number;
    tiempo_fabricacion_promedio: number;
    cantidad_productos: number;
  };
  recomendaciones: string[];
}

export interface ClusterAnalysis {
  cluster_id: number;
  nombre_cluster: string;
  caracteristicas: {
    margen_promedio: number;
    precio_promedio: number;
    tiempo_fabricacion_promedio: number;
    cantidad_productos: number;
  };
  recomendaciones: string[];
}

export interface SingleProductRequest {
  nombre: string;
  categoria: string;
  precio: number;
  costo: number;
  tiempo_fabricacion: number;
}

export interface SingleProductResponse {
  status: string;
  producto: SingleProductRequest;
  cluster_result: ProductCluster;
  message?: string;
}

export interface ClusterAnalysisResponse {
  status: string;
  clusters: ClusterAnalysis[];
  total_clusters: number;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MlClusteringService {
  private readonly API_URL = environment.mlApiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Predice el cluster de un producto específico
   * @param product Datos del producto a analizar
   * @returns Observable con el resultado del clustering
   */
  predictSingleProduct(product: SingleProductRequest): Observable<SingleProductResponse> {
    const url = `${this.API_URL}/clustering/single`;
    
    // Validar datos del producto
    if (!this.validateProductData(product)) {
      return throwError(() => new Error('Datos del producto inválidos'));
    }
    
    return this.http.post<SingleProductResponse>(url, product).pipe(
      retry(2),
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene análisis completo de todos los clusters
   * @returns Observable con información de todos los clusters
   */
  getClusterAnalysis(): Observable<ClusterAnalysisResponse> {
    const url = `${this.API_URL}/clustering/analysis`;
    
    return this.http.get<ClusterAnalysisResponse>(url).pipe(
      retry(2),
      catchError(this.handleError)
    );
  }

  /**
   * Analiza múltiples productos en batch
   * @param products Array de productos a analizar
   * @returns Observable con resultados de clustering para cada producto
   */
  predictMultipleProducts(products: SingleProductRequest[]): Observable<{ [productName: string]: SingleProductResponse }> {
    const results: { [productName: string]: SingleProductResponse } = {};
    let completed = 0;
    
    return new Observable(observer => {
      products.forEach(product => {
        this.predictSingleProduct(product).subscribe({
          next: (response) => {
            results[product.nombre] = response;
            completed++;
            if (completed === products.length) {
              observer.next(results);
              observer.complete();
            }
          },
          error: (error) => {
            console.error(`Error analyzing product ${product.nombre}:`, error);
            // Generar resultado mock para este producto
            results[product.nombre] = this.generateMockProductCluster(product);
            completed++;
            if (completed === products.length) {
              observer.next(results);
              observer.complete();
            }
          }
        });
      });
    });
  }

  /**
   * Obtiene recomendaciones específicas para un cluster
   * @param clusterId ID del cluster
   * @param product Datos del producto (opcional)
   * @returns Array de recomendaciones personalizadas
   */
  getClusterRecommendations(clusterId: number, product?: SingleProductRequest): string[] {
    const baseRecommendations = this.getBaseRecommendationsByCluster(clusterId);
    
    if (!product) {
      return baseRecommendations;
    }
    
    const customRecommendations = [...baseRecommendations];
    
    // Agregar recomendaciones basadas en el producto específico
    const margen = (product.precio - product.costo) / product.precio;
    
    if (margen < 0.2) {
      customRecommendations.push('⚠️ Margen muy bajo - revisar costos urgentemente');
    } else if (margen > 0.6) {
      customRecommendations.push('💰 Excelente margen - considerar estrategia premium');
    }
    
    if (product.tiempo_fabricacion > 10) {
      customRecommendations.push('⏰ Tiempo de fabricación alto - optimizar proceso');
    } else if (product.tiempo_fabricacion < 3) {
      customRecommendations.push('🚀 Fabricación rápida - ideal para pedidos urgentes');
    }
    
    return customRecommendations;
  }

  /**
   * Verifica si el servicio de clustering está disponible
   * @returns Observable<boolean>
   */
  checkServiceHealth(): Observable<boolean> {
    const url = `${this.API_URL}/health`;
    
    return new Observable(observer => {
      this.http.get(url).subscribe({
        next: () => {
          observer.next(true);
          observer.complete();
        },
        error: () => {
          observer.next(false);
          observer.complete();
        }
      });
    });
  }

  /**
   * Genera datos de clustering mock para desarrollo/fallback
   * @returns Análisis de clusters de ejemplo
   */
  generateMockClusterAnalysis(): ClusterAnalysisResponse {
    return {
      status: 'success',
      total_clusters: 3,
      clusters: [
        {
          cluster_id: 0,
          nombre_cluster: 'Productos Premium',
          caracteristicas: {
            margen_promedio: 0.587,
            precio_promedio: 750.5,
            tiempo_fabricacion_promedio: 8.2,
            cantidad_productos: 6
          },
          recomendaciones: [
            '🌟 Maximizar volumen de ventas',
            '🎯 Target: clientes premium',
            '📈 Marketing enfocado en calidad',
            '💎 Destacar materiales premium'
          ]
        },
        {
          cluster_id: 1,
          nombre_cluster: 'Productos Básicos',
          caracteristicas: {
            margen_promedio: 0.312,
            precio_promedio: 180.3,
            tiempo_fabricacion_promedio: 3.1,
            cantidad_productos: 8
          },
          recomendaciones: [
            '⚠️ Revisar costos de producción',
            '📊 Ideal para mercado masivo',
            '🔄 Enfocar en volumen y rotación',
            '💰 Considerar economías de escala'
          ]
        },
        {
          cluster_id: 2,
          nombre_cluster: 'Productos Equilibrados',
          caracteristicas: {
            margen_promedio: 0.425,
            precio_promedio: 350.8,
            tiempo_fabricacion_promedio: 5.5,
            cantidad_productos: 12
          },
          recomendaciones: [
            '⚖️ Buen balance precio-calidad',
            '📈 Potencial de crecimiento',
            '🎨 Diferenciación por diseño',
            '🛠️ Optimizar proceso productivo'
          ]
        }
      ],
      message: 'Mock data - API ML no disponible'
    };
  }

  /**
   * Genera resultado mock para un producto específico
   * @param product Datos del producto
   * @returns Resultado de clustering mock
   */
  generateMockProductCluster(product: SingleProductRequest): SingleProductResponse {
    const margen = (product.precio - product.costo) / product.precio;
    
    // Determinar cluster basado en margen y precio
    let clusterId: number;
    let nombreCluster: string;
    
    if (margen > 0.5 && product.precio > 500) {
      clusterId = 0;
      nombreCluster = 'Productos Premium';
    } else if (margen < 0.35 && product.precio < 250) {
      clusterId = 1;
      nombreCluster = 'Productos Básicos';
    } else {
      clusterId = 2;
      nombreCluster = 'Productos Equilibrados';
    }
    
    return {
      status: 'success',
      producto: product,
      cluster_result: {
        cluster_id: clusterId,
        nombre_cluster: nombreCluster,
        margen_calculado: margen,
        recomendaciones: this.getClusterRecommendations(clusterId, product)
      },
      message: 'Mock analysis - API ML no disponible'
    };
  }

  /**
   * Valida los datos de entrada del producto
   * @param product Datos del producto a validar
   * @returns true si los datos son válidos
   */
  private validateProductData(product: SingleProductRequest): boolean {
    return !!(
      product.nombre &&
      product.categoria &&
      product.precio > 0 &&
      product.costo >= 0 &&
      product.costo < product.precio &&
      product.tiempo_fabricacion > 0
    );
  }

  /**
   * Obtiene recomendaciones base por cluster
   * @param clusterId ID del cluster
   * @returns Array de recomendaciones
   */
  private getBaseRecommendationsByCluster(clusterId: number): string[] {
    const recommendations: { [key: number]: string[] } = {
      0: [ // Premium
        '🌟 Maximizar volumen de ventas',
        '🎯 Target: clientes premium',
        '📈 Marketing enfocado en calidad'
      ],
      1: [ // Básico
        '⚠️ Revisar costos de producción',
        '📊 Ideal para mercado masivo',
        '🔄 Enfocar en volumen y rotación'
      ],
      2: [ // Equilibrado
        '⚖️ Buen balance precio-calidad',
        '📈 Potencial de crecimiento',
        '🎨 Diferenciación por diseño'
      ]
    };
    
    return recommendations[clusterId] || ['🤔 Análisis requerido'];
  }

  /**
   * Maneja errores HTTP
   * @param error Error HTTP
   * @returns Observable con error
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error del cliente: ${error.error.message}`;
    } else {
      errorMessage = `Error del servidor: ${error.status} - ${error.message}`;
      
      switch (error.status) {
        case 404:
          errorMessage = 'Servicio de clustering ML no encontrado.';
          break;
        case 400:
          errorMessage = 'Datos del producto inválidos para análisis ML.';
          break;
        case 500:
          errorMessage = 'Error interno del servicio de clustering ML.';
          break;
        case 0:
          errorMessage = 'No se puede conectar al servicio de clustering ML.';
          break;
      }
    }
    
    console.error('Error en ML Clustering Service:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}