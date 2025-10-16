export interface DevolucionCreateDTO {
    fecha: string;
    motivo: string;
    descripcion: string;
    importe_total: number;
    estado: boolean;
    usuario_id: number;
    pedido_id: number;
}

export interface UsuarioDTO {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    estado: boolean;
    disponibilidad: boolean;
}

export interface MetodoPagoDTO {
    id: number;
    nombre: string;
    descripcion: string;
}

export interface CategoriaDTO {
    id: number;
    nombre: string;
    descripcion: string;
    activo: boolean;
    subCategoria?: {
        id: number;
        nombre: string;
        descripcion: string;
    };
}

export interface ProductoDTO {
    id: number;
    nombre: string;
    descripcion: string;
    stock: number;
    stock_minimo: number;
    imagen: string;
    tiempo: string;
    precioUnitario: number;
    categoria: CategoriaDTO;
}

export interface DetallePedidoDTO {
    id: number;
    producto: ProductoDTO;
    cantidad: number;
    importe_Total: number;
    importe_Total_Desc: number;
    precioUnitario: number;
    estado: boolean;
}

export interface PedidoDTO {
    id: number;
    fecha: string;
    descripcion: string;
    importe_total: number;
    importe_total_desc: number;
    estado: boolean;
    metodo_pago: MetodoPagoDTO;
    usuario: string | UsuarioDTO;
    detalle_pedidos: DetallePedidoDTO[];
}

export interface DetalleDevolucionDTO {
    id: number;
    cantidad: number;
    importe_Total: number;
    motivo_detalle: string;
    devolucion: string;
    detalle_pedido: DetallePedidoDTO;
}

export interface DetalleDevolucionCreateDTO {
    detallePedidoId: number;
    cantidad: number;
    motivo_detalle?: string;
}

export interface DetalleDevolucionResponseDTO {
    id: number;
    detallePedidoId: number;
    nombreProducto: string;
    cantidad: number;
    precioUnitario: number;
    motivo_detalle: string;
}

export interface DevolucionResponseDTO {
    id: number;
    fecha: string;
    motivo: string;
    descripcion: string;
    importe_total: number;
    estado: boolean;
    usuarioId: number;
    usuarioNombre: string;
    usuarioEmail: string;
    pedidoId: number;
    pedidoFecha: string;
    detalles: DetalleDevolucionResponseDTO[];
}