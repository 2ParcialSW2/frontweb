import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../enviroment';

export interface StripeResponse {
  success: boolean;
  url?: string;
  sessionId?: string;
  error?: string;
  message?: string;
}

export interface StripeCheckoutRequest {
  orderId: number;
  amount: number;
  currency: string;
  customerEmail: string;
  description?: string;
  returnUrl: string; // ← CLAVE: URL del frontend para URLs dinámicas
}

export interface StripeConfirmResponse {
  success: boolean;
  order_id?: number;
  payment_amount?: number;
  status: string;
  payment_status?: string;
  error?: string;
}

export interface StripeVerifyResponse {
  success: boolean;
  is_paid: boolean;
  payment_status: string;
  order_id?: number;
  amount?: number;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  private apiUrl: string;
  constructor(private http: HttpClient) {
    // Asegurar que no haya doble barra en la URL
    const baseUrl = environment.apiUrl.endsWith('/') ? environment.apiUrl.slice(0, -1) : environment.apiUrl;
    this.apiUrl = `${baseUrl}/api/stripe`;
  }

  get baseApiUrl(): string {
    return this.apiUrl;
  }

  // Crear sesión de checkout de Stripe
  crearCheckoutSession(checkoutData: StripeCheckoutRequest): Observable<StripeResponse> {
    return this.http.post<StripeResponse>(`${this.apiUrl}/create-checkout-session`, checkoutData);
  }  // Verificar estado de pago en Stripe
  verificarPago(sessionId: string): Observable<StripeVerifyResponse> {
    const url = `${this.apiUrl}/verify-payment/${sessionId}`;
    console.log('🔍 Llamando verificarPago:', url);
    return this.http.get<StripeVerifyResponse>(url);
  }

  // Confirmar pago de Stripe (actualizado según documentación)
  confirmarPago(sessionId: string, orderId?: string): Observable<StripeConfirmResponse> {
    const url = `${this.apiUrl}/confirm-payment`;
    const body = { sessionId, orderId };
    console.log('✅ Llamando confirmarPago:', { url, body });
    return this.http.post<StripeConfirmResponse>(url, body);
  }

  // Obtener configuración pública de Stripe
  obtenerConfiguracion(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/config`);
  }
}
