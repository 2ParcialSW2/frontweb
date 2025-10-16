import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProveedorMaterialService } from '../../services/proveedor-material.service';
import { ProveedoresService } from '../../services/proveedores.service'; 
import { MaterialesService } from '../../services/materiales.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-proveedor-material',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proveedor-material.component.html',
  styleUrls: ['./proveedor-material.component.css']
})
export class ProveedorMaterialComponent implements OnInit {
  proveedorId: number = 0;
  proveedorNombre: string = '';
  materiales: any = { data: [] };
  proveedores: any[] = [];
  materialesDisponibles: any[] = [];
  
  nuevoMaterial: any = {
    proveedorId: null,
    materialId: null,
    precio: null,
    cantidadMinima: null,
    descripcion: ''
  };
  
  // Variables para controlar modales
  modalNuevoMaterial: boolean = false;
  modalEditarMaterial: boolean = false;
  modalConfirmarEliminar: boolean = false;
  
  // Variable para edición
  materialEditando: any = {};
  materialIdEliminar: number = 0;

  constructor(
    private proveedorMaterialService: ProveedorMaterialService,
    private proveedorService: ProveedoresService,
    private materialService: MaterialesService
  ) {}

  ngOnInit(): void {
    this.cargarProveedores();
    this.cargarMaterialesDisponibles();
  }

  cargarProveedores(): void {
    this.proveedorService.getProveedores().subscribe({
      next: (response) => {
        this.proveedores = response;
      },
      error: (error) => {
        console.error('Error al cargar proveedores', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los proveedores',
          confirmButtonColor: '#3085d6'
        });
      }
    });
  }

  cargarMaterialesDisponibles(): void {
    this.materialService.getMateriales().subscribe({
      next: (response) => {
        this.materialesDisponibles = response;
      },
      error: (error) => {
        console.error('Error al cargar materiales', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los materiales disponibles',
          confirmButtonColor: '#3085d6'
        });
      }
    });
  }

  obtenerMateriales(): void {
    if (this.proveedorId) {
      this.proveedorMaterialService.getMaterialesByProveedor(this.proveedorId).subscribe({
        next: (response) => {
          this.materiales = response;
          // Obtener el nombre del proveedor seleccionado
          const proveedorSeleccionado = this.proveedores.find(p => p.id == this.proveedorId);
          if (proveedorSeleccionado) {
            this.proveedorNombre = proveedorSeleccionado.nombre;
          }
        },
        error: (error) => {
          console.error('Error al obtener materiales', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al obtener los materiales del proveedor',
            confirmButtonColor: '#3085d6'
          });
        }
      });
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Atención',
        text: 'Debe seleccionar un proveedor primero',
        confirmButtonColor: '#3085d6'
      });
    }
  }

  abrirModalNuevoMaterial(): void {
    
    
    this.nuevoMaterial = {
      proveedorId: this.proveedorId,
      materialId: null,
      precio: null,
      cantidadMinima: null,
      descripcion: ''
    };
    this.modalNuevoMaterial = true;
  }

  cerrarModalNuevoMaterial(): void {
    this.modalNuevoMaterial = false;
  }

  asociarMaterial(): void {
    if (!this.nuevoMaterial.proveedorId || !this.nuevoMaterial.materialId) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor seleccione un proveedor y un material',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    this.proveedorMaterialService.asociarMaterialAProveedor(
      this.nuevoMaterial.proveedorId, 
      {
        materialId: this.nuevoMaterial.materialId,
        precio: this.nuevoMaterial.precio,
        cantidadMinima: this.nuevoMaterial.cantidadMinima,
        descripcion: this.nuevoMaterial.descripcion
      }
    ).subscribe({
      next: (response) => {
        console.log('Material asociado con éxito', response);
        this.cerrarModalNuevoMaterial();
        
        // Si el proveedor del modal es el mismo que está siendo visualizado
        if (this.nuevoMaterial.proveedorId == this.proveedorId) {
          this.obtenerMateriales();
        }
        
        Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: 'Material asociado correctamente al proveedor',
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false
        });
      },
      error: (error) => {
        console.error('Error al asociar material', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al asociar material. Verifique los datos e intente nuevamente.',
          confirmButtonColor: '#d33'
        });
      }
    });
  }

  abrirModalEditarMaterial(item: any): void {
    // Crear una copia con los datos requeridos para la edición
    this.materialEditando = {
      proveedorId: this.proveedorId,
      materialId: item.material.id,
      precio: item.precio,
      cantidadMinima: item.cantidadMinima,
      descripcion: item.descripcion
    };
    this.modalEditarMaterial = true;
  }

  cerrarModalEditarMaterial(): void {
    this.modalEditarMaterial = false;
  }

  actualizarMaterial(): void {
    if (!this.materialEditando.proveedorId || !this.materialEditando.materialId) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor seleccione un proveedor y un material',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    // Objeto para actualizar
    const materialActualizado = {
      materialId: this.materialEditando.materialId,
      precio: this.materialEditando.precio,
      cantidadMinima: this.materialEditando.cantidadMinima,
      descripcion: this.materialEditando.descripcion
    };

    this.proveedorMaterialService.asociarMaterialAProveedor(
      this.materialEditando.proveedorId, 
      materialActualizado
    ).subscribe({
      next: (response) => {
        console.log('Material actualizado con éxito', response);
        this.cerrarModalEditarMaterial();
        
        // Si el proveedor modificado es el que está siendo visualizado
        if (this.materialEditando.proveedorId == this.proveedorId) {
          this.obtenerMateriales();
        }
        
        Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: 'Material actualizado correctamente',
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false
        });
      },
      error: (error) => {
        console.error('Error al actualizar material', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al actualizar el material. Intente nuevamente.',
          confirmButtonColor: '#d33'
        });
      }
    });
  }

  confirmarEliminarMaterial(materialId: number): void {
    this.materialIdEliminar = materialId;
    this.modalConfirmarEliminar = true;
  }

  cerrarModalConfirmarEliminar(): void {
    this.modalConfirmarEliminar = false;
    this.materialIdEliminar = 0;
  }

  eliminarMaterial(materialId: number): void {
    if (!this.proveedorId || !materialId) {
      Swal.fire({
        icon: 'warning',
        title: 'Falta información',
        text: 'No se puede eliminar el material sin un proveedor y material seleccionados',
        confirmButtonColor: '#3085d6'
      });
      return;
    }
  
    this.proveedorMaterialService.eliminarMaterialDeProveedor(this.proveedorId, materialId).subscribe({
      next: (response) => {
        console.log('Material eliminado con éxito', response);
        this.cerrarModalConfirmarEliminar();
        this.obtenerMateriales();
  
        Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'Material eliminado correctamente del proveedor',
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false
        });
      },
      error: (error) => {
        console.error('Error al eliminar material', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo eliminar el material. Intente nuevamente.',
          confirmButtonColor: '#d33'
        });
      }
    });
  }
}