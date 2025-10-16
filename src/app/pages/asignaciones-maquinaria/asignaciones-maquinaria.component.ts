import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AsignacionesMaquinariaService } from '../../services/asignaciones-maquinaria.service';
import { MaquinariasService } from '../../services/maquinarias.service';
import { UserService } from '../../services/user.service';
import { 
  MaquinariaCarpintero, 
  MaquinariaCarpinteroDTO,
  Maquinaria,
  ESTADOS_ASIGNACION,
  EstadoAsignacion
} from '../../models/maquinaria.model';
import { Usuario } from '../../models/usuario.model';

@Component({
  selector: 'app-asignaciones-maquinaria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asignaciones-maquinaria.component.html',
  styleUrl: './asignaciones-maquinaria.component.css'
})
export class AsignacionesMaquinariaComponent implements OnInit {
  // Arrays de datos
  asignaciones: MaquinariaCarpintero[] = [];
  asignacionesOriginal: MaquinariaCarpintero[] = [];
  maquinarias: Maquinaria[] = [];
  maquinariasDisponibles: Maquinaria[] = [];
  carpinteros: Usuario[] = [];

  // Estados disponibles
  estadosDisponibles = ESTADOS_ASIGNACION;
  
  // Formulario para nueva asignación
  asignacionForm: MaquinariaCarpinteroDTO = {
    estado: 'en_uso',
    maquinariaId: 0,
    carpinteroId: 0
  };
  
  // Estados del componente
  isModalOpen = false;
  isEditMode = false;
  isLoading = false;
  currentAsignacionId: number | null = null;
  
  // Filtros
  filtroMaquinaria = '';
  filtroCarpintero = '';
  filtroEstado = '';
  
  // Vista activa
  vistaActiva: 'asignaciones' | 'disponibles' = 'asignaciones';
  
  // Mensajes
  successMessage = '';
  errorMessage = '';

  constructor(
    private asignacionesService: AsignacionesMaquinariaService,
    private maquinariasService: MaquinariasService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  cargarDatosIniciales(): void {
    this.cargarAsignaciones();
    this.cargarMaquinarias();
    this.cargarCarpinteros();
  }

  cargarAsignaciones(): void {
    this.isLoading = true;
    this.asignacionesService.getAllAsignaciones().subscribe({
      next: (data: MaquinariaCarpintero[]) => {
        this.asignacionesOriginal = data;
        this.asignaciones = [...data];
        this.aplicarFiltros();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error al cargar asignaciones:', error);
        this.showError('Error al cargar las asignaciones');
        this.isLoading = false;
      }
    });
  }

  cargarMaquinarias(): void {
    this.maquinariasService.getMaquinarias().subscribe({
      next: (data: Maquinaria[]) => {
        this.maquinarias = data;
      },
      error: (error: any) => {
        console.error('Error al cargar maquinarias:', error);
      }
    });
  }

  cargarCarpinteros(): void {
    this.userService.listarUsuarios().subscribe({
      next: (data: any) => {
        console.log('Respuesta del servicio de usuarios:', data);
        
        // Verificar si data es un array o si tiene una propiedad que contiene el array
        let usuarios: Usuario[] = [];
        
        if (Array.isArray(data)) {
          usuarios = data;
        } else if (data && Array.isArray(data.usuarios)) {
          usuarios = data.usuarios;
        } else if (data && Array.isArray(data.data)) {
          usuarios = data.data;
        } else {
          console.error('La respuesta no contiene un array de usuarios:', data);
          this.showError('Error al cargar la lista de carpinteros');
          return;
        }
        
        // Filtrar solo usuarios con rol de carpintero (ajustar según tu lógica de roles)
        this.carpinteros = usuarios.filter((usuario: Usuario) => 
          usuario.rol && usuario.rol.nombre && (
            usuario.rol.nombre.toLowerCase().includes('carpintero') || 
            usuario.rol.nombre.toLowerCase().includes('operario')
          )
        );
        
        console.log('Carpinteros filtrados:', this.carpinteros);
      },
      error: (error: any) => {
        console.error('Error al cargar carpinteros:', error);
        this.showError('Error al cargar los carpinteros');
      }
    });
  }

  aplicarFiltros(): void {
    let asignacionesFiltradas = [...this.asignacionesOriginal];

    // Filtro por maquinaria
    if (this.filtroMaquinaria.trim()) {
      const termino = this.filtroMaquinaria.toLowerCase().trim();
      asignacionesFiltradas = asignacionesFiltradas.filter(asignacion =>
        asignacion.maquinaria.nombre.toLowerCase().includes(termino)
      );
    }

    // Filtro por carpintero
    if (this.filtroCarpintero.trim()) {
      const termino = this.filtroCarpintero.toLowerCase().trim();
      asignacionesFiltradas = asignacionesFiltradas.filter(asignacion =>
        asignacion.carpintero.nombre_completo.toLowerCase().includes(termino)
      );
    }

    // Filtro por estado
    if (this.filtroEstado) {
      asignacionesFiltradas = asignacionesFiltradas.filter(asignacion =>
        asignacion.estado === this.filtroEstado
      );
    }

    this.asignaciones = asignacionesFiltradas;
  }

  limpiarFiltros(): void {
    this.filtroMaquinaria = '';
    this.filtroCarpintero = '';
    this.filtroEstado = '';
    this.aplicarFiltros();
  }

  cambiarVista(vista: 'asignaciones' | 'disponibles'): void {
    this.vistaActiva = vista;
    if (vista === 'asignaciones') {
      this.cargarAsignaciones();
    } else if (vista === 'disponibles') {
      this.cargarMaquinariasDisponibles();
    }
  }

  cargarMaquinariasDisponibles(): void {
    this.isLoading = true;
    this.maquinariasService.getMaquinarias().subscribe({
      next: (data: Maquinaria[]) => {
        // Filtrar maquinarias disponibles (estado 'disponible' y sin asignaciones activas)
        this.maquinariasDisponibles = data.filter(maquinaria => 
          maquinaria.estado === 'disponible'
        );
        
        // Verificar cuáles no tienen asignaciones activas
        this.verificarAsignacionesActivas();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error al cargar maquinarias disponibles:', error);
        this.showError('Error al cargar las maquinarias disponibles');
        this.isLoading = false;
      }
    });
  }

  verificarAsignacionesActivas(): void {
    // Obtener todas las asignaciones para verificar cuáles maquinarias están realmente disponibles
    this.asignacionesService.getAllAsignaciones().subscribe({
      next: (asignaciones: MaquinariaCarpintero[]) => {
        // Filtrar asignaciones activas (en_uso, reservada)
        const asignacionesActivas = asignaciones.filter(asignacion => 
          asignacion.estado === 'en_uso' || asignacion.estado === 'reservada'
        );
        
        // Obtener IDs de maquinarias con asignaciones activas
        const maquinariasAsignadas = asignacionesActivas.map(asignacion => 
          asignacion.maquinaria.id
        );
        
        // Filtrar maquinarias que no están asignadas
        this.maquinariasDisponibles = this.maquinariasDisponibles.filter(maquinaria =>
          !maquinariasAsignadas.includes(maquinaria.id)
        );
      },
      error: (error: any) => {
        console.error('Error al verificar asignaciones activas:', error);
      }
    });
  }

  asignarMaquinariaRapida(maquinaria: Maquinaria): void {
    // Pre-llenar el formulario con la maquinaria seleccionada
    this.asignacionForm.maquinariaId = maquinaria.id;
    this.asignacionForm.estado = 'en_uso';
    this.abrirModal();
  }

  abrirModal(): void {
    this.isModalOpen = true;
    this.isEditMode = false;
    this.resetForm();
  }

  abrirModalEditar(asignacion: MaquinariaCarpintero): void {
    this.isModalOpen = true;
    this.isEditMode = true;
    this.currentAsignacionId = asignacion.id;
    this.asignacionForm = {
      id: asignacion.id,
      estado: asignacion.estado as EstadoAsignacion,
      maquinariaId: asignacion.maquinaria.id,
      carpinteroId: asignacion.carpintero.id
    };
  }

  cerrarModal(): void {
    this.isModalOpen = false;
    this.resetForm();
  }

  resetForm(): void {
    this.asignacionForm = {
      estado: 'en_uso',
      maquinariaId: 0,
      carpinteroId: 0
    };
    this.currentAsignacionId = null;
  }

  guardarAsignacion(): void {
    if (!this.validarFormulario()) {
      return;
    }

    this.isLoading = true;

    if (this.isEditMode && this.currentAsignacionId) {
      this.actualizarAsignacion();
    } else {
      this.crearAsignacion();
    }
  }

  validarFormulario(): boolean {
    if (!this.asignacionForm.maquinariaId || this.asignacionForm.maquinariaId === 0) {
      this.showError('Debe seleccionar una maquinaria');
      return false;
    }

    if (!this.asignacionForm.carpinteroId || this.asignacionForm.carpinteroId === 0) {
      this.showError('Debe seleccionar un carpintero');
      return false;
    }

    if (!this.asignacionForm.estado) {
      this.showError('Debe seleccionar un estado');
      return false;
    }

    return true;
  }

  crearAsignacion(): void {
    this.asignacionesService.asignarCarpinteroAMaquinaria(
      this.asignacionForm.maquinariaId,
      this.asignacionForm.carpinteroId,
      this.asignacionForm.estado
    ).subscribe({
      next: (nuevaAsignacion: MaquinariaCarpintero) => {
        this.cargarAsignaciones();
        this.cerrarModal();
        this.showSuccess('Asignación creada exitosamente');
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error al crear asignación:', error);
        this.showError('Error al crear la asignación. La maquinaria puede estar ya asignada.');
        this.isLoading = false;
      }
    });
  }

  actualizarAsignacion(): void {
    if (!this.currentAsignacionId) return;

    this.asignacionesService.actualizarAsignacion(this.currentAsignacionId, this.asignacionForm).subscribe({
      next: (asignacionActualizada: MaquinariaCarpintero) => {
        this.cargarAsignaciones();
        this.cerrarModal();
        this.showSuccess('Asignación actualizada exitosamente');
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error al actualizar asignación:', error);
        this.showError('Error al actualizar la asignación');
        this.isLoading = false;
      }
    });
  }

  cambiarEstado(asignacion: MaquinariaCarpintero, nuevoEstado: string): void {
    if (!nuevoEstado) return; // No hacer nada si no se selecciona un estado
    
    this.asignacionesService.cambiarEstadoAsignacion(asignacion.id, nuevoEstado).subscribe({
      next: () => {
        this.cargarAsignaciones();
        this.showSuccess(`Estado cambiado a ${this.getEstadoTexto(nuevoEstado)}`);
      },
      error: (error: any) => {
        console.error('Error al cambiar estado:', error);
        this.showError('Error al cambiar el estado');
      }
    });
  }

  onEstadoChange(event: Event, asignacion: MaquinariaCarpintero): void {
    const target = event.target as HTMLSelectElement;
    this.cambiarEstado(asignacion, target.value);
  }

  liberarMaquinaria(asignacion: MaquinariaCarpintero): void {
    if (!confirm(`¿Está seguro de liberar la maquinaria "${asignacion.maquinaria.nombre}"?`)) {
      return;
    }

    this.asignacionesService.liberarMaquinaria(asignacion.maquinaria.id).subscribe({
      next: () => {
        this.cargarAsignaciones();
        this.showSuccess('Maquinaria liberada exitosamente');
      },
      error: (error: any) => {
        console.error('Error al liberar maquinaria:', error);
        this.showError('Error al liberar la maquinaria');
      }
    });
  }

  eliminarAsignacion(asignacion: MaquinariaCarpintero): void {
    if (!confirm(`¿Está seguro de eliminar esta asignación?`)) {
      return;
    }

    this.asignacionesService.eliminarAsignacion(asignacion.id).subscribe({
      next: () => {
        this.cargarAsignaciones();
        this.showSuccess('Asignación eliminada exitosamente');
      },
      error: (error: any) => {
        console.error('Error al eliminar asignación:', error);
        this.showError('Error al eliminar la asignación');
      }
    });
  }

  getNombreMaquinaria(maquinariaId: number): string {
    const maquinaria = this.maquinarias.find(m => m.id === maquinariaId);
    return maquinaria ? maquinaria.nombre : 'No encontrada';
  }

  getNombreCarpintero(carpinteroId: number): string {
    const carpintero = this.carpinteros.find(c => c.id === carpinteroId);
    return carpintero ? carpintero.nombre_completo : 'No encontrado';
  }

  getEstadoClase(estado: string): string {
    switch (estado) {
      case 'disponible':
        return 'bg-green-100 text-green-800';
      case 'en_uso':
        return 'bg-blue-100 text-blue-800';
      case 'reservada':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getEstadoTexto(estado: string): string {
    switch (estado) {
      case 'disponible':
        return 'Disponible';
      case 'en_uso':
        return 'En Uso';
      case 'reservada':
        return 'Reservada';
      default:
        return estado;
    }
  }

  showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }

  showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
    setTimeout(() => {
      this.errorMessage = '';
    }, 5000);
  }
} 