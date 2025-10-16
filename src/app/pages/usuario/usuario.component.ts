import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import Swal from 'sweetalert2'
//import { error } from 'console';
import { UserService } from '../../services/user.service';
import { RoleService } from '../../services/rol.service';



@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './usuario.component.html',
  styleUrl: './usuario.component.css'
})

export class UsuarioComponent implements OnInit {
  usersFiltrados: any[] = []; // visibles según filtro
  filtro: string = '';
  isModalRegisterUserOpen: boolean = false;
  isModalUpdateUserOpen: boolean = false;
  username: any;
  apellido: any;
  password: any;
  email: any;
  telefono: any;
  direccion: any;
  selectedRole: any = "";
  roles: Array<any>;
  users: Array<any> = [];
  usernameUpdate: any;
  apellidoUpdate: any;
  passwordUpdate: any;
  emailUpdate: any;
  telefonoUpdate: any;
  direccionUpdate: any;
  roleUpdate: any;
  userIdSelected: any;
  

  constructor(private userService: UserService, private roleService: RoleService) {
    this.roles = [];
  }

  ngOnInit(): void {
    this.getRoles();
    this.getUsers();
  }

 
  getRoles() {
    this.roleService.getRoles().subscribe(
      {
        next: (resp: any) => {
          console.log(resp);
          this.roles = resp;
        },
        error: (error: any) => {
          console.log(error);
        }
      }
    );
  }

  activeRegisterForm() {
    // Limpiar el formulario al abrirlo
    this.username = '';
    this.apellido = '';
    this.password = '';
    this.email = '';
    this.telefono = '';
    this.direccion = '';
    this.selectedRole = '';
    
    this.isModalRegisterUserOpen = true;
  }

  // Método para limpiar el formulario
  limpiarFormulario() {
    this.username = '';
    this.apellido = '';
    this.password = '';
    this.email = '';
    this.telefono = '';
    this.direccion = '';
    this.selectedRole = '';
  }

  // Método principal para registrar usuarios
  registerUser() {
    // Validar campos obligatorios
    if (!this.username || !this.apellido || !this.password || !this.email || !this.selectedRole) {
      Swal.fire({
        position: "center",
        icon: "error",
        title: "Todos los campos son obligatorios",
        showConfirmButton: false,
        timer: 2000
      });
      return;
    }

    // Mostrar indicador de carga
    Swal.fire({
      title: 'Registrando usuario...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    let user = {
      nombre: this.username,
      apellido: this.apellido,
      password: this.password,
      email: this.email,
      telefono: this.telefono,
      direccion: this.direccion,
      rolid: this.selectedRole
    };

    this.userService.registrarUsuario(user).subscribe({
      next: (resp: any) => {
        console.log(resp);
        
        // Cerrar indicador de carga
        Swal.close();
        
        // Verificar diferentes formatos de respuesta exitosa
        const esExitoso = resp.id || 
                         (resp.data && resp.data.id) || 
                         resp.statusCode === 200 || 
                         resp.statusCode === 201;
        
        if (esExitoso) {
          // Actualizar la lista de usuarios primero
          this.getUsers();
          
          // Luego mostrar mensaje de éxito
          Swal.fire({
            position: "center",
            icon: "success",
            title: "Usuario registrado correctamente",
            showConfirmButton: false,
            timer: 2000
          });
          
          // Limpiar formulario
          this.limpiarFormulario();
          
          // Cerrar modal después de mostrar mensaje
          setTimeout(() => {
            this.closeRegisterUserModal();
          }, 2100);
        } else {
          Swal.fire({
            position: "center",
            icon: "error",
            title: "Error al registrar el usuario",
            text: resp.message || "Verifica los datos ingresados",
            showConfirmButton: true
          });
        }
      },
      error: (error: any) => {
        console.log('Error al registrar usuario:', error);
        
        Swal.fire({
          position: "center",
          icon: "error",
          title: "Error al registrar el usuario",
          text: error.error?.message || "Ocurrió un error en el servidor",
          showConfirmButton: true
        });
      }
    });
  }


  getUsers() {
    // Mostrar indicador de carga
    Swal.fire({
      title: 'Cargando usuarios...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.userService.listarUsuarios().subscribe(
      {
        next: (resp: any) => {
          console.log(resp);
          // Cerrar indicador de carga
          Swal.close();
          
          // Verificar si la respuesta tiene el formato esperado (con propiedad data)
          if (resp && resp.data && Array.isArray(resp.data)) {
            this.users = resp.data;
          } else if (Array.isArray(resp)) {
            // Si la respuesta ya es un array, usarlo directamente
            this.users = resp;
          } else {
            console.error('Formato de respuesta inesperado:', resp);
            this.users = []; // Inicializar como array vacío para evitar errores
          }
          this.usersFiltrados = [...this.users];  //se copia para la busqueda
        },
        error: (error: any) => {
          console.log('Error al obtener usuarios:', error);
          this.users = []; // Inicializar como array vacío en caso de error
          
          // Cerrar indicador de carga y mostrar error
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los usuarios. Por favor, intente nuevamente.'
          });
        }
      }
    );
  }

  buscarUsuarios(): void {
    const termino = this.filtro.trim().toLowerCase();
    if (termino === '') {
      this.usersFiltrados = this.users;
    } else {
      this.usersFiltrados = this.users.filter(sub =>
        sub.nombre.toLowerCase().includes(termino)
      );
    }
  }

  openModalToUpdateUser(user: any) {
    console.log('user id: ' + user.id);
    this.isModalUpdateUserOpen = true;
    this.usernameUpdate = user.nombre;
    this.apellidoUpdate = user.apellido;
    this.passwordUpdate = '';  // Por seguridad no mostramos la contraseña
    this.emailUpdate = user.email;
    this.telefonoUpdate = user.telefono;
    this.direccionUpdate = user.direccion;
    this.roleUpdate = user.rol?.id;
    this.userIdSelected = user.id;
  }

  actualizarUsuario() {
    // Mostrar indicador de carga
    Swal.fire({
      title: 'Actualizando usuario...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Crear objeto de datos base
    let userData: any = {
      nombre: this.usernameUpdate,
      apellido: this.apellidoUpdate,
      email: this.emailUpdate,
      telefono: this.telefonoUpdate,
      direccion: this.direccionUpdate,
      rolid: this.roleUpdate
    };

    // Añadir la contraseña solo si no está vacía
    if (this.passwordUpdate && this.passwordUpdate.trim() !== '') {
      userData.password = this.passwordUpdate;
    }

    console.log('Datos de actualización:', userData);

    this.userService.actualizarUsuario(this.userIdSelected, userData).subscribe(
      {
        next: (resp: any) => {
          console.log(resp);
          
          // Cerrar indicador de carga
          Swal.close();
          
          // Actualizar la lista de usuarios primero
          this.getUsers();
          
          Swal.fire({
            position: "center",
            icon: "success",
            title: "Usuario actualizado correctamente",
            showConfirmButton: false,
            timer: 2000
          });

          setTimeout(() => {
            this.closeUpdateUserModal();
          }, 2100);
        },
        error: (error: any) => {
          console.log(error);
          
          Swal.fire({
            position: "center",
            icon: "error",
            title: "Error al actualizar el usuario",
            text: error.error?.message || "Ocurrió un error en el servidor",
            showConfirmButton: true
          });
        }
      }
    );
  }

  deleteUser(user: any) {
    // Confirmación antes de eliminar
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar al usuario ${user.nombre}?`,
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
          title: 'Eliminando usuario...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        
        this.userService.deleteUser(user.id).subscribe({
          next: (resp: any) => {
            console.log(resp);
            
            // Actualizar la lista de usuarios primero
            this.getUsers();
            
            Swal.fire({
              position: "center",
              icon: "success",
              title: "Usuario eliminado correctamente",
              showConfirmButton: false,
              timer: 2000
            });
          },
          error: (error: any) => {
            console.log(error);
            
            Swal.fire({
              position: "center",
              icon: "error",
              title: "Error al eliminar el usuario",
              text: error.error?.message || "Ocurrió un error en el servidor",
              showConfirmButton: true
            });
          }
        });
      }
    });
  }

  updateRoleId($event: any) {
    this.roleUpdate = $event;
    console.log(this.roleUpdate);
    console.log($event);
  }

  closeRegisterUserModal() {
    this.isModalRegisterUserOpen = false;
  }

  closeUpdateUserModal() {
    this.isModalUpdateUserOpen = false;
  }
}
