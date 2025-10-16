export interface Maquinaria {
  id: number;
  nombre: string;
  estado: string;
}

export interface PreMaquinaria {
  id: number;
  cantidad: number;
  descripcion: string;
  tiempoEstimado: string;
  maquinaria: Maquinaria;
  preProducto?: any;
}

export interface PreMaquinariaDTO {
  id?: number;
  cantidad: number;
  descripcion: string;
  tiempoEstimado: string;
  maquinariaId: number;
  preProductoId: number;
}
