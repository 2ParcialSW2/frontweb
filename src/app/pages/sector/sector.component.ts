import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { SectorService } from '../../services/sector.service';
import { AlmacenService } from '../../services/almacen.service';

@Component({
  selector: 'app-sector',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './sector.component.html',
  styleUrl: './sector.component.css'
})

export class SectorComponent implements OnInit {

  isModalRegisterSectorOpen: boolean = false;
  isModalUpdateSectorOpen: boolean = false;
  nombre: any;
  tipo: any;
  stock: number = 0;
  capacidad_maxima: number = 0;
  descripcion: any = '';
  selectedAlmacen: any = "";
  almacenes: Array<any> = [];
  sectores: Array<any> = [];
  nombreUpdate: any;
  tipoUpdate: any;
  stockUpdate: number = 0;
  capacidad_maximaUpdate: number = 0;
  descripcionUpdate: any = '';
  almacenUpdate: any;
  sectorIdSelected: any;
  terminoBusqueda: string = '';
  sectoresFiltrados: Array<any> = [];

  constructor(private sectorService: SectorService, private almacenService: AlmacenService) {}

  ngOnInit(): void {
    this.getAlmacenes();
    this.getSectores();
  }

  getAlmacenes() {
    // Mostrar indicador de carga
    Swal.fire({
      title: 'Cargando almacenes...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.almacenService.getAlmacenes().subscribe({
      next: (resp: any) => {
        console.log('Almacenes recibidos:', resp);
        
        // Cerrar indicador de carga
        Swal.close();
        
        // Verificar el formato de la respuesta y asignar adecuadamente
        if (resp && resp.data && Array.isArray(resp.data)) {
          this.almacenes = resp.data;
        } else if (Array.isArray(resp)) {
          this.almacenes = resp;
        } else {
          console.error('Formato de respuesta inesperado para almacenes:', resp);
          this.almacenes = [];
        }
        
        // Verificar si hay almacenes disponibles
        if (this.almacenes.length === 0) {
          Swal.fire({
            icon: 'warning',
            title: 'Sin almacenes',
            text: 'No hay almacenes disponibles. Debe crear almacenes primero.'
          });
        }
      },
      error: (error: any) => {
        console.error('Error al cargar almacenes:', error);
        
        // Cerrar indicador de carga
        Swal.close();
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los almacenes. Por favor, intente nuevamente.'
        });
      }
    });
  }

  activeRegisterForm() {
    // Verificar si hay almacenes disponibles antes de abrir el modal
    if (this.almacenes.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin almacenes',
        text: 'No hay almacenes disponibles. Debe crear almacenes primero.'
      });
      return;
    }
    
    // Limpiar el formulario al abrirlo
    this.nombre = '';
    this.tipo = '';
    this.stock = 0;
    this.capacidad_maxima = 0;
    this.descripcion = '';
    this.selectedAlmacen = '';
    
    this.isModalRegisterSectorOpen = true;
  }

  // Método para limpiar el formulario
  limpiarFormulario() {
    this.nombre = '';
    this.tipo = '';
    this.stock = 0;
    this.capacidad_maxima = 0;
    this.descripcion = '';
    this.selectedAlmacen = '';
  }

  // Método principal para registrar sectores
  registerSector() {
    // Validar campos obligatorios
    if (!this.nombre || !this.selectedAlmacen) {
      Swal.fire({
        position: "center",
        icon: "error",
        title: "Nombre, tipo y almacén son campos obligatorios",
        showConfirmButton: false,
        timer: 2000
      });
      return;
    }
  
    // Validar que capacidad máxima sea mayor o igual que el stock
    if (this.capacidad_maxima < this.stock) {
      Swal.fire({
        position: "center",
        icon: "error",
        title: "La capacidad máxima debe ser mayor o igual al stock actual",
        showConfirmButton: false,
        timer: 2000
      });
      return;
    }
  
    // Verificar si ya existe un sector con el mismo nombre en el almacén seleccionado
    const sectorExistente = this.sectores.find(sector => 
      sector.nombre === this.nombre && sector.almacen.id === this.selectedAlmacen
    );
  
    if (sectorExistente) {
      Swal.fire({
        position: "center",
        icon: "error",
        title: "Ya existe un sector con el mismo nombre en este almacén",
        showConfirmButton: false,
        timer: 2000
      });
      return;
    }
  
    // Mostrar indicador de carga
    Swal.fire({
      title: 'Registrando sector...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  
    let sector = {
      nombre: this.nombre,
      tipo: this.tipo,
      stock: this.stock,
      capacidad_maxima: this.capacidad_maxima,
      descripcion: this.descripcion,
      almacenId: this.selectedAlmacen
    };
  
    this.sectorService.createSectores(sector).subscribe({
      next: (resp: any) => {
        console.log(resp);
        
        // Cerrar indicador de carga
        Swal.close();
        
        // Verificar diferentes formatos de respuesta exitosa
        const esExitoso = resp && (resp.id || (resp.data && resp.data.id));
  
        if (esExitoso) {
          // Actualizar la lista de sectores primero
          this.getSectores();
          
          // Luego mostrar mensaje de éxito
          Swal.fire({
            position: "center",
            icon: "success",
            title: "Sector registrado correctamente",
            showConfirmButton: false,
            timer: 2000
          });
          
          // Limpiar formulario
          this.limpiarFormulario();
          
          // Cerrar modal después de mostrar mensaje
          setTimeout(() => {
            this.closeRegisterSectorModal();
          }, 2100);
        } else {
          Swal.fire({
            position: "center",
            icon: "error",
            title: "Error al registrar el sector",
            text: resp.message || "Verifica los datos ingresados",
            showConfirmButton: true
          });
        }
      },
      error: (error: any) => {
        console.log('Error al registrar sector:', error);
        
        // Comprobar si el error es 409
        if (error.status === 409) {
          Swal.fire({
            position: "center",
            icon: "error",
            title: "Ya existe un sector con el mismo nombre en este almacén",
            text: error.error?.message || "Verifica los datos ingresados",
            showConfirmButton: true
          });
        } else {
          // Mensaje genérico para otros errores
          Swal.fire({
            position: "center",
            icon: "error",
            title: "Error al registrar el sector",
            text: error.error?.message || "Ocurrió un error en el servidor",
            showConfirmButton: true
          });
        }
      }
    });
  }
  

  getSectores() {
    // Mostrar indicador de carga
    Swal.fire({
      title: 'Cargando sectores...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.sectorService.getSectores().subscribe(
      {
        next: (resp: any) => {
          console.log(resp);
          // Cerrar indicador de carga
          Swal.close();
          
          // Verificar si la respuesta tiene el formato esperado (con propiedad data)
          if (resp && resp.data && Array.isArray(resp.data)) {
            this.sectores = resp.data;
          } else if (Array.isArray(resp)) {
            // Si la respuesta ya es un array, usarlo directamente
            this.sectores = resp;
          } else {
            console.error('Formato de respuesta inesperado:', resp);
            this.sectores = []; // Inicializar como array vacío para evitar errores
          }
          this.sectoresFiltrados = [...this.sectores];
          // Aplicar el filtro si hay término de búsqueda  this.filtrarSectores();
        },
        error: (error: any) => {
          console.log('Error al obtener sectores:', error);
          this.sectores = []; // Inicializar como array vacío en caso de error
          
          // Cerrar indicador de carga y mostrar error
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los sectores. Por favor, intente nuevamente.'
          });
        }
      }
    );
  }

  openModalToUpdateSector(sector: any) {
    console.log('sector id: ' + sector.id);
    this.isModalUpdateSectorOpen = true;
    this.nombreUpdate = sector.nombre;
    this.tipoUpdate = sector.tipo;
    this.stockUpdate = sector.stock || 0;
    this.capacidad_maximaUpdate = sector.capacidad_maxima || 0;
    this.descripcionUpdate = sector.descripcion || '';
    this.almacenUpdate = sector.almacen?.id;
    this.sectorIdSelected = sector.id;
  }

  actualizarSector() {
    // Validar campos obligatorios
    if (!this.nombreUpdate || !this.almacenUpdate) {
      Swal.fire({
        position: "center",
        icon: "error",
        title: "Nombre y almacén son campos obligatorios",
        showConfirmButton: false,
        timer: 2000
      });
      return;
    }

    // Validar que capacidad máxima sea mayor o igual que el stock
    if (this.capacidad_maximaUpdate < this.stockUpdate) {
      Swal.fire({
        position: "center",
        icon: "error",
        title: "La capacidad máxima debe ser mayor o igual al stock actual",
        showConfirmButton: false,
        timer: 2000
      });
      return;
    }

    // Mostrar indicador de carga
    Swal.fire({
      title: 'Actualizando sector...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    let sectorData = {
      nombre: this.nombreUpdate,
      tipo: this.tipoUpdate,
      stock: this.stockUpdate,
      capacidad_maxima: this.capacidad_maximaUpdate,
      descripcion: this.descripcionUpdate,
      almacenId: this.almacenUpdate
    };

    console.log('Datos de actualización:', sectorData);

    this.sectorService.updateSectores(this.sectorIdSelected, sectorData).subscribe(
      {
        next: (resp: any) => {
          console.log(resp);
          
          // Cerrar indicador de carga
          Swal.close();
          
          // Actualizar la lista de sectores primero
          this.getSectores();
          
          Swal.fire({
            position: "center",
            icon: "success",
            title: "Sector actualizado correctamente",
            showConfirmButton: false,
            timer: 2000
          });

          setTimeout(() => {
            this.closeUpdateSectorModal();
          }, 2100);
        },
        error: (error: any) => {
          console.log(error);
          
          Swal.fire({
            position: "center",
            icon: "error",
            title: "Error al actualizar el sector",
            text: error.error?.message || "Ocurrió un error en el servidor",
            showConfirmButton: true
          });
        }
      }
    );
  }

  deleteSector(sector: any) {
    // Confirmación antes de eliminar
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar el sector ${sector.nombre}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Mostrar indicador de carga
        Swal.fire({
          title: 'Eliminando sector...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        
        this.sectorService.deleteSector(sector.id).subscribe({
          next: (resp: any) => {
            console.log(resp);
            
            // Actualizar la lista de sectores primero
            this.getSectores();
            
            Swal.fire({
              position: "center",
              icon: "success",
              title: "Sector eliminado correctamente",
              showConfirmButton: false,
              timer: 2000
            });
          },
          error: (error: any) => {
            console.log(error);
            
            Swal.fire({
              position: "center",
              icon: "error",
              title: "Error al eliminar el sector",
              text: error.error?.message || "Ocurrió un error en el servidor",
              showConfirmButton: true
            });
          }
        });
      }
    });
  }

  updateAlmacenId($event: any) {
    this.almacenUpdate = $event;
    console.log(this.almacenUpdate);
    console.log($event);
  }

  closeRegisterSectorModal() {
    this.isModalRegisterSectorOpen = false;
  }

  closeUpdateSectorModal() {
    this.isModalUpdateSectorOpen = false;
  }

  buscarSector(): void {
    const termino = this.terminoBusqueda.trim().toLowerCase();
    if (termino === '') {
      this.sectoresFiltrados = this.sectores;
    } else {
      this.sectoresFiltrados = this.sectores.filter(sub =>
        sub.nombre.toLowerCase().includes(termino)
      );
    }
  }

  filtrarSectores() {
    if (!this.terminoBusqueda || this.terminoBusqueda.trim() === '') {
      this.sectoresFiltrados = this.sectores;
      return;
    }
    
    const termino = this.terminoBusqueda.toLowerCase().trim();
    this.sectoresFiltrados = this.sectores.filter(sector => 
      sector.nombre.toLowerCase().includes(termino) || 
      sector.tipo.toLowerCase().includes(termino) ||
      (sector.almacen?.nombre && sector.almacen.nombre.toLowerCase().includes(termino))
    );
  }
}