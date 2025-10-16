import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../services/rol.service';
import { Rol } from '../../models/rol.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-rol',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rol.component.html',
  styleUrl: './rol.component.css'
})
export class RolComponent implements OnInit {
  roles: Rol[] = [];
  nuevoRol: string = '';
  rolEditando: Rol | null = null;
  nombreRolEditando: string = '';
  mostrarModalNuevoRol: boolean = false;
  mostrarModalEditarRol: boolean = false;

  constructor(private roleService: RoleService) {}

  ngOnInit(): void {
    this.cargarRoles();
  }

  cargarRoles(): void {
    Swal.fire({
      title: 'Cargando roles...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.roleService.getRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
        Swal.close();
      },
      error: (error) => {
        console.error('Error al cargar roles:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los roles. Por favor, intente nuevamente.'
        });
      }
    });
  }

  abrirModalNuevoRol(): void {
    this.nuevoRol = '';
    this.mostrarModalNuevoRol = true;
  }

  cerrarModalNuevoRol(): void {
    this.mostrarModalNuevoRol = false;
  }

  guardarNuevoRol(): void {
    if (!this.nuevoRol.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'El nombre del rol no puede estar vacío'
      });
      return;
    }

    Swal.fire({
      title: 'Guardando...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.roleService.createRole(this.nuevoRol).subscribe({
      next: (resultado) => {
        this.cargarRoles();
        this.cerrarModalNuevoRol();
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Rol creado correctamente',
          timer: 1500,
          showConfirmButton: false
        });
      },
      error: (error) => {
        console.error('Error al crear rol:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'No se pudo crear el rol. Por favor, intente nuevamente.'
        });
      }
    });
  }

  abrirModalEditarRol(rol: Rol): void {
    this.rolEditando = { ...rol };
    this.nombreRolEditando = rol.nombre;
    this.mostrarModalEditarRol = true;
  }

  cerrarModalEditarRol(): void {
    this.mostrarModalEditarRol = false;
    this.rolEditando = null;
  }

  actualizarRol(): void {
    if (!this.nombreRolEditando.trim() || !this.rolEditando) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'El nombre del rol no puede estar vacío'
      });
      return;
    }

    Swal.fire({
      title: 'Actualizando...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.roleService.updateRole(this.rolEditando.id, this.nombreRolEditando).subscribe({
      next: (resultado) => {
        this.cargarRoles();
        this.cerrarModalEditarRol();
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Rol actualizado correctamente',
          timer: 1500,
          showConfirmButton: false
        });
      },
      error: (error) => {
        console.error('Error al actualizar rol:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'No se pudo actualizar el rol. Por favor, intente nuevamente.'
        });
      }
    });
  }

  confirmarEliminarRol(rol: Rol): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar el rol "${rol.nombre}"? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.eliminarRol(rol);
      }
    });
  }

  eliminarRol(rol: Rol): void {
    Swal.fire({
      title: 'Eliminando...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.roleService.deleteRole(rol.id).subscribe({
      next: () => {
        this.cargarRoles();
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Rol eliminado correctamente',
          timer: 1500,
          showConfirmButton: false
        });
      },
      error: (error) => {
        console.error('Error al eliminar rol:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'No se pudo eliminar el rol. Por favor, intente nuevamente.'
        });
      }
    });
  }
}
