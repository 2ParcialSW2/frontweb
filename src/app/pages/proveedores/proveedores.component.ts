import { Component, OnInit } from '@angular/core';
import { ProveedoresService } from '../../services/proveedores.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './proveedores.component.html',
  styleUrl: './proveedores.component.css'
})
export class ProveedoresComponent implements OnInit {
  proveedores: any[] = [];
  nuevoProveedor: any = {
    nombre: '',
    ruc: '',
    direccion: '',
    telefono: '',
    email: '',
    personaContacto: '',
    activo: true
  };
  
  proveedorUpdate: any = {};
  proveedorIdSelected: number | null = null;
  isModalRegisterProveedorOpen: boolean = false;
  isModalUpdateProveedorOpen: boolean = false;
  busquedaTexto: string = '';

  constructor(private proveedorService: ProveedoresService) { }

  ngOnInit(): void {
    this.getProveedores();
  }

  getProveedores(): void {
    this.proveedorService.getProveedores().subscribe({
      next: (data) => {
        this.proveedores = data;
        console.log('Proveedores cargados:', this.proveedores);
      },
      error: (error) => {
        console.error('Error al obtener los proveedores', error);
        Swal.fire({
          position: "center",
          icon: "error",
          title: "Error al cargar proveedores",
          text: `No se pudieron cargar los proveedores. ${error.message || 'Intente nuevamente.'}`,
          showConfirmButton: true
        });
      }
    });
  }

  buscarProveedores(): void {
    if (!this.busquedaTexto.trim()) {
      this.getProveedores();
      return;
    }
    
    this.proveedorService.buscarProveedores(this.busquedaTexto).subscribe({
      next: (data) => {
        this.proveedores = data;
      },
      error: (error) => {
        console.error('Error en la búsqueda:', error);
        // Si falla la búsqueda en el backend, intentamos filtrar localmente
        this.proveedores = this.proveedores.filter(p => 
          p.nombre?.toLowerCase().includes(this.busquedaTexto.toLowerCase()) ||
          p.ruc?.toLowerCase().includes(this.busquedaTexto.toLowerCase()) ||
          p.email?.toLowerCase().includes(this.busquedaTexto.toLowerCase())
        );
      }
    });
  }

  createProveedor(): void {
    if (!this.nuevoProveedor.nombre?.trim() || !this.nuevoProveedor.ruc?.trim()) {
      Swal.fire({
        position: "center",
        icon: "warning",
        title: "Datos incompletos",
        text: "El nombre y RUC del proveedor son obligatorios",
        showConfirmButton: false,
        timer: 2500
      });
      return;
    }
    
    this.proveedorService.createProveedor(this.nuevoProveedor).subscribe({
      next: (data) => {
        Swal.fire({
          position: "center",
          icon: "success",
          title: "Proveedor registrado exitosamente",
          showConfirmButton: false,
          timer: 2500
        });
        this.getProveedores();
        this.closeRegisterProveedorModal();
        this.resetNuevoProveedor();
      },
      error: (error: any) => {
        console.error('Error al registrar el proveedor:', error);
        Swal.fire({
          position: "center",
          icon: "error",
          title: "Error al registrar el proveedor",
          text: error.error?.message || "Verifique los datos e intente nuevamente",
          showConfirmButton: false,
          timer: 2500
        });
      }
    });
  }

  resetNuevoProveedor(): void {
    this.nuevoProveedor = {
      nombre: '',
      ruc: '',
      direccion: '',
      telefono: '',
      email: '',
      personaContacto: '',
      activo: true
    };
  }

  updateProveedor(): void {
    if (!this.proveedorUpdate.nombre?.trim() || !this.proveedorUpdate.ruc?.trim()) {
      Swal.fire({
        position: "center",
        icon: "warning",
        title: "Datos incompletos",
        text: "El nombre y RUC del proveedor son obligatorios",
        showConfirmButton: false,
        timer: 2500
      });
      return;
    }

    if (this.proveedorIdSelected === null) {
      console.error('ID de proveedor no seleccionado');
      return;
    }

    this.proveedorService.updateProveedor(this.proveedorIdSelected, this.proveedorUpdate).subscribe({
      next: (data) => {
        Swal.fire({
          position: "center",
          icon: "success",
          title: "Proveedor actualizado exitosamente",
          showConfirmButton: false,
          timer: 2500
        });
        this.getProveedores();
        this.closeUpdateProveedorModal();
      },
      error: (error) => {
        console.error('Error al actualizar el proveedor:', error);
        Swal.fire({
          position: "center",
          icon: "error",
          title: "Error al actualizar el proveedor",
          text: error.error?.message || "Verifique los datos e intente nuevamente",
          showConfirmButton: false,
          timer: 2500
        });
      }
    });
  }

  deleteProveedor(proveedor: any): void {
    Swal.fire({
      title: "¿Está seguro?",
      text: `¿Desea eliminar el proveedor ${proveedor.nombre}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    }).then((result) => {
      if (result.isConfirmed) {
        this.proveedorService.deleteProveedor(proveedor.id).subscribe({
          next: () => {
            Swal.fire({
              position: "center",
              icon: "success",
              title: "Proveedor eliminado exitosamente",
              showConfirmButton: false,
              timer: 2500
            });
            this.getProveedores();
          },
          error: (error) => {
            console.error('Error al eliminar el proveedor:', error);
            Swal.fire({
              position: "center",
              icon: "error",
              title: "Error al eliminar el proveedor",
              text: error.error?.message || "Es posible que este proveedor tenga registros asociados",
              showConfirmButton: true
            });
          }
        });
      }
    });
  }

  cambiarEstadoProveedor(proveedor: any): void {
    const nuevoEstado = !proveedor.activo;
    const estadoTexto = nuevoEstado ? "activar" : "desactivar";
    
    Swal.fire({
      title: "¿Está seguro?",
      text: `¿Desea ${estadoTexto} el proveedor ${proveedor.nombre}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, confirmar",
      cancelButtonText: "Cancelar"
    }).then((result) => {
      if (result.isConfirmed) {
        this.proveedorService.cambiarEstadoProveedor(proveedor.id, nuevoEstado).subscribe({
          next: () => {
            Swal.fire({
              position: "center",
              icon: "success",
              title: `Proveedor ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente`,
              showConfirmButton: false,
              timer: 2500
            });
            this.getProveedores();
          },
          error: (error) => {
            console.error(`Error al ${estadoTexto} el proveedor:`, error);
            Swal.fire({
              position: "center",
              icon: "error",
              title: `Error al ${estadoTexto} el proveedor`,
              text: error.error?.message || "Intente nuevamente",
              showConfirmButton: true
            });
          }
        });
      }
    });
  }

  closeRegisterProveedorModal(): void {
    this.isModalRegisterProveedorOpen = false;
    this.resetNuevoProveedor();
  }

  closeUpdateProveedorModal(): void {
    this.isModalUpdateProveedorOpen = false;
    this.proveedorIdSelected = null;
    this.proveedorUpdate = {};
  }

  activeRegisterForm(): void {
    this.isModalRegisterProveedorOpen = true;
  }

  openModalToUpdateProveedor(proveedor: any): void {
    this.isModalUpdateProveedorOpen = true;
    this.proveedorIdSelected = proveedor.id;
    // Clonamos el objeto para no modificar el original directamente
    this.proveedorUpdate = {
      nombre: proveedor.nombre,
      ruc: proveedor.ruc,
      direccion: proveedor.direccion,
      telefono: proveedor.telefono,
      email: proveedor.email,
      personaContacto: proveedor.personaContacto,
      activo: proveedor.activo
    };
  }
}