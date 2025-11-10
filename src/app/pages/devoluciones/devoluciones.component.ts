import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common'
import { DevolucionesService } from '../../services/devoluciones.service';
import { DevolucionCreateDTO, DevolucionResponseDTO, DetalleDevolucionCreateDTO } from '../../models/devoluciones.model';
import { PedidoService } from '../../services/pedido.service';
import { DetallePedido, Pedido } from '../../models/pedido.model';
import { UserService } from '../../services/user.service';
import { Usuario } from '../../models/usuario.model';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-devoluciones',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './devoluciones.component.html',
  styleUrl: './devoluciones.component.css'
})
export class DevolucionesComponent implements OnInit, OnDestroy {
  datasFiltradas: DevolucionResponseDTO[] = []; // visibles según filtro
  filtro: string = '';
  devoluciones: DevolucionResponseDTO[] = [];
  nuevaDevolucion: DevolucionCreateDTO = { fecha: '', motivo: '', descripcion: '', importe_total: 0, estado: true, usuario_id: 0, pedido_id: 0 };
  devolucionUpdate: (DevolucionCreateDTO & { id: number | null }) = { id: null, fecha: '', motivo: '', descripcion: '', importe_total: 0, estado: true, usuario_id: 0, pedido_id: 0 };
  isModalRegisterOpen: boolean = false;
  isModalUpdateOpen: boolean = false;

  // Nuevas propiedades para el modal de detalle
  isModalDetailOpen: boolean = false;
  nuevaDevolucionId: number | null = null;
  nuevoDetalle: DetalleDevolucionCreateDTO = { detallePedidoId: 0, cantidad: 1, motivo_detalle: '' };
  productosDelPedido: any[] = [];
  listaDeUsuarios: any[] = [];
  listaDePedidos: Pedido[] = [];
  filtroUsuarioId: number | string = 'todos';
  filtroPedidoId: number | string = 'todos';
  clienteSeleccionado: any = null; // Para mostrar automáticamente el cliente del pedido

  // Subject para el debounce del input del pedido
  private pedidoIdSubject = new Subject<string>();

  constructor(
    private devolucionService: DevolucionesService,
    private pedidoService: PedidoService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.getDevoluciones();
    this.cargarUsuarios();
    this.cargarPedidos();

    // Configurar el debounce para el pedido ID
    this.pedidoIdSubject.pipe(
      debounceTime(500), // Esperar 500ms después del último input
      distinctUntilChanged() // Solo proceder si el valor cambió
    ).subscribe(pedidoId => {
      if (pedidoId && pedidoId.trim() !== '') {
        this.buscarPedidoPorId(pedidoId);
      } else {
        // Limpiar datos cuando el input está vacío
        this.productosDelPedido = [];
        this.clienteSeleccionado = null;
      }
    });
  }

  cargarUsuarios(): void {
    this.userService.listarUsuarios().subscribe({
      next: (response: any) => {
        // Asumimos que la respuesta es un objeto y los usuarios están en una propiedad (p. ej. 'data' o el array mismo)
        this.listaDeUsuarios = Array.isArray(response) ? response : response.data || [];
      },
      error: (err) => {
        console.error('Error al cargar la lista de usuarios', err);
        Swal.fire('Error', 'No se pudo cargar la lista de usuarios. Los IDs deberán ser introducidos manualmente.', 'error');
      }
    });
  }

  cargarPedidos(): void {
    this.pedidoService.listarPedidos().subscribe({
      next: (response) => {
        this.listaDePedidos = response.data;
      },
      error: (err) => {
        console.error('Error al cargar la lista de pedidos', err);
      }
    });
  }

  getDevoluciones(): void {
    Swal.fire({
      title: 'Cargando Devoluciones...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.devolucionService.getDevoluciones().subscribe({
      next: (data) => {
        this.devoluciones = data;
        this.datasFiltradas = data;
        Swal.close();
      },
      error: (error) => {
        console.error('Error al obtener la lista de devoluciones.', error);
        Swal.fire('Error', 'No se pudieron cargar las devoluciones. Por favor, verifica la consola.', 'error');
        Swal.close();
      }
    });
  }

  filtrarDevoluciones(tipo: 'usuario' | 'pedido'): void {
    let serviceCall: Observable<DevolucionResponseDTO[]>;

    if (tipo === 'usuario') {
      this.filtroPedidoId = 'todos';
      if (this.filtroUsuarioId === 'todos') {
        serviceCall = this.devolucionService.getDevoluciones();
      } else {
        serviceCall = this.devolucionService.devolucionesUsuario(Number(this.filtroUsuarioId));
      }
    } else { // tipo === 'pedido'
      this.filtroUsuarioId = 'todos';
      if (this.filtroPedidoId === 'todos') {
        serviceCall = this.devolucionService.getDevoluciones();
      } else {
        serviceCall = this.devolucionService.devolucionesPedido(Number(this.filtroPedidoId));
      }
    }

    Swal.fire({
      title: 'Filtrando devoluciones...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    serviceCall.subscribe({
      next: (data) => {
        this.devoluciones = data;
        this.datasFiltradas = data;
        Swal.close();
      },
      error: (err) => {
        console.error('Error al filtrar devoluciones', err);
        Swal.fire('Error', 'No se pudieron obtener las devoluciones filtradas.', 'error');
        this.devoluciones = [];
        this.datasFiltradas = [];
      }
    });
  }

  buscar(): void {
    const termino = this.filtro.trim().toLowerCase();
    if (termino === '') {
      this.datasFiltradas = this.devoluciones;
    } else {
      this.datasFiltradas = this.devoluciones.filter(devolucion =>
        devolucion.motivo.toLowerCase().includes(termino) ||
        devolucion.descripcion.toLowerCase().includes(termino) ||
        devolucion.usuarioNombre.toLowerCase().includes(termino)
      );
    }
  }

  onPedidoIdChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const pedidoIdStr = target ? target.value : '';
    
    // Enviar el valor al Subject para aplicar debounce
    this.pedidoIdSubject.next(pedidoIdStr);
  }

  // Método separado para buscar el pedido (usado por el debounce)
  private buscarPedidoPorId(pedidoIdStr: string): void {
    const pedidoId = parseInt(pedidoIdStr, 10);

    if (!pedidoId || isNaN(pedidoId)) {
      this.productosDelPedido = [];
      this.clienteSeleccionado = null;
      this.nuevaDevolucion.usuario_id = 0;
      return;
    }

    // Obtener información completa del pedido para extraer el cliente
    this.pedidoService.obtenerPedido(pedidoId).subscribe({
      next: (response) => {
        const pedido = response.data;
        
        // Automáticamente asignar el usuario (cliente) del pedido como usuario de la devolución
        if (pedido.usuario && pedido.usuario.id) {
          this.nuevaDevolucion.usuario_id = pedido.usuario.id;
          this.clienteSeleccionado = pedido.usuario;
          console.log('Cliente automáticamente asignado:', pedido.usuario);
        } else {
          console.warn('El pedido no tiene información de usuario');
          this.clienteSeleccionado = null;
          this.nuevaDevolucion.usuario_id = 0;
        }
        
        // Cargar productos del pedido
        this.productosDelPedido = pedido.detalle_pedidos || [];
        console.log('Productos del pedido cargados:', this.productosDelPedido);
        
        if (this.productosDelPedido.length === 0) {
          Swal.fire('Aviso', 'Los productos de este pedido ya han sido devueltos.', 'info');
        }
      },
      error: (error) => {
        console.error('Error al obtener pedido:', error);
        this.productosDelPedido = [];
        this.clienteSeleccionado = null;
        this.nuevaDevolucion.usuario_id = 0;
        Swal.fire('Error', 'No se pudo obtener la información del pedido seleccionado.', 'error');
      }
    });
  }

  activeRegisterForm(): void {
    this.nuevaDevolucion = { fecha: new Date().toISOString(), motivo: '', descripcion: '', importe_total: 0, estado: true, usuario_id: 0, pedido_id: 0 };
    this.isModalRegisterOpen = true;
    this.productosDelPedido = [];
    this.clienteSeleccionado = null; // Limpiar cliente seleccionado
  }

  createDevolucion(): void {
    const { motivo, descripcion, pedido_id, usuario_id } = this.nuevaDevolucion;

    if (!motivo.trim() || !descripcion.trim() || !pedido_id || !usuario_id) {
      Swal.fire("Error", "Los campos motivo, descripción, ID de pedido y ID de usuario son obligatorios", "error");
      return;
    }

    // Asegurarse de que la fecha está en formato ISO
    this.nuevaDevolucion.fecha = new Date().toISOString();

    this.devolucionService.createDevolucion(this.nuevaDevolucion).subscribe({
      next: (devolucionCreada) => {
        this.nuevaDevolucionId = devolucionCreada.id;
        Swal.fire("Devolución registrada", "Ahora añade el detalle del producto a devolver.", "success");
        this.closeRegisterModal();
        this.openDetailModal();
      },
      error: (err) => {
        console.error('Error completo:', err);
        Swal.fire("Error al registrar la devolución", "Ocurrió un problema al intentar registrar.", "error");
      }
    });
  }

  openDetailModal(): void {
    this.nuevoDetalle = { detallePedidoId: 0, cantidad: 1, motivo_detalle: '' };
    this.isModalDetailOpen = true;
    
    // Cargar productos basándose en la nueva devolución creada
    if (this.nuevaDevolucionId) {
      this.devolucionService.getDevolucion(this.nuevaDevolucionId).subscribe({
        next: (devolucion) => {
          console.log('Devolución obtenida:', devolucion); // Debug
          if (devolucion.pedidoId) {
            this.pedidoService.obtenerProductosPedido(devolucion.pedidoId).subscribe({
              next: (response) => {
                this.productosDelPedido = response.data;
                console.log('Productos del pedido en modal:', this.productosDelPedido); // Debug
              },
              error: (error) => {
                console.error('Error al obtener productos del pedido:', error);
                this.productosDelPedido = [];
              }
            });
          }
        },
        error: (error) => {
          console.error('Error al obtener devolución:', error);
        }
      });
    }
  }

  createDetalleDevolucion(): void {
    if (!this.nuevaDevolucionId || !this.nuevoDetalle.detallePedidoId || this.nuevoDetalle.cantidad <= 0) {
      Swal.fire("Error", "Debes seleccionar un producto y especificar una cantidad válida.", "error");
      return;
    }

    this.devolucionService.postDetalles(this.nuevaDevolucionId, this.nuevoDetalle).subscribe({
      next: () => {
        this.getDevoluciones();
        Swal.fire("Detalle añadido", "La devolución se ha completado correctamente.", "success");
        this.closeDetailModal();
      },
      error: (err) => {
        console.error('Error al añadir detalle:', err);
        Swal.fire("Error", "Por favor, verifica que la cantidad a devolver sea igual o menor a la que se pidió.", "error");
      }
    });
  }

  openModalToUpdateDevolucion(devolucion: DevolucionResponseDTO): void {
    this.devolucionUpdate = {
      id: devolucion.id,
      fecha: devolucion.fecha,
      motivo: devolucion.motivo,
      descripcion: devolucion.descripcion,
      importe_total: devolucion.importe_total,
      estado: devolucion.estado,
      usuario_id: devolucion.usuarioId,
      pedido_id: devolucion.pedidoId
    };
    this.isModalUpdateOpen = true;
  }

  updateDevolucion(): void {
    const { id, motivo, descripcion, pedido_id, usuario_id } = this.devolucionUpdate;

    if (!id || !motivo.trim() || !descripcion.trim() || !pedido_id || !usuario_id) {
      Swal.fire("Error", "Todos los campos son obligatorios", "error");
      return;
    }

    const dataToUpdate: DevolucionCreateDTO = {
      fecha: this.devolucionUpdate.fecha,
      motivo: this.devolucionUpdate.motivo,
      descripcion: this.devolucionUpdate.descripcion,
      importe_total: this.devolucionUpdate.importe_total,
      estado: this.devolucionUpdate.estado,
      usuario_id: this.devolucionUpdate.usuario_id,
      pedido_id: this.devolucionUpdate.pedido_id
    };

    this.devolucionService.updateDevolucion(id, dataToUpdate).subscribe({
      next: () => {
        this.getDevoluciones();
        Swal.fire("Devolución actualizada", "", "success");
        this.closeUpdateModal();
      },
      error: (err) => {
        console.error('Error al actualizar devolucion', err);
        Swal.fire("Error al actualizar la devolución", "", "error");
      }
    });
  }

  deleteDevolucion(devolucion: DevolucionResponseDTO): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.devolucionService.deleteDevolucion(devolucion.id).subscribe({
          next: () => {
            this.getDevoluciones();
            Swal.fire("Devolución eliminada", "", "success");
          },
          error: (err) => {
            console.error('Error al eliminar devolucion', err);
            Swal.fire("Error al eliminar la devolución", "", "error");
          }
        });
      }
    });
  }

  closeRegisterModal(): void {
    this.isModalRegisterOpen = false;
  }

  closeUpdateModal(): void {
    this.isModalUpdateOpen = false;
  }

  closeDetailModal(): void {
    this.isModalDetailOpen = false;
    this.nuevaDevolucionId = null;
    this.productosDelPedido = [];
  }

  ngOnDestroy(): void {
    // Limpiar el Subject para evitar memory leaks
    this.pedidoIdSubject.complete();
  }
}
