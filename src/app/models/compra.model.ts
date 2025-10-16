export interface Compra {
  id: number;
  fecha: string | Date;
  estado: string;
  importe_total: number;
  importe_descuento: number;
  proveedorId: number;
  usuarioId: number;
  observaciones?: string;
  // Relaciones
  proveedor?: {
    id: number;
    nombre: string;
    [key: string]: any;
  };
  usuario?: any;
  detalles?: DetallePedidoCompra[];
}

export interface CompraDTO {
  fecha: string | Date;
  estado: string;
  importe_total: number;
  importe_descuento: number;
  proveedorId: number;
  usuarioId: number;
  observaciones?: string;
}

export interface DetallePedidoCompra {
  id: number;
  compraId: number;
  materialId: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  precio?: number;
  importe?: number;
  importe_desc?: number;
  estado?: string;
  // Relaciones
  material?: any;
  compra?: Compra;
}

export interface DetallePedidoCompraDTO {
  id?: number;
  compraId: number;
  materialId: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  precio?: number;
  importe?: number;
  importe_desc?: number;
  estado?: string;
} 