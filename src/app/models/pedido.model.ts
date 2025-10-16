export interface Pedido {
  id?: number;
  fecha: string;
  descripcion?: string;
  importe_total: number;
  importe_total_desc: number;
  estado: boolean;
  metodo_pago?: MetodoPago;
  metodo_pago_nombre?: string; // Nombre del método de pago desde backend
  metodoPago?: string; // Campo alternativo del método de pago
  usuario?: any;
  detalle_pedidos?: DetallePedido[];
}

export interface PedidoDTO {
  fecha: Date | string;
  descripcion?: string;
  importe_total: number;
  importe_total_desc: number;
  estado: boolean;
  usuario_id?: number;
  metodo_pago_id: number;
}

export interface DetallePedido {
  id?: number;
  cantidad: number;
  estado?: boolean;
  precio_unitario?: number;
  precioUnitario?: number; // Alternativo para compatibilidad
  subtotal?: number;
  importe_total?: number; // Para compatibilidad con backend
  importe_total_desc?: number; // Para compatibilidad con backend
  producto?: any;
  pedido?: Pedido;
}

export interface DetallePedidoDTO {
  cantidad: number;
  precio_unitario?: number;
  precioUnitario?: number;
  subtotal?: number;
  importe_Total?: number;
  importe_Total_Desc?: number;
  pedido_id?: number;
  pedidoId?: number;
  producto_id?: number;
  productoId?: number;
}

export interface MetodoPago {
  id?: number;
  nombre: string;
  descripcion: string;
}

export interface MetodoPagoDTO {
  nombre: string;
  descripcion: string;
}
