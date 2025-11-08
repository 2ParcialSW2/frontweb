import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.obtenerToken();

  // Excluir Cloudinary (no modificar sus headers)
  const isCloudinary = req.url.includes('api.cloudinary.com');

  // Endpoints públicos que no requieren token
  const publicEndpoints = [
    'auth/login',
    'auth/register'
  ];

  // Verificar si es una petición GraphQL
  const isGraphQL = req.url.includes('/graphql');

  // Para Cloudinary, no modificar la petición
  if (isCloudinary) {
    return next(req);
  }

  // Determinar si el endpoint es público
  const isPublic = publicEndpoints.some(url => req.url.includes(url));

  // Para GraphQL y otros endpoints, agregar token si está disponible
  // GraphQL puede funcionar sin token para queries públicas, pero necesita token para operaciones protegidas
  const authReq = isPublic || !token
    ? req
    : req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });

  // Log para debugging (opcional, puede removerse en producción)
  if (isGraphQL) {
    console.log('🔵 [AuthInterceptor] Petición GraphQL:', {
      url: req.url,
      hasToken: !!token,
      isPublic
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Manejar errores de autenticación
      if (error.status === 401 && !isPublic) {
        console.warn('⚠️ [AuthInterceptor] Error 401 - No autorizado');
        
        // Para GraphQL, los errores 401 pueden venir en el body también
        if (isGraphQL && error.error?.errors) {
          const graphqlErrors = error.error.errors;
          const hasAuthError = graphqlErrors.some((err: any) => 
            err.message?.toLowerCase().includes('unauthorized') ||
            err.message?.toLowerCase().includes('authentication') ||
            err.extensions?.code === 'UNAUTHENTICATED'
          );
          
          if (hasAuthError) {
            authService.cerrarSesion();
            router.navigate(['/login']);
          }
        } else {
          // Para REST y otros errores HTTP 401
          authService.cerrarSesion();
          router.navigate(['/login']);
        }
      }

      // Manejar errores del servidor
      if (error.status === 500) {
        console.error('❌ [AuthInterceptor] Error interno del servidor:', error);
      }

      // Para GraphQL, los errores también pueden venir en el body con status 200
      if (isGraphQL && error.status === 200 && error.error?.errors) {
        console.error('❌ [AuthInterceptor] Errores GraphQL en respuesta:', error.error.errors);
      }

      return throwError(() => error);
    })
  );
};
