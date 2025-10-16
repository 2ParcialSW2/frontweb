export interface PreProducto {
  id: number;
  nombre: string;
  descripcion: string;
  stock: number;
  tiempo: string;
  url_Image?: string;
}

export interface PreProductoDTO {
  nombre: string;
  descripcion: string;
  stock: number;
  tiempo: string;
  url_Image?: string;
}

export interface ResumenPlanificacion {
  preProducto: {
    id: number;
    nombre: string;
    descripcion: string;
    stock: number;
    tiempo: string;
    url_Image?: string;
  };
  planificacionCompleta: boolean;
  totalMaquinarias: number;
  tiempoTotalEstimado: string;
}

