import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaquinariasService } from '../../services/maquinarias.service';
import { 
  Maquinaria, 
  MaquinariaDTO, 
  ESTADOS_MAQUINARIA,
  EstadoMaquinaria
} from '../../models/maquinaria.model';

@Component({
  selector: 'app-maquinarias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './maquinarias.component.html',
  styleUrl: './maquinarias.component.css'
})
export class MaquinariasComponent implements OnInit {
  // Arrays de datos
  maquinarias: Maquinaria[] = [];
  maquinariasOriginal: Maquinaria[] = [];

  // Estados disponibles
  estadosDisponibles = ESTADOS_MAQUINARIA;
  
  // Formulario
  maquinariaForm: MaquinariaDTO = {
    nombre: '',
    estado: 'disponible',
    descripcion: ''
  };
  
  // Estados del componente
  isModalOpen = false;
  isEditMode = false;
  isLoading = false;
  currentMaquinariaId: number | null = null;
  
  // Filtros
  filtroNombre = '';
  filtroEstado = '';
  
  // Mensajes
  successMessage = '';
  errorMessage = '';

  constructor(
    private maquinariasService: MaquinariasService
  ) {}

  ngOnInit(): void {
    this.cargarMaquinarias();
  }

  cargarMaquinarias(): void {
    this.isLoading = true;
    this.maquinariasService.getMaquinarias().subscribe({
      next: (data) => {
        this.maquinariasOriginal = data;
        this.maquinarias = [...data];
        this.aplicarFiltros();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar maquinarias:', error);
        this.showError('Error al cargar las maquinarias');
        this.isLoading = false;
      }
    });
  }

  aplicarFiltros(): void {
    let maquinariasFiltradas = [...this.maquinariasOriginal];

    // Filtro por nombre
    if (this.filtroNombre.trim()) {
      const termino = this.filtroNombre.toLowerCase().trim();
      maquinariasFiltradas = maquinariasFiltradas.filter(maquinaria =>
        maquinaria.nombre.toLowerCase().includes(termino) ||
        maquinaria.descripcion.toLowerCase().includes(termino)
      );
    }

    // Filtro por estado
    if (this.filtroEstado) {
      maquinariasFiltradas = maquinariasFiltradas.filter(maquinaria =>
        maquinaria.estado === this.filtroEstado
      );
    }

    this.maquinarias = maquinariasFiltradas;
  }

  limpiarFiltros(): void {
    this.filtroNombre = '';
    this.filtroEstado = '';
    this.aplicarFiltros();
  }

  abrirModal(): void {
    this.isModalOpen = true;
    this.isEditMode = false;
    this.resetForm();
  }

  abrirModalEditar(maquinaria: Maquinaria): void {
    this.isModalOpen = true;
    this.isEditMode = true;
    this.currentMaquinariaId = maquinaria.id;
    this.maquinariaForm = {
      id: maquinaria.id,
      nombre: maquinaria.nombre,
      estado: maquinaria.estado as EstadoMaquinaria,
      descripcion: maquinaria.descripcion
    };
  }

  cerrarModal(): void {
    this.isModalOpen = false;
    this.resetForm();
  }

  resetForm(): void {
    this.maquinariaForm = {
      nombre: '',
      estado: 'disponible',
      descripcion: ''
    };
    this.currentMaquinariaId = null;
  }

  guardarMaquinaria(): void {
    if (!this.validarFormulario()) {
      return;
    }

    this.isLoading = true;

    if (this.isEditMode && this.currentMaquinariaId) {
      this.actualizarMaquinaria();
    } else {
      this.crearMaquinaria();
    }
  }

  validarFormulario(): boolean {
    if (!this.maquinariaForm.nombre.trim()) {
      this.showError('El nombre es obligatorio');
      return false;
    }

    if (!this.maquinariaForm.estado) {
      this.showError('El estado es obligatorio');
      return false;
    }

    if (!this.maquinariaForm.descripcion.trim()) {
      this.showError('La descripción es obligatoria');
      return false;
    }

    return true;
  }

  crearMaquinaria(): void {
    this.maquinariasService.createMaquinaria(this.maquinariaForm).subscribe({
      next: (nuevaMaquinaria) => {
        this.cargarMaquinarias();
        this.cerrarModal();
        this.showSuccess('Maquinaria creada exitosamente');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al crear maquinaria:', error);
        this.showError('Error al crear la maquinaria');
        this.isLoading = false;
      }
    });
  }

  actualizarMaquinaria(): void {
    if (!this.currentMaquinariaId) return;

    this.maquinariasService.updateMaquinaria(this.currentMaquinariaId, this.maquinariaForm).subscribe({
      next: (maquinariaActualizada) => {
        this.cargarMaquinarias();
        this.cerrarModal();
        this.showSuccess('Maquinaria actualizada exitosamente');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al actualizar maquinaria:', error);
        this.showError('Error al actualizar la maquinaria');
        this.isLoading = false;
      }
    });
  }

  eliminarMaquinaria(maquinaria: Maquinaria): void {
    if (!confirm(`¿Está seguro de eliminar la maquinaria "${maquinaria.nombre}"?`)) {
      return;
    }

    this.isLoading = true;
    this.maquinariasService.deleteMaquinaria(maquinaria.id).subscribe({
      next: () => {
        this.cargarMaquinarias();
        this.showSuccess('Maquinaria eliminada exitosamente');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al eliminar maquinaria:', error);
        this.showError('Error al eliminar la maquinaria');
        this.isLoading = false;
      }
    });
  }

  getEstadoClase(estado: string): string {
    switch (estado) {
      case 'disponible':
        return 'bg-green-100 text-green-800';
      case 'en_uso':
        return 'bg-blue-100 text-blue-800';
      case 'mantenimiento':
        return 'bg-yellow-100 text-yellow-800';
      case 'fuera_de_servicio':
        return 'bg-red-100 text-red-800';
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
      case 'mantenimiento':
        return 'Mantenimiento';
      case 'fuera_de_servicio':
        return 'Fuera de Servicio';
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