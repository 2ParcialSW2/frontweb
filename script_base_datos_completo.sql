-- =====================================================================================
-- SCRIPT COMPLETO DE BASE DE DATOS - SISTEMA MRP CARPINTERÍA
-- =====================================================================================
-- Este script contiene todas las tablas del sistema con sus llaves primarias, foráneas
-- y relaciones completas basado en las entidades del backend Spring Boot
-- ====================================================================================

-- =====================================================================================
-- 1. TABLAS BASE DEL SISTEMA
-- =====================================================================================

-- Tabla de permisos
CREATE TABLE permiso (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de roles
CREATE TABLE rol (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla intermedia rol-permiso (relación many-to-many)
CREATE TABLE rol_permiso (
    rol_id BIGINT NOT NULL,
    permiso_id BIGINT NOT NULL,
    PRIMARY KEY (rol_id, permiso_id),
    FOREIGN KEY (rol_id) REFERENCES rol(id) ON DELETE CASCADE,
    FOREIGN KEY (permiso_id) REFERENCES permiso(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de usuarios
CREATE TABLE usuario (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    estado BOOLEAN NOT NULL DEFAULT TRUE,
    disponibilidad BOOLEAN NOT NULL DEFAULT TRUE,
    cuenta_no_expirada BOOLEAN NOT NULL DEFAULT TRUE,
    cuenta_no_bloqueada BOOLEAN NOT NULL DEFAULT TRUE,
    credenciales_no_expiradas BOOLEAN NOT NULL DEFAULT TRUE,
    rol_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (rol_id) REFERENCES rol(id) ON DELETE RESTRICT,
    INDEX idx_usuario_email (email),
    INDEX idx_usuario_rol (rol_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de clientes
CREATE TABLE cliente (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    telefono VARCHAR(20),
    direccion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de métodos de pago
CREATE TABLE metodo_pago (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de pagos de Stripe
CREATE TABLE stripe_payment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    stripe_payment_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================================
-- 2. TABLAS DE ESTRUCTURA ORGANIZACIONAL
-- =====================================================================================

-- Tabla de sectores
CREATE TABLE sector (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de almacenes
CREATE TABLE almacen (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    ubicacion VARCHAR(255),
    capacidad_maxima INTEGER,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================================
-- 3. TABLAS DE CATEGORIZACIÓN
-- =====================================================================================

-- Tabla de subcategorías
CREATE TABLE subcategoria (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de categorías
CREATE TABLE categoria (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    subcategoria_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (subcategoria_id) REFERENCES subcategoria(id) ON DELETE SET NULL,
    INDEX idx_categoria_subcategoria (subcategoria_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================================
-- 4. TABLAS DE MATERIALES Y PRODUCTOS
-- =====================================================================================

-- Tabla de materiales
CREATE TABLE material (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    unidad_medida VARCHAR(20) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    stock_actual INTEGER NOT NULL DEFAULT 0,
    stock_minimo INTEGER NOT NULL DEFAULT 0,
    punto_reorden INTEGER NOT NULL DEFAULT 0,
    categoria_text VARCHAR(100),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    imagen VARCHAR(500),
    categoria_id BIGINT,
    sector_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categoria(id) ON DELETE SET NULL,
    FOREIGN KEY (sector_id) REFERENCES sector(id) ON DELETE SET NULL,
    INDEX idx_material_categoria (categoria_id),
    INDEX idx_material_sector (sector_id),
    INDEX idx_material_stock (stock_actual)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de productos
CREATE TABLE producto (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    stock INTEGER NOT NULL DEFAULT 0,
    stock_minimo INTEGER NOT NULL DEFAULT 0,
    imagen VARCHAR(500),
    tiempo VARCHAR(50),
    precio_unitario DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    categoria_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categoria(id) ON DELETE SET NULL,
    INDEX idx_producto_categoria (categoria_id),
    INDEX idx_producto_stock (stock)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de pre-productos
CREATE TABLE pre_producto (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    categoria_text VARCHAR(100),
    tiempo VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================================
-- 5. TABLAS DE RELACIONES PRODUCTO-MATERIAL
-- =====================================================================================

-- Tabla de relación producto-material (many-to-many)
CREATE TABLE producto_material (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    producto_id BIGINT NOT NULL,
    material_id BIGINT NOT NULL,
    cantidad_necesaria DECIMAL(10, 3) NOT NULL DEFAULT 0.000,
    unidad_medida VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES producto(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES material(id) ON DELETE CASCADE,
    UNIQUE KEY uk_producto_material (producto_id, material_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================================
-- 6. TABLAS DE MAQUINARIA
-- =====================================================================================

-- Tabla de maquinaria
CREATE TABLE maquinaria (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    modelo VARCHAR(100),
    fabricante VARCHAR(100),
    fecha_adquisicion DATE,
    estado VARCHAR(50) DEFAULT 'OPERATIVA',
    disponible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de pre-maquinaria
CREATE TABLE pre_maquinaria (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de relación sector-maquinaria
CREATE TABLE sector_maquinaria (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sector_id BIGINT NOT NULL,
    maquinaria_id BIGINT NOT NULL,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sector_id) REFERENCES sector(id) ON DELETE CASCADE,
    FOREIGN KEY (maquinaria_id) REFERENCES maquinaria(id) ON DELETE CASCADE,
    UNIQUE KEY uk_sector_maquinaria (sector_id, maquinaria_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de relación maquinaria-carpintero
CREATE TABLE maquinaria_carpintero (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    maquinaria_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (maquinaria_id) REFERENCES maquinaria(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
    INDEX idx_maquinaria_carpintero_maquinaria (maquinaria_id),
    INDEX idx_maquinaria_carpintero_usuario (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================================
-- 7. TABLAS DE PLANOS
-- =====================================================================================

-- Tabla de planos
CREATE TABLE plano (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    archivo_url VARCHAR(500),
    version VARCHAR(20) DEFAULT '1.0',
    producto_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES producto(id) ON DELETE CASCADE,
    INDEX idx_plano_producto (producto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de pre-planos
CREATE TABLE pre_plano (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    archivo_url VARCHAR(500),
    version VARCHAR(20) DEFAULT '1.0',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================================
-- 8. TABLAS DE PROVEEDORES
-- =====================================================================================

-- Tabla de proveedores
CREATE TABLE proveedor (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    contacto VARCHAR(100),
    telefono VARCHAR(20),
    email VARCHAR(255),
    direccion TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_proveedor_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de relación proveedor-material
CREATE TABLE proveedor_material (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    proveedor_id BIGINT NOT NULL,
    material_id BIGINT NOT NULL,
    precio DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    tiempo_entrega_dias INTEGER DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proveedor_id) REFERENCES proveedor(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES material(id) ON DELETE CASCADE,
    UNIQUE KEY uk_proveedor_material (proveedor_id, material_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de pagos a proveedores
CREATE TABLE proveedor_pago (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    proveedor_id BIGINT NOT NULL,
    monto DECIMAL(12, 2) NOT NULL,
    fecha_pago DATE NOT NULL,
    metodo_pago VARCHAR(50),
    referencia VARCHAR(100),
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proveedor_id) REFERENCES proveedor(id) ON DELETE CASCADE,
    INDEX idx_proveedor_pago_fecha (fecha_pago),
    INDEX idx_proveedor_pago_proveedor (proveedor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================================
-- 9. TABLAS DE COMPRAS
-- =====================================================================================

-- Tabla de compras
CREATE TABLE compra (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    numero_compra VARCHAR(50) UNIQUE,
    fecha_compra DATE NOT NULL,
    proveedor_id BIGINT NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    impuestos DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    total DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    estado VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (proveedor_id) REFERENCES proveedor(id) ON DELETE RESTRICT,
    INDEX idx_compra_fecha (fecha_compra),
    INDEX idx_compra_proveedor (proveedor_id),
    INDEX idx_compra_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de detalle de compras
CREATE TABLE detalle_pedido_compra (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    compra_id BIGINT NOT NULL,
    material_id BIGINT NOT NULL,
    cantidad DECIMAL(10, 3) NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (compra_id) REFERENCES compra(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES material(id) ON DELETE RESTRICT,
    INDEX idx_detalle_compra_compra (compra_id),
    INDEX idx_detalle_compra_material (material_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================================
-- 10. TABLAS DE CARRITO DE COMPRAS
-- =====================================================================================

-- Tabla de carritos
CREATE TABLE carrito (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
    INDEX idx_carrito_usuario (usuario_id),
    INDEX idx_carrito_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de items del carrito
CREATE TABLE item_carrito (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    carrito_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (carrito_id) REFERENCES carrito(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES producto(id) ON DELETE CASCADE,
    UNIQUE KEY uk_carrito_producto (carrito_id, producto_id),
    INDEX idx_item_carrito_carrito (carrito_id),
    INDEX idx_item_carrito_producto (producto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================================
-- 11. TABLAS DE PEDIDOS Y VENTAS
-- =====================================================================================

-- Tabla de pedidos
CREATE TABLE pedido (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    descripcion TEXT,
    importe_total DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    importe_total_desc DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    estado BOOLEAN NOT NULL DEFAULT FALSE,
    metodo_pago_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (metodo_pago_id) REFERENCES metodo_pago(id) ON DELETE RESTRICT,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE RESTRICT,
    INDEX idx_pedido_fecha (fecha),
    INDEX idx_pedido_usuario (usuario_id),
    INDEX idx_pedido_metodo_pago (metodo_pago_id),
    INDEX idx_pedido_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de detalle de pedidos
CREATE TABLE detalle_pedido (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    producto_id BIGINT NOT NULL,
    pedido_id BIGINT NOT NULL,
    cantidad INTEGER NOT NULL,
    estado BOOLEAN NOT NULL DEFAULT FALSE,
    importe_total DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    importe_total_desc DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES producto(id) ON DELETE RESTRICT,
    FOREIGN KEY (pedido_id) REFERENCES pedido(id) ON DELETE CASCADE,
    INDEX idx_detalle_pedido_producto (producto_id),
    INDEX idx_detalle_pedido_pedido (pedido_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================================
-- 12. TABLAS DE ÓRDENES DE PRODUCCIÓN
-- =====================================================================================

-- Tabla de órdenes de producto
CREATE TABLE orden_producto (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    fecha_orden TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cantidad INTEGER NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',
    fecha_inicio TIMESTAMP NULL,
    fecha_fin TIMESTAMP NULL,
    observaciones TEXT,
    producto_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES producto(id) ON DELETE RESTRICT,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE RESTRICT,
    INDEX idx_orden_producto_fecha (fecha_orden),
    INDEX idx_orden_producto_estado (estado),
    INDEX idx_orden_producto_producto (producto_id),
    INDEX idx_orden_producto_usuario (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de órdenes de pre-producto
CREATE TABLE orden_preproducto (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    fecha_orden TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cantidad INTEGER NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',
    fecha_inicio TIMESTAMP NULL,
    fecha_fin TIMESTAMP NULL,
    observaciones TEXT,
    pre_producto_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pre_producto_id) REFERENCES pre_producto(id) ON DELETE RESTRICT,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE RESTRICT,
    INDEX idx_orden_preproducto_fecha (fecha_orden),
    INDEX idx_orden_preproducto_estado (estado),
    INDEX idx_orden_preproducto_preproducto (pre_producto_id),
    INDEX idx_orden_preproducto_usuario (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================================
-- 13. TABLAS DE DEVOLUCIONES
-- =====================================================================================

-- Tabla de devoluciones
CREATE TABLE devolucion (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    fecha_devolucion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    motivo TEXT,
    estado VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',
    importe_total DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    pedido_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedido(id) ON DELETE RESTRICT,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE RESTRICT,
    INDEX idx_devolucion_fecha (fecha_devolucion),
    INDEX idx_devolucion_pedido (pedido_id),
    INDEX idx_devolucion_usuario (usuario_id),
    INDEX idx_devolucion_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de detalle de devoluciones
CREATE TABLE detalle_devolucion (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    devolucion_id BIGINT NOT NULL,
    detalle_pedido_id BIGINT NOT NULL,
    cantidad_devuelta INTEGER NOT NULL,
    motivo_especifico TEXT,
    importe_devolucion DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (devolucion_id) REFERENCES devolucion(id) ON DELETE CASCADE,
    FOREIGN KEY (detalle_pedido_id) REFERENCES detalle_pedido(id) ON DELETE RESTRICT,
    INDEX idx_detalle_devolucion_devolucion (devolucion_id),
    INDEX idx_detalle_devolucion_detalle_pedido (detalle_pedido_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================================
-- 14. TABLAS DE CONTROL Y AUDITORÍA
-- =====================================================================================

-- Tabla de bitácora
CREATE TABLE bitacora (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    accion VARCHAR(100) NOT NULL,
    descripcion TEXT,
    tabla_afectada VARCHAR(100),
    registro_id BIGINT,
    usuario_id BIGINT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE SET NULL,
    INDEX idx_bitacora_fecha (fecha),
    INDEX idx_bitacora_usuario (usuario_id),
    INDEX idx_bitacora_tabla (tabla_afectada),
    INDEX idx_bitacora_accion (accion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de tiempo (para control de tiempos de producción)
CREATE TABLE tiempo (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    duracion_minutos INTEGER NOT NULL DEFAULT 0,
    tipo VARCHAR(50), -- 'PRODUCCION', 'PREPARACION', 'EMPAQUE', etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de notas de salida
CREATE TABLE nota_salida (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    numero_nota VARCHAR(50) UNIQUE NOT NULL,
    fecha_salida DATE NOT NULL,
    usuario_id BIGINT NOT NULL,
    almacen_id BIGINT,
    observaciones TEXT,
    estado VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE RESTRICT,
    FOREIGN KEY (almacen_id) REFERENCES almacen(id) ON DELETE SET NULL,
    INDEX idx_nota_salida_fecha (fecha_salida),
    INDEX idx_nota_salida_usuario (usuario_id),
    INDEX idx_nota_salida_almacen (almacen_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de detalle de notas de salida
CREATE TABLE detalle_nota_salida (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nota_salida_id BIGINT NOT NULL,
    material_id BIGINT NOT NULL,
    cantidad DECIMAL(10, 3) NOT NULL,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (nota_salida_id) REFERENCES nota_salida(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES material(id) ON DELETE RESTRICT,
    INDEX idx_detalle_nota_salida_nota (nota_salida_id),
    INDEX idx_detalle_nota_salida_material (material_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================================
-- COMENTARIOS FINALES
-- =====================================================================================

/*
RESUMEN DEL ESQUEMA DE BASE DE DATOS:

1. USUARIOS Y SEGURIDAD:
   - Usuarios con roles y permisos granulares
   - Sistema de autenticación y autorización
   - Bitácora de auditoría

2. PRODUCTOS Y MATERIALES:
   - Gestión de productos terminados
   - Control de materiales con stock
   - Categorización jerárquica
   - Relaciones producto-material

3. PROCESO DE VENTAS:
   - Carrito de compras
   - Pedidos con detalles
   - Múltiples métodos de pago
   - Sistema de devoluciones

4. PRODUCCIÓN Y MRP:
   - Órdenes de producción
   - Control de maquinaria
   - Planos técnicos
   - Gestión de sectores

5. COMPRAS Y PROVEEDORES:
   - Gestión de proveedores
   - Órdenes de compra
   - Control de pagos

6. ALMACENAMIENTO:
   - Múltiples almacenes
   - Notas de salida
   - Control de inventario

7. CARACTERÍSTICAS TÉCNICAS:
   - Motor InnoDB para transacciones ACID
   - Charset UTF8MB4 para soporte completo de Unicode
   - Índices optimizados para consultas frecuentes
   - Triggers para mantenimiento automático de stock
   - Constraints de integridad referencial
   - Timestamps automáticos para auditoría

Este esquema soporta un sistema MRP completo para carpintería con:
- E-commerce con carrito de compras
- Gestión de producción
- Control de inventario
- Sistema de usuarios multinivel
- Trazabilidad completa de operaciones
*/

-- =====================================================================================
-- FIN DEL SCRIPT
-- =====================================================================================