import { Component, OnInit } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { ProductoService } from '../../services/producto.service';
import { NgxDropzoneModule } from 'ngx-dropzone';
import { map, Observable, forkJoin } from 'rxjs';
import { UserService } from '../../services/user.service';
import { OrdenPrepreproductoService } from '../../services/orden-preproducto.service';
import { OrdenProductoService } from '../../services/orden-producto.service';
import { AuthService } from '../../services/auth.service';
import { OrdenProducto, OrdenProductoDTO, ESTADOS_ORDEN } from '../../models/orden-producto.model';
import { PreProductoService } from '../../services/pre-producto.service';
import localeEs from '@angular/common/locales/es-BO';

// Registramos el locale para Bolivia
registerLocaleData(localeEs, 'es-BO');

interface ApiResponse<T> {
  statusCode?: number;
  message?: string;
  data: T;
}

interface ItemSeleccionable {
  id: number;
  nombre: string;
  tipo: 'producto' | 'preproducto';
}

interface OrdenBase {
  id?: number;  // Opcional para permitir su omisión en actualizaciones
  cantidad: number;
  descripcion: string;
  estado: string;
  fecha: string;
  usuarioId: number;
}

interface OrdenProductoUpdate extends OrdenBase {
  productoId: number;
}

interface OrdenPreproductoUpdate extends OrdenBase {
  preproductoId: number;
}

@Component({
  selector: 'app-orden-producto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orden-producto.component.html',
  styleUrl: './orden-producto.component.css'
})
export class OrdenProductoComponent implements OnInit {
  ordenesPreproductos: any[] = [];
  ordenesProductos: OrdenProducto[] = [];
  todasLasOrdenes: any[] = [];
  productos: ItemSeleccionable[] = [];
  Filtrados: any[] = [];
  filtro: string = '';
  cantidad: number = 0;
  estadosOrden = ESTADOS_ORDEN;

  ordenNuevo: OrdenProductoDTO = {
    descripcion: '',
    cantidad: 0,
    fecha: new Date().toISOString(),
    estado: 'En proceso',
    usuarioId: 0,
    productoId: 0
  };

  ordenEdit: any = {
    id: 0,
    descripcion: '',
    cantidad: 0,
    fecha: new Date().toISOString(),
    estado: 'En proceso',
    usuarioId: 0,
    productoId: 0,
    tipo: 'producto'
  };

  // Control de modales
  isModalNuevoOpen: boolean = false;
  isModalEditarOpen: boolean = false;

  constructor(
    private productoService: ProductoService,
    private userService: UserService,
    private ordenProductoService: OrdenProductoService,
    private ordenPreproductoService: OrdenPrepreproductoService,
    private authService: AuthService,
    private preProductoService: PreProductoService
  ) { }

  ngOnInit(): void {
    console.log('Iniciando componente...');
    this.obtenerProductosYPreproductos();
    this.obtenerOrdenes();
  }

  obtenerProductosYPreproductos(): void {
    console.log('Obteniendo productos y preproductos...');
    Swal.fire({ title: 'Cargando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    forkJoin({
      productos: this.productoService.getProductos(),
      preproductos: this.preProductoService.obtenerTodos()
    }).subscribe({
      next: (result: { productos: any[], preproductos: ApiResponse<any[]> | any[] }) => {
        console.log('Resultado completo:', result);

        // Mapear productos
        const productosFormateados = result.productos.map(p => ({
          id: p.id,
          nombre: p.nombre,
          tipo: 'producto' as const
        }));

        // Mapear preproductos - asumiendo que viene en formato {data: [...]} o directamente como array
        const preproductosData = 'data' in result.preproductos ? result.preproductos.data : result.preproductos;
        const preproductosFormateados = Array.isArray(preproductosData)
          ? preproductosData.map(p => ({
            id: p.id,
            nombre: p.nombre,
            tipo: 'preproducto' as const
          }))
          : [];

        // Combinar ambos arrays
        this.productos = [...productosFormateados, ...preproductosFormateados];
        console.log('Items disponibles:', this.productos);
        Swal.close();
      },
      error: (err) => {
        console.error('Error al obtener productos y preproductos', err);
        Swal.fire('Error', 'No se pudieron cargar los items', 'error');
      }
    });
  }

  obtenerOrdenes(): void {
    console.log('Obteniendo órdenes...');
    Swal.fire({ title: 'Cargando órdenes...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    forkJoin({
      productos: this.ordenProductoService.getOrdenesProductos(),
      preproductos: this.ordenPreproductoService.getOrdenesPreproductos()
    }).subscribe({
      next: (result: { productos: any[], preproductos: ApiResponse<any[]> | any[] }) => {
        console.log('Resultado de órdenes:', result);

        // Marcar cada orden con su tipo
        this.ordenesProductos = result.productos.map(orden => ({ ...orden, tipo: 'producto' }));

        // Manejar la respuesta de preproductos que puede venir en formato {data: [...]} o directamente como array
        const preproductosData = 'data' in result.preproductos ? result.preproductos.data : result.preproductos;
        this.ordenesPreproductos = Array.isArray(preproductosData)
          ? preproductosData.map(orden => ({ ...orden, tipo: 'preproducto' }))
          : [];

        // Combinar todas las órdenes
        this.todasLasOrdenes = [...this.ordenesProductos, ...this.ordenesPreproductos];
        this.Filtrados = this.todasLasOrdenes;
        console.log('Todas las órdenes:', this.todasLasOrdenes);
        Swal.close();
      },
      error: (err) => {
        console.error('Error al obtener las órdenes', err);
        Swal.fire('Error', 'No se pudieron cargar las órdenes', 'error');
      }
    });
  }

  filtrar(): void {
    const termino = this.filtro.trim().toLowerCase();
    this.Filtrados = termino
      ? this.todasLasOrdenes.filter(p => p.descripcion.toLowerCase().includes(termino))
      : this.todasLasOrdenes;
  }

  abrirModalNuevo(): void {
    console.log('Abriendo modal nuevo...');
    const usuarioId = this.authService.obtenerUsuarioId();
    console.log('ID de usuario:', usuarioId);

    // Creamos la fecha en zona horaria de Bolivia
    const fechaBolivia = new Date();
    fechaBolivia.setHours(fechaBolivia.getHours() - 4); // Bolivia está en UTC-4

    this.ordenNuevo = {
      descripcion: '',
      cantidad: 0,
      fecha: fechaBolivia.toISOString(),
      estado: 'En proceso',
      usuarioId: usuarioId,
      productoId: 0
    };
    this.isModalNuevoOpen = true;
  }

  cerrarModalNuevo(): void {
    this.isModalNuevoOpen = false;
  }

  crearOrden(): void {
    if (!this.ordenNuevo.productoId) {
      Swal.fire('Error', 'Debe seleccionar un producto o preproducto', 'error');
      return;
    }

    if (this.ordenNuevo.cantidad <= 0) {
      Swal.fire('Error', 'La cantidad debe ser mayor a 0', 'error');
      return;
    }

    console.log('Creando orden:', this.ordenNuevo);
    Swal.fire({
      title: 'Creando orden...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    // Encontrar el tipo de item seleccionado
    const itemSeleccionado = this.productos.find(p => p.id === this.ordenNuevo.productoId);

    if (itemSeleccionado?.tipo === 'preproducto') {
      this.ordenPreproductoService.createOrdenPreproducto(this.ordenNuevo).subscribe(this.manejarRespuestaCreacion);
    } else {
      this.ordenProductoService.createOrdenProducto(this.ordenNuevo).subscribe(this.manejarRespuestaCreacion);
    }
  }

  private manejarRespuestaCreacion = {
    next: (resp: any) => {
      console.log('Orden creada:', resp);
      Swal.fire({
        position: "center",
        icon: "success",
        title: "Orden creada exitosamente!",
        showConfirmButton: false,
        timer: 2500
      });
      this.obtenerOrdenes();
      this.cerrarModalNuevo();
    },
    error: (err: any) => {
      console.error('Error al crear la orden', err);
      Swal.fire('Error', 'No se pudo crear la orden', 'error');
    }
  };

  abrirModalEditar(orden: any): void {
    console.log('Orden recibida para editar:', orden);

    // Aseguramos que se copien todos los campos necesarios
    this.ordenEdit = {
      id: orden.id,
      cantidad: orden.cantidad,
      descripcion: orden.descripcion,
      estado: orden.estado,
      fecha: orden.fecha,
      usuarioId: orden.usuarioId || 1, // Valor por defecto
      productoId: orden.tipo === 'preproducto'
        ? (orden.preProductoId || 1) // Para preproductos
        : (orden.productoId || 1),   // Para productos
      tipo: orden.tipo || 'producto' // Valor por defecto
    };

    console.log('Datos preparados para edición:', this.ordenEdit);
    this.isModalEditarOpen = true;
  }

  cerrarModalEditar(): void {
    this.isModalEditarOpen = false;
  }

  actualizarOrden(): void {
    if (this.ordenEdit.cantidad <= 0) {
      Swal.fire('Error', 'La cantidad debe ser mayor a 0', 'error');
      return;
    }

    if (!this.ordenEdit.id) {
      Swal.fire('Error', 'ID de orden no válido', 'error');
      return;
    }

    console.log('Datos originales de la orden:', this.ordenEdit);

    // Datos base que comparten ambos tipos de órdenes
    const datosComunes = {
      cantidad: this.ordenEdit.cantidad,
      descripcion: this.ordenEdit.descripcion,
      estado: this.ordenEdit.estado,
      fecha: this.ordenEdit.fecha,
      usuarioId: 1 // Valor por defecto para el backend
    };

    Swal.fire({
      title: 'Actualizando orden...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    // Seleccionar el servicio según el tipo de orden
    if (this.ordenEdit.tipo === 'preproducto') {
      // Formato específico para preproductos
      const ordenPreproducto = {
        ...datosComunes,
        preProductoId: this.ordenEdit.productoId || 1 // Valor por defecto si es undefined
      };

      console.log('Actualizando orden de preproducto:', ordenPreproducto);

      this.ordenPreproductoService.updateOrdenPreproducto(
        Number(this.ordenEdit.id),
        ordenPreproducto
      ).subscribe({
        next: (response) => {
          console.log('Respuesta de actualización preproducto:', response);
          this.manejarRespuestaActualizacionExitosa();
        },
        error: (err) => this.manejarErrorActualizacion(err)
      });
    } else {
      // Formato específico para productos
      const ordenProducto = {
        ...datosComunes,
        id: Number(this.ordenEdit.id),
        productoId: this.ordenEdit.productoId || 1 // Valor por defecto si es undefined
      };

      console.log('Actualizando orden de producto:', ordenProducto);

      this.ordenProductoService.updateOrdenProducto(
        Number(this.ordenEdit.id),
        ordenProducto
      ).subscribe({
        next: (response) => {
          console.log('Respuesta de actualización producto:', response);
          this.manejarRespuestaActualizacionExitosa();
        },
        error: (err) => this.manejarErrorActualizacion(err)
      });
    }
  }

  private manejarRespuestaActualizacionExitosa(): void {
    Swal.fire({
      position: "center",
      icon: "success",
      title: "Orden actualizada exitosamente!",
      showConfirmButton: false,
      timer: 2500
    });
    this.obtenerOrdenes();
    this.cerrarModalEditar();
  }

  private manejarErrorActualizacion(err: any): void {
    console.error('Error al actualizar la orden:', err);
    const mensajeError = err.error?.message || 'No se pudo actualizar la orden';
    Swal.fire('Error', mensajeError, 'error');
  }

  getTipoItem(id: number): string {
    const item = this.productos.find(p => p.id === id);
    return item ? item.tipo : 'producto';
  }
}
