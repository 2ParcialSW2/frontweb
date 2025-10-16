import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlmacenService} from '../../services/almacen.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-almacen',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './almacen.component.html',
  styleUrl: './almacen.component.scss'
})
export default class AlmacenComponent implements OnInit {

  // Lista de almacenes
  almacenes: any[] = [];
  almacen:any;
  almacenUpdate:any;
  nombreAlmacen:String='';
  capacidadAlmacen: number = 0; 
  capacidadAlmacenUpdate: any;
  almacenIdSelected: any;
  isModalRegisterAlmacenOpen: boolean = false;
  isModalUpdateAlmacenOpen: boolean = false;
  
  // Filtro de capacidad
  capacidadFiltro: number = 0;
  almacenIdSeleccionado: number = 0;
  almacenFiltrados: any[] = []; // visibles según filtro
  filtro: string = '';

  constructor(private almacenService: AlmacenService) { }

  ngOnInit(): void {
    this.getAlmacenes();
  }
    
  getAlmacenes(): void {
    Swal.fire({
    title: 'Cargando almacenes...',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });
    this.almacenService.getAlmacenes().subscribe({
      next: (data: any) => {
        console.log('Respuesta del servidor en getAlmacenes():', data);
        
        // Verificar la estructura de la respuesta
        if (data && typeof data === 'object') {
          // Si la respuesta es un objeto con una propiedad que contiene el array
          // (común en APIs REST que envuelven datos en un objeto de respuesta)
          if (data.content && Array.isArray(data.content)) {
            this.almacenes = data.content;
          } else if (data.data && Array.isArray(data.data)) {
            this.almacenes = data.data;
          } else if (data.almacenes && Array.isArray(data.almacenes)) {
            this.almacenes = data.almacenes;
          } else if (Array.isArray(data)) {
            // Si la respuesta es directamente un array
            this.almacenes = data;
          } else {
            // Si los datos están en otra estructura, intentamos convertirlos a array
            const posibleArray = Object.values(data).find(val => Array.isArray(val));
            if (posibleArray) {
              this.almacenes = posibleArray;
            } else {
              console.error('No se pudo identificar un array en la respuesta:', data);
              this.almacenes = [];
            }
          }
        } else if (Array.isArray(data)) {
          // Si directamente es un array
          this.almacenes = data;
        } else {
          console.error('Respuesta con formato desconocido:', data);
          this.almacenes = [];
        }
        this.almacenFiltrados = [...this.almacenes];
        console.log('Almacenes procesados:', this.almacenes);
        console.log('Longitud del array de almacenes:', this.almacenes.length);
        
        // Cerrar cualquier diálogo de carga
        Swal.close();
      },
      error: (error) => {
        console.error('Error al cargar almacenes:', error);
        Swal.fire({
          position: "center",
          icon: "error",
          title: "Error al cargar almacenes",
          showConfirmButton: false,
          timer: 2500
        });
      }
    });
  }
  
  buscarAlmacenes(): void {
    const termino = this.filtro.trim().toLowerCase();
    if (termino === '') {
      this.almacenFiltrados = this.almacenes;
    } else {
      this.almacenFiltrados = this.almacenes.filter(sub =>
        sub.nombre.toLowerCase().includes(termino)
      );
    }
  }

  createAlmacen(): void {
    if (!this.nombreAlmacen.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'El nombre del almacen no puede estar vacío'
      });
      return;
    }
    
    if (this.capacidadAlmacen <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Capacidad inválida',
        text: 'La capacidad del almacen debe ser mayor que cero'
      });
      return;
    }

    const almacenPayload = {
      nombre: this.nombreAlmacen.trim(),
      capacidad: this.capacidadAlmacen // Se enviará como número
    };

    this.almacenService.createAlmacen(almacenPayload).subscribe({
      next: (data) => {
        this.almacenes.push(data);
        this.resetForm();
        this.getAlmacenes();
        Swal.fire({
          position: "center",
          icon: "success",
          title: "Almacen registrado!",
          showConfirmButton: false,
          timer: 2500
        });
        setTimeout(() => {
          this.closeRegisterAlmacenModal();
        }, 2600);
      },
      error: (error: any) => {
        console.log('Error al registrar el almacen:', error);
        Swal.fire({
          position: "center",
          icon: "error",
          title: "Error al registrar el almacen!",
          showConfirmButton: false,
          timer: 2500
        });
      }
    });
  }

  activeRegisterForm() {
    this.isModalRegisterAlmacenOpen = true;
    this.resetForm();
  }

  openModalToUpdateAlmacen(almacen: any) {
    console.log('almacen id: ' + almacen.id);
    this.isModalUpdateAlmacenOpen = true;
    // Aquí guardamos los datos para actualizar
    this.almacenUpdate = almacen.nombre;
    this.capacidadAlmacenUpdate = almacen.capacidad;
    this.almacenIdSelected = almacen.id;
  }

  updateAlmacen() {
    if (!this.almacenUpdate.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'El nombre del almacen no puede estar vacío'
      });
      return;
    }
  
    if (this.capacidadAlmacenUpdate <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Capacidad inválida',
        text: 'La capacidad del almacen debe ser mayor que cero'
      });
      return;
    }
  
    const almacenData = {
      id: this.almacenIdSelected,
      nombre: this.almacenUpdate.trim(),
      capacidad: this.capacidadAlmacenUpdate
    };
  
    this.almacenService.updateAlmacen(this.almacenIdSelected, almacenData).subscribe({
      next: (resp: any) => {
        console.log(resp);
  
        // ✅ Actualizar el objeto modificado en el array local
        const index = this.almacenes.findIndex(a => a.id === this.almacenIdSelected);
        if (index !== -1) {
          this.almacenes[index] = { ...this.almacenes[index], ...almacenData };
        }
  
        Swal.fire({
          position: "center",
          icon: "success",
          title: "Almacén actualizado!",
          showConfirmButton: false,
          timer: 2500
        });
  
        setTimeout(() => {
          this.closeUpdateAlmacenModal();
        }, 2600);
      },
      error: (error: any) => {
        console.log(error);
        Swal.fire({
          position: "center",
          icon: "error",
          title: "Error al actualizar el almacén!",
          showConfirmButton: false,
          timer: 2500
        });
      }
    });
  }
  
  deleteAlmacen(almacen: any) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar el almacén "${almacen.nombre}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.almacenService.deleteAlmacen(almacen.id).subscribe({
          next: (resp: any) => {
            console.log(resp);
            this.getAlmacenes();
            Swal.fire({
              position: "center",
              icon: "success",
              title: "Almacen eliminado!",
              showConfirmButton: false,
              timer: 2500
            });
          },
          error: (error: any) => {
            console.log(error);
            Swal.fire({
              position: "center",
              icon: "error",
              title: "Error al eliminar el almacen",
              showConfirmButton: false,
              timer: 2500
            });
          }
        });
      }
    });
  }

  // Método para resetear el formulario
  resetForm() {
    this.nombreAlmacen = '';
    this.capacidadAlmacen = 0; // Cambiado a 0 como valor numérico por defecto
  }

  closeRegisterAlmacenModal() {
    this.isModalRegisterAlmacenOpen = false;
    // Resetear el formulario al cerrar el modal
    this.resetForm();
  }

  closeUpdateAlmacenModal() {
    this.isModalUpdateAlmacenOpen = false;
  }
}