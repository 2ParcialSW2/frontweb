import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MlForecastService, ForecastPrediction, ForecastApiResponse } from '../../services/ml-forecast.service';
import { MlClusteringService, ClusterAnalysis, SingleProductRequest, SingleProductResponse } from '../../services/ml-clustering.service';

// Interface para manejar productos con análisis ML
interface ProductoConML {
  id?: number;
  nombre: string;
  categoria?: string;
  precio?: number;
  costo?: number;
  tiempoFabricacion?: number;
  cluster_prediction?: any;
  isAnalyzing?: boolean;
}

@Component({
  selector: 'app-ml-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ml-dashboard.component.html',
  styleUrls: ['./ml-dashboard.component.css']
})
export class MlDashboardComponent implements OnInit {
  // Forecast data
  forecastData: ForecastPrediction[] = [];
  selectedCategory: string = 'sillas';
  categories = ['sillas', 'mesas', 'camas', 'armarios'];
  
  // Clustering data
  clusterAnalysis: ClusterAnalysis[] = [];
  productos: ProductoConML[] = [];
  
  // UI state
  isLoadingForecast = false;
  isLoadingClusters = false;
  isLoadingProducts = false;
  
  // Service health
  mlServiceAvailable = false;
  
  // Computed values para forecast
  totalIngresos = 0;
  totalUnidades = 0;
  promedioConfianza = 0;
  alertas: string[] = [];

  constructor(
    private forecastService: MlForecastService,
    private clusteringService: MlClusteringService
  ) {}

  ngOnInit() {
    this.checkMLServiceHealth();
    this.loadForecastData();
    this.loadClusterAnalysis();
    this.loadProductosMock(); // Cargar productos mock inicialmente
  }

  /**
   * Verifica si el servicio ML está disponible
   */
  async checkMLServiceHealth() {
    try {
      this.mlServiceAvailable = await this.forecastService.checkServiceHealth().toPromise() || false;
    } catch (error) {
      this.mlServiceAvailable = false;
      console.log('Servicio ML no disponible, usando datos mock');
    }
  }

  /**
   * Carga datos de predicción de ventas
   */
  loadForecastData() {
    this.isLoadingForecast = true;
    
    this.forecastService.getForecastByCategory(this.selectedCategory).subscribe({
      next: (response: ForecastApiResponse) => {
        if (response.status === 'success' && response.predictions) {
          this.forecastData = response.predictions;
        } else {
          this.generateMockForecastData();
        }
        this.calculateSummaryStats();
        this.generateAlertas();
        this.isLoadingForecast = false;
      },
      error: (error) => {
        console.warn('Error loading forecast, using mock data:', error);
        this.generateMockForecastData();
        this.calculateSummaryStats();
        this.generateAlertas();
        this.isLoadingForecast = false;
      }
    });
  }

  /**
   * Carga análisis de clusters
   */
  loadClusterAnalysis() {
    this.isLoadingClusters = true;
    
    this.clusteringService.getClusterAnalysis().subscribe({
      next: (response) => {
        if (response.status === 'success' && response.clusters) {
          this.clusterAnalysis = response.clusters;
        } else {
          this.clusterAnalysis = this.clusteringService.generateMockClusterAnalysis().clusters;
        }
        this.isLoadingClusters = false;
      },
      error: (error) => {
        console.warn('Error loading clusters, using mock data:', error);
        this.clusterAnalysis = this.clusteringService.generateMockClusterAnalysis().clusters;
        this.isLoadingClusters = false;
      }
    });
  }

  /**
   * Carga productos mock para demostración
   */
  loadProductosMock() {
    this.productos = [
      {
        id: 1,
        nombre: 'Mesa Ejecutiva Premium',
        categoria: 'mesas',
        precio: 850,
        costo: 380,
        tiempoFabricacion: 8.5
      },
      {
        id: 2,
        nombre: 'Silla Ergonómica Básica',
        categoria: 'sillas',
        precio: 150,
        costo: 95,
        tiempoFabricacion: 2.5
      },
      {
        id: 3,
        nombre: 'Cama King Size',
        categoria: 'camas',
        precio: 650,
        costo: 320,
        tiempoFabricacion: 6.0
      },
      {
        id: 4,
        nombre: 'Armario Modular',
        categoria: 'armarios',
        precio: 1200,
        costo: 500,
        tiempoFabricacion: 12.0
      },
      {
        id: 5,
        nombre: 'Mesa de Centro',
        categoria: 'mesas',
        precio: 280,
        costo: 140,
        tiempoFabricacion: 3.5
      }
    ].map(p => ({
      ...p,
      cluster_prediction: null,
      isAnalyzing: false
    }));
  }

  /**
   * Maneja cambio de categoría en forecast
   */
  onCategoryChange() {
    this.loadForecastData();
  }

  /**
   * Analiza un producto específico con ML
   */
  analyzeProduct(producto: ProductoConML) {
    if (!this.validateProductForAnalysis(producto)) {
      alert('El producto necesita tener precio, costo y tiempo de fabricación para el análisis ML');
      return;
    }

    producto.isAnalyzing = true;
    
    const productData: SingleProductRequest = {
      nombre: producto.nombre,
      categoria: producto.categoria || this.selectedCategory,
      precio: producto.precio!,
      costo: producto.costo!,
      tiempo_fabricacion: producto.tiempoFabricacion || 5.0
    };

    this.clusteringService.predictSingleProduct(productData).subscribe({
      next: (response: SingleProductResponse) => {
        if (response.status === 'success' && response.cluster_result) {
          producto.cluster_prediction = response.cluster_result;
        } else {
          // Usar predicción mock si hay problemas
          const mockResponse = this.clusteringService.generateMockProductCluster(productData);
          producto.cluster_prediction = mockResponse.cluster_result;
        }
        producto.isAnalyzing = false;
      },
      error: (error) => {
        console.warn(`Error analyzing product ${producto.nombre}, using mock:`, error);
        // Generar resultado mock
        const mockResponse = this.clusteringService.generateMockProductCluster(productData);
        producto.cluster_prediction = mockResponse.cluster_result;
        producto.isAnalyzing = false;
      }
    });
  }

  /**
   * Analiza todos los productos válidos
   */
  analyzeAllProducts() {
    const validProducts = this.productos.filter(p => this.validateProductForAnalysis(p));
    
    if (validProducts.length === 0) {
      alert('No hay productos válidos para análisis ML');
      return;
    }

    validProducts.forEach(producto => {
      if (!producto.cluster_prediction && !producto.isAnalyzing) {
        setTimeout(() => this.analyzeProduct(producto), Math.random() * 1000);
      }
    });
  }

  /**
   * Calcula estadísticas resumen del forecast
   */
  private calculateSummaryStats() {
    if (this.forecastData.length === 0) return;
    
    this.totalIngresos = this.forecastData.reduce((sum, item) => sum + item.ingreso_estimado, 0);
    this.totalUnidades = this.forecastData.reduce((sum, item) => sum + ((item.prediccion_min + item.prediccion_max) / 2), 0);
    this.promedioConfianza = this.forecastData.reduce((sum, item) => sum + item.confianza, 0) / this.forecastData.length;
  }

  /**
   * Genera alertas basadas en los datos de forecast
   */
  private generateAlertas() {
    this.alertas = [];
    
    if (this.forecastData.length === 0) return;
    
    // Detectar picos de demanda en fines de semana
    const weekendData = this.forecastData.filter(item => {
      const date = new Date(item.fecha);
      return [0, 6].includes(date.getDay());
    });
    
    if (weekendData.length > 0) {
      const avgWeekend = weekendData.reduce((sum, item) => sum + item.prediccion_max, 0) / weekendData.length;
      const avgWeekday = this.forecastData
        .filter(item => {
          const date = new Date(item.fecha);
          return ![0, 6].includes(date.getDay());
        })
        .reduce((sum, item, _, arr) => arr.length ? sum + item.prediccion_max / arr.length : 0, 0);
      
      if (avgWeekend > avgWeekday * 1.2) {
        this.alertas.push('📈 Pico de demanda detectado en fines de semana');
      }
    }
    
    // Detectar baja confianza
    if (this.promedioConfianza < 0.7) {
      this.alertas.push('⚠️ Confianza de predicción baja - revisar datos históricos');
    }
    
    // Detectar tendencia descendente
    const firstWeek = this.forecastData.slice(0, 7);
    const lastWeek = this.forecastData.slice(-7);
    const firstWeekAvg = firstWeek.reduce((sum, item) => sum + item.prediccion_max, 0) / 7;
    const lastWeekAvg = lastWeek.reduce((sum, item) => sum + item.prediccion_max, 0) / 7;
    
    if (lastWeekAvg < firstWeekAvg * 0.8) {
      this.alertas.push('📉 Tendencia descendente en demanda proyectada');
    }
  }

  /**
   * Genera datos de forecast mock
   */
  private generateMockForecastData() {
    this.forecastData = this.forecastService.generateMockForecast(this.selectedCategory, 30).predictions;
  }

  /**
   * Valida si un producto tiene datos suficientes para análisis ML
   */
  validateProductForAnalysis(producto: ProductoConML): boolean {
    return !!(
      producto.nombre &&
      producto.precio && producto.precio > 0 &&
      producto.costo !== undefined && producto.costo >= 0 &&
      producto.precio > producto.costo
    );
  }

  // Métodos para UI helpers

  /**
   * Obtiene clase CSS para badge de cluster
   */
  getClusterBadgeClass(clusterName: string): string {
    if (clusterName.toLowerCase().includes('premium') || clusterName.toLowerCase().includes('estrella')) {
      return 'badge-premium';
    } else if (clusterName.toLowerCase().includes('básico') || clusterName.toLowerCase().includes('basico') || clusterName.toLowerCase().includes('económico')) {
      return 'badge-basic';
    }
    return 'badge-medium';
  }

  /**
   * Determina nivel de prioridad basado en margen
   */
  getPriorityLevel(margen: number): { text: string, class: string } {
    if (margen > 0.5) return { text: 'ALTA', class: 'priority-high' };
    if (margen > 0.3) return { text: 'MEDIA', class: 'priority-medium' };
    return { text: 'BAJA', class: 'priority-low' };
  }

  /**
   * Convierte confianza a estrellas visuales
   */
  getConfidenceStars(confidence: number): string {
    const stars = Math.round(confidence * 5);
    return '●'.repeat(stars) + '○'.repeat(5 - stars);
  }

  /**
   * Calcula margen de un producto
   */
  calculateMargin(producto: ProductoConML): number {
    if (!producto.precio || !producto.costo) return 0;
    return ((producto.precio - producto.costo) / producto.precio) * 100;
  }

  /**
   * Formatea números grandes
   */
  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toFixed(0);
  }

  /**
   * Obtiene color para gráfico de barras
   */
  getBarColor(index: number): string {
    const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6'];
    return colors[index % colors.length];
  }

  /**
   * Cuenta productos analizados
   */
  getProductosAnalizados(): number {
    return this.productos.filter(p => p.cluster_prediction).length;
  }

  /**
   * Cuenta productos pendientes de análisis
   */
  getProductosPendientes(): number {
    return this.productos.filter(p => !p.cluster_prediction && !p.isAnalyzing).length;
  }
}