import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComprasService } from '../../services/compras.service';
import { DetallePedidoCompraService } from '../../services/detalle-pedido-compra.service';
import { ProveedoresService } from '../../services/proveedores.service';
import { MaterialesService } from '../../services/materiales.service';
import { AuthService } from '../../services/auth.service';
import { Compra, CompraDTO, DetallePedidoCompra, DetallePedidoCompraDTO } from '../../models/compra.model';

@Component({
  selector: 'app-compras',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './compras.component.html'
})
export class ComprasComponent implements OnInit {
  compras: Compra[] = [];
  proveedores: any[] = [];
  materiales: any[] = [];
  detallesCompra: DetallePedidoCompra[] = [];
  
  compraSeleccionada: Compra | null = null;
  detalleSeleccionado: DetallePedidoCompra | null = null;
  
  // Nueva compra y sus detalles
  nuevaCompra: CompraDTO = {
    fecha: new Date().toISOString().split('T')[0],
    estado: 'PENDIENTE',
    importe_total: 0,
    importe_descuento: 0,
    proveedorId: 0,
    usuarioId: 0
  };
  
  nuevosDetalles: DetallePedidoCompraDTO[] = [];
  
  nuevoDetalle: DetallePedidoCompraDTO = {
    compraId: 0,
    materialId: 0,
    cantidad: 1,
    precioUnitario: 0,
    subtotal: 0
  };
  
  // Estados para filtrado
  estadosFiltro: string[] = ['PENDIENTE', 'APROBADO', 'RECHAZADO', 'COMPLETADO'];
  estadoSeleccionado: string = '';
  proveedorSeleccionadoId: number = 0;
  
  // Modales
  isModalRegistroCompraOpen: boolean = false;
  isModalDetalleCompraOpen: boolean = false;
  isModalNuevoDetalleOpen: boolean = false;
  isModalEditarCompraOpen: boolean = false;
  
  constructor(
    private comprasService: ComprasService,
    private detallePedidoCompraService: DetallePedidoCompraService,
    private proveedoresService: ProveedoresService,
    private materialesService: MaterialesService,
    private authService: AuthService
  ) {}
  
  ngOnInit(): void {
    // Cargar los materiales primero, luego los proveedores y finalmente las compras
    this.obtenerMateriales(() => {
      this.obtenerProveedores();
    });
  }
  
  obtenerProveedores(): void {
    console.log('Obteniendo proveedores...');
    this.proveedoresService.getProveedores().subscribe(
      data => {
        console.log('Proveedores recibidos:', data);
        this.proveedores = data;
        // Una vez cargados los proveedores, cargamos las compras
        this.obtenerCompras();
      },
      error => {
        console.error('Error al obtener proveedores:', error);
        // Si hay error, intentamos cargar las compras de todas formas
        this.obtenerCompras();
      }
    );
  }
  
  obtenerMateriales(callback?: () => void): void {
    console.log('Obteniendo materiales...');
    this.materialesService.getMaterialesCompletos().subscribe(
      data => {
        console.log(`Materiales recibidos: ${data.length} materiales`);
        // Log detallado de los primeros 5 materiales para depuración
        if (data && data.length > 0) {
          console.log('Muestra de materiales (primeros 5):', 
            data.slice(0, 5).map(m => ({ id: m.id, nombre: m.nombre })));
        }
        this.materiales = data;
        
        // Si hay una función de callback, ejecutarla
        if (callback) {
          callback();
        }
      },
      error => {
        console.error('Error al obtener materiales:', error);
        // Si hay una función de callback, ejecutarla incluso si hay error
        if (callback) {
          callback();
        }
      }
    );
  }
  
  obtenerCompras(): void {
    console.log('Obteniendo compras...');
    this.comprasService.getCompras().subscribe(
      data => {
        console.log('Compras recibidas (sin procesar):', JSON.stringify(data));
        
        // Verificamos que cada compra tenga un proveedorId válido
        this.compras = data.map(compra => {
          // Depuración detallada de cada compra
          console.log('Procesando compra:', compra);
          console.log('ID de la compra:', compra.id);
          console.log('proveedorId original:', compra.proveedorId);
          console.log('objeto proveedor:', compra.proveedor);
          
          // Crear una copia para no modificar el objeto original
          const compraProcessed = { ...compra };
          
          // Si proveedorId es undefined pero existe el objeto proveedor
          if (compra.proveedor && compra.proveedor.id && !compra.proveedorId) {
            console.log('Asignando proveedorId desde objeto proveedor:', compra.proveedor.id);
            compraProcessed.proveedorId = compra.proveedor.id;
          }
          
          // Si aún no tenemos proveedorId pero hay algo en proveedor que podría ser el id
          if (!compraProcessed.proveedorId && compra.proveedor) {
            // Intentar encontrar el id en alguna propiedad del objeto proveedor
            for (const key in compra.proveedor) {
              if (key.toLowerCase().includes('id') && typeof compra.proveedor[key] === 'number') {
                console.log(`Encontrado posible proveedorId en proveedor.${key}:`, compra.proveedor[key]);
                compraProcessed.proveedorId = compra.proveedor[key];
                break;
              }
            }
          }
          
          return compraProcessed;
        });
        
        console.log('Compras procesadas:', this.compras);
      },
      error => {
        console.error('Error al obtener compras:', error);
      }
    );
  }
  
  registrarCompra(): void {
    // Verificar que proveedorId está correctamente asignado
    console.log('Datos de compra a registrar:', this.nuevaCompra);
    
    // Comprobar si proveedorId es un número válido
    if (!this.nuevaCompra.proveedorId || this.nuevaCompra.proveedorId <= 0) {
      console.error('Error: proveedorId no es válido', this.nuevaCompra.proveedorId);
      alert('Por favor seleccione un proveedor válido');
      return;
    }
    
    // Obtener el ID del usuario actual
    this.nuevaCompra.usuarioId = this.authService.obtenerUsuarioId();
    
    // Calcular el total basado en los detalles
    let totalCompra = 0;
    this.nuevosDetalles.forEach(detalle => {
      totalCompra += detalle.subtotal;
    });
    
    this.nuevaCompra.importe_total = totalCompra;
    
    console.log('Enviando compra al servidor con estos datos:', JSON.stringify(this.nuevaCompra));
    
    this.comprasService.createCompra(this.nuevaCompra).subscribe(response => {
      console.log('Respuesta del servidor al crear compra:', response);
      
      const compraId = response.data.id;
      
      // Crear los detalles asociados a la compra
      if (this.nuevosDetalles.length > 0) {
        const promesasDetalles = this.nuevosDetalles.map(detalle => {
          detalle.compraId = compraId;
          return this.detallePedidoCompraService.createDetallePedido(detalle).toPromise();
        });
        
        Promise.all(promesasDetalles)
          .then(() => {
            this.obtenerCompras();
            this.cerrarModalRegistroCompra();
            this.limpiarFormularioCompra();
          })
          .catch(error => {
            console.error('Error al guardar los detalles:', error);
          });
      } else {
        this.obtenerCompras();
        this.cerrarModalRegistroCompra();
        this.limpiarFormularioCompra();
      }
    });
  }
  
  actualizarCompra(): void {
    if (!this.compraSeleccionada) return;
    
    const compraDTO: CompraDTO = {
      fecha: this.compraSeleccionada.fecha,
      estado: this.compraSeleccionada.estado,
      importe_total: this.compraSeleccionada.importe_total,
      importe_descuento: this.compraSeleccionada.importe_descuento,
      proveedorId: this.compraSeleccionada.proveedorId,
      usuarioId: this.compraSeleccionada.usuarioId,
      observaciones: this.compraSeleccionada.observaciones
    };
    
    const id = this.compraSeleccionada.id;
    this.comprasService.updateCompra(id, compraDTO).subscribe(() => {
      this.obtenerCompras();
      this.cerrarModalEditarCompra();
    });
  }
  
  eliminarCompra(id: number): void {
    if (confirm('¿Está seguro de eliminar esta compra?')) {
      this.comprasService.deleteCompra(id).subscribe(() => {
        this.obtenerCompras();
      });
    }
  }
  
  verDetallesCompra(compra: Compra): void {
    console.log('Abriendo detalles para compra ID:', compra.id);
    this.compraSeleccionada = compra;
    
    // Obtener los detalles de la compra
    this.detallePedidoCompraService.getDetallesPorCompra(compra.id).subscribe({
      next: (detalles) => {
        console.log(`Recibidos ${detalles.length} detalles para la compra ${compra.id}`);
        
        // Si no hay materiales cargados, cargarlos primero
        if (!this.materiales || this.materiales.length === 0) {
          console.log('Cargando materiales antes de procesar detalles...');
          this.materialesService.getMaterialesCompletos().subscribe({
            next: (materiales) => {
              console.log(`Materiales cargados: ${materiales.length}`);
              this.materiales = materiales;
              this.procesarDetallesConMateriales(detalles);
            },
            error: (err) => {
              console.error('Error al cargar materiales:', err);
              // Continuar sin materiales
              this.procesarDetallesConMateriales(detalles);
            }
          });
        } else {
          // Ya tenemos materiales, procesar directamente
          this.procesarDetallesConMateriales(detalles);
        }
      },
      error: (error) => {
        console.error('Error al obtener detalles de la compra:', error);
        alert('Error al cargar los detalles de la compra. Por favor, intente nuevamente.');
      }
    });
  }
  
  // Método para procesar los detalles y enriquecer con información de materiales
  private procesarDetallesConMateriales(detalles: DetallePedidoCompra[]): void {
    console.log('Procesando detalles con materiales disponibles...');
    
    // Procesar cada detalle para asignar el objeto material completo
    this.detallesCompra = detalles.map(detalle => {
      // Verificar si ya tiene un objeto material completo
      if (detalle.material && detalle.material.nombre) {
        console.log(`Detalle ${detalle.id}: Ya tiene material con nombre "${detalle.material.nombre}"`);
        return detalle;
      }
      
      // Si tiene materialId, buscar en la lista de materiales
      if (detalle.materialId && this.materiales && this.materiales.length > 0) {
        const materialEncontrado = this.materiales.find(m => m.id === detalle.materialId);
        
        if (materialEncontrado) {
          console.log(`Detalle ${detalle.id}: Material encontrado - "${materialEncontrado.nombre}"`);
          // Crear una copia del detalle para no modificar el original
          return {
            ...detalle,
            material: {
              ...materialEncontrado
            }
          };
        } else {
          console.log(`Detalle ${detalle.id}: Material con ID ${detalle.materialId} no encontrado en la lista`);
        }
      }
      
      // Si no se pudo encontrar el material, retornar el detalle original
      return detalle;
    });
    
    // Abrir el modal con los detalles procesados
    this.abrirModalDetalleCompra();
  }
  
  agregarDetalleANuevaCompra(): void {
    // Validar que se haya seleccionado un material
    if (!this.nuevoDetalle.materialId || this.nuevoDetalle.materialId <= 0) {
      alert('Por favor seleccione un material');
      return;
    }
    
    // Validar que la cantidad sea mayor que 0
    if (!this.nuevoDetalle.cantidad || this.nuevoDetalle.cantidad <= 0) {
      alert('La cantidad debe ser mayor que 0');
      return;
    }
    
    // Validar que el precio unitario sea un número válido
    if (this.nuevoDetalle.precioUnitario === undefined || this.nuevoDetalle.precioUnitario === null) {
      this.nuevoDetalle.precioUnitario = 0;
    }
    
    // Asegurar que el precio sea un número
    this.nuevoDetalle.precioUnitario = Number(this.nuevoDetalle.precioUnitario);
    
    // Calcular el subtotal con valores seguros
    this.nuevoDetalle.subtotal = this.nuevoDetalle.cantidad * this.nuevoDetalle.precioUnitario;
    
    console.log('Agregando detalle a nueva compra:', JSON.stringify(this.nuevoDetalle));
    
    // Crear una copia del objeto para evitar referencias con todos los campos necesarios
    const detalleCopia = {
      compraId: this.nuevoDetalle.compraId,
      materialId: this.nuevoDetalle.materialId,
      cantidad: this.nuevoDetalle.cantidad,
      precioUnitario: this.nuevoDetalle.precioUnitario,
      subtotal: this.nuevoDetalle.subtotal,
      // Añadir los campos que espera el backend
      precio: this.nuevoDetalle.precioUnitario,
      importe: this.nuevoDetalle.subtotal,
      importe_desc: 0,
      estado: 'PENDIENTE'
    };
    
    this.nuevosDetalles.push(detalleCopia);
    
    // Recalcular el total de la compra
    let total = 0;
    this.nuevosDetalles.forEach(detalle => {
      total += detalle.subtotal;
    });
    this.nuevaCompra.importe_total = total;
    
    this.limpiarFormularioDetalle();
  }
  
  eliminarDetalleDeNuevaCompra(index: number): void {
    this.nuevosDetalles.splice(index, 1);
    
    // Recalcular el total de la compra
    let total = 0;
    this.nuevosDetalles.forEach(detalle => {
      total += detalle.subtotal;
    });
    this.nuevaCompra.importe_total = total;
  }
  
  registrarDetalle(): void {
    if (!this.compraSeleccionada) {
      alert('No hay una compra seleccionada');
      return;
    }
    
    // Validar que se haya seleccionado un material
    if (!this.nuevoDetalle.materialId || this.nuevoDetalle.materialId <= 0) {
      alert('Por favor seleccione un material');
      return;
    }
    
    // Validar que la cantidad sea mayor que 0
    if (!this.nuevoDetalle.cantidad || this.nuevoDetalle.cantidad <= 0) {
      alert('La cantidad debe ser mayor que 0');
      return;
    }
    
    // Asegurarnos de tener una referencia segura a id
    const compraId = this.compraSeleccionada.id;
    
    this.nuevoDetalle.compraId = compraId;
    
    // Asegurar que el precio sea un número
    if (this.nuevoDetalle.precioUnitario === undefined || this.nuevoDetalle.precioUnitario === null) {
      this.nuevoDetalle.precioUnitario = 0;
    }
    
    this.nuevoDetalle.precioUnitario = Number(this.nuevoDetalle.precioUnitario);
    this.nuevoDetalle.subtotal = this.nuevoDetalle.cantidad * this.nuevoDetalle.precioUnitario;
    
    console.log('Registrando detalle de compra:', JSON.stringify(this.nuevoDetalle));
    
    // Crear una copia explícita para enviar al servicio con todos los campos del backend
    const detalleParaEnviar = {
      compraId: this.nuevoDetalle.compraId,
      materialId: this.nuevoDetalle.materialId,
      cantidad: this.nuevoDetalle.cantidad,
      precioUnitario: this.nuevoDetalle.precioUnitario,
      subtotal: this.nuevoDetalle.subtotal,
      // Campos adicionales requeridos por el backend
      precio: this.nuevoDetalle.precioUnitario,
      importe: this.nuevoDetalle.subtotal,
      importe_desc: 0,
      estado: 'PENDIENTE'
    };
    
    this.detallePedidoCompraService.createDetallePedido(detalleParaEnviar).subscribe({
      next: (response) => {
        console.log('Detalle registrado exitosamente:', response);
        // Actualizar el total de la compra
        this.actualizarTotalCompra();
        // Recargar los detalles
        // Verificamos nuevamente que la compra seleccionada exista
        if (this.compraSeleccionada) {
          this.detallePedidoCompraService.getDetallesPorCompra(this.compraSeleccionada.id).subscribe(detalles => {
            this.detallesCompra = detalles;
          });
        }
        this.cerrarModalNuevoDetalle();
        this.limpiarFormularioDetalle();
      },
      error: (error) => {
        console.error('Error al registrar detalle de compra:', error);
        alert('Error al registrar el detalle. Por favor, intente nuevamente.');
      }
    });
  }
  
  eliminarDetalle(id: number): void {
    if (confirm('¿Está seguro de eliminar este detalle?')) {
      this.detallePedidoCompraService.deleteDetallePedido(id).subscribe(() => {
        // Actualizar el total de la compra
        this.actualizarTotalCompra();
        // Recargar los detalles
        if (this.compraSeleccionada) {
          this.detallePedidoCompraService.getDetallesPorCompra(this.compraSeleccionada.id).subscribe(detalles => {
            this.detallesCompra = detalles;
          });
        }
      });
    }
  }
  
  actualizarTotalCompra(): void {
    if (!this.compraSeleccionada) return;
    
    // Calcular el total a partir de los detalles
    let total = 0;
    this.detallesCompra.forEach(detalle => {
      total += detalle.subtotal;
    });
    
    // Guardar una referencia segura al ID
    const compraId = this.compraSeleccionada.id;
    
    // Actualizar el campo importe_total de la compra
    const compraActualizada: CompraDTO = {
      fecha: this.compraSeleccionada.fecha,
      estado: this.compraSeleccionada.estado,
      importe_total: total,
      importe_descuento: this.compraSeleccionada.importe_descuento,
      proveedorId: this.compraSeleccionada.proveedorId,
      usuarioId: this.compraSeleccionada.usuarioId,
      observaciones: this.compraSeleccionada.observaciones
    };
    
    this.comprasService.updateCompra(compraId, compraActualizada).subscribe(() => {
      // Actualizar la compra seleccionada con el nuevo total
      if (this.compraSeleccionada) {
        this.compraSeleccionada.importe_total = total;
      }
      // Recargar todas las compras
      this.obtenerCompras();
    });
  }
  
  filtrarPorEstado(): void {
    if (!this.estadoSeleccionado) {
      this.obtenerCompras();
      return;
    }
    
    this.comprasService.getComprasPorEstado(this.estadoSeleccionado).subscribe(data => {
      this.compras = data;
    });
  }
  
  filtrarPorProveedor(): void {
    if (!this.proveedorSeleccionadoId) {
      this.obtenerCompras();
      return;
    }
    
    this.comprasService.getComprasPorProveedor(this.proveedorSeleccionadoId).subscribe(data => {
      this.compras = data;
    });
  }
  
  cambiarEstadoCompra(compra: Compra, nuevoEstado: string): void {
    const compraDTO: CompraDTO = {
      fecha: compra.fecha,
      estado: nuevoEstado,
      importe_total: compra.importe_total,
      importe_descuento: compra.importe_descuento,
      proveedorId: compra.proveedorId,
      usuarioId: compra.usuarioId,
      observaciones: compra.observaciones
    };
    
    this.comprasService.updateCompra(compra.id, compraDTO).subscribe(() => {
      this.obtenerCompras();
    });
  }
  
  // Funciones para modales
  abrirModalRegistroCompra(): void {
    this.limpiarFormularioCompra();
    this.isModalRegistroCompraOpen = true;
  }
  
  cerrarModalRegistroCompra(): void {
    this.isModalRegistroCompraOpen = false;
    this.nuevosDetalles = [];
  }
  
  abrirModalDetalleCompra(): void {
    this.isModalDetalleCompraOpen = true;
  }
  
  cerrarModalDetalleCompra(): void {
    this.isModalDetalleCompraOpen = false;
    this.compraSeleccionada = null;
    this.detallesCompra = [];
  }
  
  abrirModalNuevoDetalle(): void {
    this.limpiarFormularioDetalle();
    this.isModalNuevoDetalleOpen = true;
  }
  
  cerrarModalNuevoDetalle(): void {
    this.isModalNuevoDetalleOpen = false;
  }
  
  abrirModalEditarCompra(compra: Compra): void {
    this.compraSeleccionada = {...compra};
    this.isModalEditarCompraOpen = true;
  }
  
  cerrarModalEditarCompra(): void {
    this.isModalEditarCompraOpen = false;
    this.compraSeleccionada = null;
  }
  
  // Funciones auxiliares
  limpiarFormularioCompra(): void {
    this.nuevaCompra = {
      fecha: new Date().toISOString().split('T')[0],
      estado: 'PENDIENTE',
      importe_total: 0,
      importe_descuento: 0,
      proveedorId: 0,
      usuarioId: this.authService.obtenerUsuarioId(),
      observaciones: ''
    };
    this.nuevosDetalles = [];
  }
  
  limpiarFormularioDetalle(): void {
    const compraId = this.compraSeleccionada ? this.compraSeleccionada.id : 0;
    
    this.nuevoDetalle = {
      compraId: compraId,
      materialId: 0,
      cantidad: 1,
      precioUnitario: 0,
      subtotal: 0
    };
  }
  
  calcularSubtotal(): void {
    // Asegurar que los valores son números
    const cantidad = Number(this.nuevoDetalle.cantidad) || 0;
    const precioUnitario = Number(this.nuevoDetalle.precioUnitario) || 0;
    
    // Actualizar las propiedades con los valores convertidos
    this.nuevoDetalle.cantidad = cantidad;
    this.nuevoDetalle.precioUnitario = precioUnitario;
    
    // Calcular el subtotal
    this.nuevoDetalle.subtotal = cantidad * precioUnitario;
    
    console.log('Subtotal calculado:', this.nuevoDetalle.subtotal);
  }
  
  getNombreProveedor(proveedorId: number): string {
    console.log('Buscando proveedor con ID:', proveedorId);
    
    // Si no hay proveedorId, devolvemos 'No especificado'
    if (!proveedorId) {
      return 'No especificado';
    }
    
    // Si no hay proveedores cargados aún, devolvemos 'Cargando...'
    if (!this.proveedores || this.proveedores.length === 0) {
      return 'Cargando...';
    }
    
    const proveedor = this.proveedores.find(p => p.id === proveedorId);
    
    // Log para depuración
    if (!proveedor) {
      console.warn(`No se encontró proveedor con ID ${proveedorId}. Proveedores disponibles:`, this.proveedores.map(p => ({ id: p.id, nombre: p.nombre })));
    }
    
    return proveedor ? proveedor.nombre : 'No especificado';
  }
  
  getNombreMaterial(materialId: number): string {
    // Validación básica
    if (!materialId) {
      return 'Material sin ID';
    }
    
    // Si hay materiales disponibles, buscar por ID
    if (this.materiales && this.materiales.length > 0) {
      const material = this.materiales.find(m => m.id === materialId);
      
      if (material && material.nombre) {
        return material.nombre;
      }
    }
    
    // Intentar cargar los materiales si no están disponibles o no se encontró el material
    if (!this.materiales || this.materiales.length === 0) {
      console.log(`Cargando materiales para encontrar material con ID ${materialId}...`);
      // Cargamos los materiales sin bloquear la interfaz
      this.materialesService.getMaterialesCompletos().subscribe(materiales => {
        this.materiales = materiales;
        console.log(`Materiales cargados: ${materiales.length}`);
      });
    }
    
    // Devolver un valor predeterminado mientras se cargan los materiales
    return `Material #${materialId}`;
  }
  
  obtenerColorEstado(estado: string): string {
    switch (estado) {
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-800';
      case 'APROBADO':
        return 'bg-green-100 text-green-800';
      case 'RECHAZADO':
        return 'bg-red-100 text-red-800';
      case 'COMPLETADO':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
  
  // Método para diagnosticar problemas con detalles de compra
  diagnosticarDetalle(detalle: DetallePedidoCompraDTO): void {
    console.log('Iniciando diagnóstico del detalle:', JSON.stringify(detalle));
    
    // Asegurar que los valores sean números
    const detalleDiagnostico = {
      ...detalle,
      cantidad: Number(detalle.cantidad),
      precioUnitario: Number(detalle.precioUnitario),
      subtotal: Number(detalle.subtotal),
      // Añadir campos del backend
      precio: Number(detalle.precioUnitario),
      importe: Number(detalle.subtotal)
    };
    
    this.detallePedidoCompraService.diagnosticarDetallePedido(detalleDiagnostico)
      .subscribe({
        next: (resultado) => {
          console.log('Diagnóstico recibido del servidor:', resultado);
          // Aquí podríamos mostrar un modal con los resultados si fuera necesario
        },
        error: (error) => {
          console.error('Error durante el diagnóstico:', error);
        }
      });
  }
} 