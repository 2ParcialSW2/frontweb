import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router); const token = authService.obtenerToken();

  // Excluir Cloudinary y Login
  const isCloudinary = req.url.includes('api.cloudinary.com');

  // Endpoints que no deben llevar token
  const publicEndpoints = [
    'auth/login',
    'auth/register'
  ];

  if (isCloudinary) {
    return next(req); // no modificar
  }

  const isPublic = publicEndpoints.some(url => req.url.includes(url));
  const authReq = isPublic || !token
    ? req
    : req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Manejar errores de autenticación
      if (error.status === 401 && !isPublic) {
        authService.cerrarSesion();
        router.navigate(['/login']);
      }

      // Manejar errores del servidor
      if (error.status === 500) {
        console.error('Error interno del servidor:', error);
      }

      return throwError(() => error);
    })
  );
};
