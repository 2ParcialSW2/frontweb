import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  styleUrls: ['./register-admin.component.css'],
  templateUrl: './register-admin.component.html'
})
export class RegisterAdminComponent {
  nombre: string = '';
  apellido: string = '';
  telefono: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    // Validar que las contraseñas coincidan
    if (this.password !== this.confirmPassword) {
      Swal.fire("Error", "Las contraseñas no coinciden", "error");
      return;
    }

    // Llamar al servicio de registro
    this.registrarUsuario();
  }

  registrarUsuario() {
    this.authService.registroAdmin(this.nombre, this.apellido, this.telefono, this.email, this.password).subscribe({
      next: (res) => {
        // Limpiar los campos del formulario
        this.nombre = '';
        this.apellido = '';
        this.telefono = '';
        this.email = '';
        this.password = '';
        this.confirmPassword = '';
        
        // Mostrar mensaje de éxito con SweetAlert2
        Swal.fire({
          icon: 'success',
          title: '¡Registro exitoso!',
          text: 'Ahora puedes iniciar sesión con tus credenciales.',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#3085d6'
        }).then((result) => {
          if (result.isConfirmed) {
            this.router.navigate(['/login']);
          }
        });
      },
      error: (err) => {
        console.error('Error en el registro:', err);
        
        // Mostrar mensaje de error con SweetAlert2
        Swal.fire({
          icon: 'error',
          title: 'Error en el registro',
          text: err.error?.message || 'Ha ocurrido un error. Intente nuevamente.',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#d33'
        });
      }
    });
  }
}
