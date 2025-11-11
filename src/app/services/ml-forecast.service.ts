import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../enviroment';

export interface ForecastPrediction {
  fecha: string;
  categoria: string;
  prediccion_min: number;
  prediccion_max: number;
  confianza: number;
  ingreso_estimado: number;
}

export interface ForecastRequest {
  data_path?: string;
  categoria: string;
  horizon?: number;
  precio?: number;
}

export interface ForecastApiResponse {
  status: string;
  predictions: ForecastPrediction[];
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MlForecastService {
  private readonly API_URL = environment.mlApiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Predice ventas usando el modelo de forecast
   * @param request Datos para la predicción
   * @returns Observable con las predicciones
   */
  predictForecast(request: ForecastRequest): Observable<ForecastApiResponse> {
    const url = `${this.API_URL}/forecast`;
    
    return this.http.post<ForecastApiResponse>(url, request).pipe(
      retry(2), // Reintentar 2 veces en caso de error
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene predicción por categoría específica
   * @param categoria Categoría del producto (sillas, mesas, etc.)
   * @param horizon Días de predicción (default: 30)
   * @param precio Precio estimado para cálculo de ingresos
   * @returns Observable con las predicciones
   */
  getForecastByCategory(
    categoria: string, 
    horizon: number = 30, 
    precio?: number
  ): Observable<ForecastApiResponse> {
    const request: ForecastRequest = {
      categoria: categoria.toLowerCase(),
      horizon,
      data_path: 'data/current_mrp_dataset.csv' // Path por defecto
    };
    
    if (precio) {
      request.precio = precio;
    }
    
    return this.predictForecast(request);
  }

  /**
   * Obtiene predicciones para múltiples categorías
   * @param categorias Array de categorías
   * @param horizon Días de predicción
   * @returns Observable con predicciones combinadas
   */
  getForecastMultipleCategories(
    categorias: string[], 
    horizon: number = 30
  ): Observable<{ [categoria: string]: ForecastApiResponse }> {
    const requests: { [categoria: string]: Observable<ForecastApiResponse> } = {};
    
    categorias.forEach(categoria => {
      requests[categoria] = this.getForecastByCategory(categoria, horizon);
    });
    
    // Convertir a un observable que emita un objeto con todas las respuestas
    return new Observable(observer => {
      const results: { [categoria: string]: ForecastApiResponse } = {};
      let completed = 0;
      
      Object.keys(requests).forEach(categoria => {
        requests[categoria].subscribe({
          next: (response) => {
            results[categoria] = response;
            completed++;
            if (completed === categorias.length) {
              observer.next(results);
              observer.complete();
            }
          },
          error: (error) => {
            console.error(`Error forecasting ${categoria}:`, error);
            // Continúa con datos mock para esta categoría
            results[categoria] = this.generateMockForecast(categoria, horizon);
            completed++;
            if (completed === categorias.length) {
              observer.next(results);
              observer.complete();
            }
          }
        });
      });
    });
  }

  /**
   * Verifica si el servicio ML está disponible
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
   * Genera datos de forecast mock para desarrollo/fallback
   * @param categoria Categoría del producto
   * @param horizon Días de predicción
   * @returns Datos de ejemplo
   */
  generateMockForecast(categoria: string, horizon: number = 30): ForecastApiResponse {
    const predictions: ForecastPrediction[] = [];
    const basePrice = this.getBasePriceByCategory(categoria);
    
    for (let i = 0; i < horizon; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      const variation = Math.sin(i * 0.2) * 0.3 + 1; // Variación sinusoidal
      const weekendBoost = [0, 6].includes(date.getDay()) ? 1.3 : 1; // Boost fin de semana
      
      const baseQuantity = Math.floor(Math.random() * 5) + 3;
      const min = Math.floor(baseQuantity * variation * weekendBoost);
      const max = Math.floor(min * 1.5) + 2;
      
      predictions.push({
        fecha: date.toISOString().split('T')[0],
        categoria: categoria.toLowerCase(),
        prediccion_min: min,
        prediccion_max: max,
        confianza: Math.random() * 0.25 + 0.7, // Confianza entre 70% y 95%
        ingreso_estimado: ((min + max) / 2) * basePrice
      });
    }
    
    return {
      status: 'success',
      predictions,
      message: 'Mock data - API ML no disponible'
    };
  }

  /**
   * Obtiene precio base por categoría para cálculos mock
   * @param categoria Categoría del producto
   * @returns Precio base estimado
   */
  private getBasePriceByCategory(categoria: string): number {
    const prices: { [key: string]: number } = {
      'sillas': 150,
      'mesas': 300,
      'camas': 500,
      'armarios': 800,
      'escritorios': 250,
      'sofas': 600
    };
    
    return prices[categoria.toLowerCase()] || 200;
  }

  /**
   * Maneja errores HTTP
   * @param error Error HTTP
   * @returns Observable con error
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error del cliente: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = `Error del servidor: ${error.status} - ${error.message}`;
      
      // Manejar códigos de error específicos
      switch (error.status) {
        case 404:
          errorMessage = 'Servicio ML no encontrado. Verifica que esté ejecutándose.';
          break;
        case 500:
          errorMessage = 'Error interno del servicio ML.';
          break;
        case 0:
          errorMessage = 'No se puede conectar al servicio ML. Verifica la URL y CORS.';
          break;
      }
    }
    
    console.error('Error en ML Forecast Service:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}