import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  styleUrls: ['./login.component.css'],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  email: string = '';
  password: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.authService.login(this.email, this.password).subscribe({      next: (res) => {
        this.authService.guardarToken(res.token);
        this.authService.guardarDatosUsuario(res.nombre, res.email, res.id);

        // Alerta de éxito con SweetAlert2
        Swal.fire({
          icon: 'success',
          title: '¡Bienvenido!',
          text: 'Inicio de sesión exitoso',
          timer: 1500,
          timerProgressBar: true,
          showConfirmButton: false
        }).then(() => {
          this.router.navigate(['/usuario']);
        });
      },
      error: (err) => {
        console.error('Error de login:', err);

        // Alerta de error con SweetAlert2
        Swal.fire({
          icon: 'error',
          title: 'Error de autenticación',
          text: 'Credenciales inválidas. Por favor, verifica tu email y contraseña.',
          confirmButtonText: 'Intentar de nuevo',
          confirmButtonColor: '#d33'
        });
      }
    });
  }
}
