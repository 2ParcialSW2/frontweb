import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PedidoService } from '../../services/pedido.service';
import { DetallePedidoService } from '../../services/detalle-pedido.service';
import { MetodoPagoService } from '../../services/metodo-pago.service';
import { ProductoService } from '../../services/producto.service';
import { AuthService } from '../../services/auth.service';
import { StripeService, StripeCheckoutRequest, StripeConfirmResponse, StripeResponse } from '../../services/stripe.service';
import { Pedido, PedidoDTO, DetallePedido, DetallePedidoDTO, MetodoPago } from '../../models/pedido.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './pedidos.component.html',
  styleUrls: ['./pedidos.component.css']
})
export class PedidosComponent implements OnInit {
  pedidos: Pedido[] = [];
  metodosPago: MetodoPago[] = [];
  productos: any[] = [];
  mostrarFormulario = false;
  modoEdicion = false;
  pedidoForm: FormGroup;
  pedidoEditando: Pedido | null = null;  cargando = false;
  mostrarDetalle = false;
  pedidoDetalle: Pedido | null = null;// Filtros
  filtroEstado: string = 'todos';
  terminoBusqueda: string = '';
  pedidosFiltrados: Pedido[] = [];

  // Tipo de cambio USD a BOB (Bolivianos bolivianos)
  tipoCambioUSDaBOB: number = 6.94; // Actualizable según el tipo de cambio actual
  constructor(
    private pedidoService: PedidoService,
    private detallePedidoService: DetallePedidoService,
    private metodoPagoService: MetodoPagoService,
    private productoService: ProductoService,
    private authService: AuthService,
    private stripeService: StripeService,
    private formBuilder: FormBuilder,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    this.pedidoForm = this.formBuilder.group({
      fecha: ['', [Validators.required]],      descripcion: [''],
      importe_total: [0, [Validators.required, Validators.min(0)]],
      importe_total_desc: [0, [Validators.min(0)]],
      estado: [true],
      metodo_pago_id: ['', [Validators.required]],
      detalle_pedidos: this.formBuilder.array([])
    });
  }  ngOnInit(): void {
    console.log('🚀 Iniciando componente de pedidos');
    console.log('🔗 URL completa actual:', window.location.href);
    console.log('🔗 Search params:', window.location.search);
    console.log('🔗 Hash:', window.location.hash);
    console.log('🔗 Pathname:', window.location.pathname);

    // También verificar con ActivatedRoute
    this.activatedRoute.queryParams.subscribe(params => {
      console.log('🅰️ Angular Route Query Params:', params);
    });

    // ✅ Verificar retorno de Stripe según documentación  
    this.verificarRetornoDePago();

    this.cargarDatos();
  }// ✅ Manejo de retorno de Stripe según documentación
  verificarRetornoDePago(): void {
    console.log('🔍 Iniciando verificación de retorno de pago...');
    
    // Verificar si hay parámetros de pago en la URL
    const fullUrl = window.location.href;
    const search = window.location.search;
    
    console.log('📋 URL Analysis:', {
      fullUrl: fullUrl,
      search: search,
      includes_payment: fullUrl.includes('payment='),
      includes_session_id: fullUrl.includes('session_id='),
      includes_order_id: fullUrl.includes('order_id='),
      includes_pedido_id: fullUrl.includes('pedido_id=')
    });

    // Método más robusto para detectar parámetros
    const params = new URLSearchParams(search);
    const paymentStatus = params.get('payment');
    const sessionId = params.get('session_id');
    const orderId = params.get('order_id') || params.get('pedido_id');

    // También intentar parsing manual como backup
    const manualPayment = this.extractParamFromUrl(fullUrl, 'payment');
    const manualSessionId = this.extractParamFromUrl(fullUrl, 'session_id');
    const manualOrderId = this.extractParamFromUrl(fullUrl, 'order_id') || this.extractParamFromUrl(fullUrl, 'pedido_id');

    console.log('🔍 Parámetros detectados (URLSearchParams):', { 
      paymentStatus, 
      sessionId, 
      orderId
    });

    console.log('🔍 Parámetros detectados (parsing manual):', { 
      manualPayment, 
      manualSessionId, 
      manualOrderId
    });

    // Usar los valores que encontremos (preferir URLSearchParams, fallback a manual)
    const finalPaymentStatus = paymentStatus || manualPayment;
    const finalSessionId = sessionId || manualSessionId;
    const finalOrderId = orderId || manualOrderId;

    console.log('🎯 Parámetros finales a usar:', {
      finalPaymentStatus,
      finalSessionId,
      finalOrderId
    });

    if (finalPaymentStatus && finalSessionId) {
      console.log('✅ Detectado retorno de Stripe:', { 
        paymentStatus: finalPaymentStatus, 
        sessionId: finalSessionId, 
        orderId: finalOrderId 
      });

      if (finalPaymentStatus === 'success') {
        // ✅ Pago exitoso - confirmar automáticamente
        this.confirmarPagoExitoso(finalSessionId, finalOrderId);
      } else if (finalPaymentStatus === 'cancelled') {
        // ❌ Pago cancelado
        this.mostrarMensajeCancelacion(finalOrderId);
      }

      // Limpiar parámetros de la URL para que no se procese de nuevo
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    } else {
      console.log('ℹ️ No se detectaron parámetros de pago en la URL');
      console.log('📝 Esto es normal si no vienes de un pago de Stripe');
    }
  }

  // Helper method para extraer parámetros manualmente
  private extractParamFromUrl(url: string, paramName: string): string | null {
    const regex = new RegExp(`[?&]${paramName}=([^&#]*)`);
    const match = url.match(regex);
    return match ? decodeURIComponent(match[1]) : null;
  }
  // ✅ Confirmar pago exitoso según documentación
  async confirmarPagoExitoso(sessionId: string, orderId: string | null): Promise<void> {
    console.log('🔄 Iniciando confirmación de pago exitoso...', { sessionId, orderId });
    this.cargando = true;

    try {
      console.log('� Llamando a verificarPago con sessionId:', sessionId);

      // Paso 1: Verificar que el pago realmente fue exitoso en Stripe
      this.stripeService.verificarPago(sessionId).subscribe({
        next: (verifyResult) => {
          console.log('📊 Resultado verificación completo:', JSON.stringify(verifyResult, null, 2));

          if (verifyResult.success && verifyResult.is_paid) {
            console.log('✅ Pago verificado como exitoso, procediendo a confirmar...');
            
            const orderIdToUse = orderId || verifyResult.order_id?.toString();
            console.log('📝 Order ID a usar para confirmación:', orderIdToUse);

            // Paso 2: Confirmar el pago en el backend y actualizar el pedido
            this.stripeService.confirmarPago(sessionId, orderIdToUse).subscribe({
              next: (confirmResult) => {
                console.log('✅ Resultado confirmación completo:', JSON.stringify(confirmResult, null, 2));

                if (confirmResult.success) {
                  console.log('🎉 Pago confirmado exitosamente, actualizando UI...');
                  
                  // Mostrar mensaje de éxito
                  Swal.fire({
                    title: '🎉 ¡Pago Exitoso!',
                    html: `
                      <div style="font-size: 16px;">
                        <p><strong>Su pago ha sido procesado exitosamente</strong></p>
                        <p>Pedido #${confirmResult.order_id}</p>
                        <p>Monto: $${confirmResult.payment_amount} USD</p>
                        <p>Estado: <span style="color: green; font-weight: bold;">PAGADO</span></p>
                      </div>
                    `,
                    icon: 'success',
                    confirmButtonText: 'Continuar',
                    confirmButtonColor: '#28a745'
                  });

                  // Limpiar localStorage
                  localStorage.removeItem('pending_payment');
                  console.log('🧹 localStorage limpiado');

                  // Recargar la lista de pedidos para mostrar el estado actualizado
                  console.log('🔄 Recargando lista de pedidos...');
                  this.cargarPedidos().then(() => {
                    console.log('✅ Lista de pedidos recargada exitosamente');
                    this.cargando = false;
                  }).catch((error) => {
                    console.error('❌ Error recargando pedidos:', error);
                    this.cargando = false;
                  });
                } else {
                  console.error('❌ Error en confirmación:', confirmResult.error);
                  throw new Error(confirmResult.error || 'Error confirmando pago en el backend');
                }
              },
              error: (error) => {
                console.error('❌ Error en llamada de confirmación:', error);
                this.manejarErrorConfirmacion(error);
              }
            });
          } else {
            console.error('❌ El pago no fue completado:', { 
              success: verifyResult.success, 
              is_paid: verifyResult.is_paid,
              payment_status: verifyResult.payment_status 
            });
            throw new Error('El pago no fue completado exitosamente en Stripe');
          }
        },
        error: (error) => {
          console.error('❌ Error en llamada de verificación:', error);
          this.manejarErrorConfirmacion(error);
        }
      });

    } catch (error) {
      console.error('❌ Error general en confirmarPagoExitoso:', error);
      this.manejarErrorConfirmacion(error);
    }
  }
  // ✅ Manejar errores de confirmación
  private manejarErrorConfirmacion(error: any): void {
    console.error('❌ Error confirmando pago (detallado):', {
      error: error,
      message: error.message,
      status: error.status,
      statusText: error.statusText,
      errorBody: error.error,
      url: error.url
    });
    
    this.cargando = false;
    
    let errorMessage = 'Error confirmando pago';
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.status === 404) {
      errorMessage = 'Endpoint no encontrado. Verifique que el backend esté ejecutándose.';
    } else if (error.status === 500) {
      errorMessage = 'Error interno del servidor. Verifique los logs del backend.';
    }
    
    Swal.fire({
      title: 'Error confirmando pago',
      html: `
        <p><strong>Error:</strong> ${errorMessage}</p>
        <p><small>Por favor, verifica el estado de tu pedido o contacta soporte.</small></p>
        <details style="margin-top: 10px;">
          <summary>Detalles técnicos</summary>
          <pre style="text-align: left; font-size: 12px;">${JSON.stringify(error, null, 2)}</pre>
        </details>
      `,
      icon: 'error',
      confirmButtonText: 'Entendido'
    });
  }

  // ✅ Mostrar mensaje de cancelación
  private mostrarMensajeCancelacion(orderId: string | null): void {
    Swal.fire({
      title: '❌ Pago Cancelado',
      html: `
        <p>El pago para el pedido #${orderId || 'N/A'} fue cancelado.</p>
        <p>Puedes intentar pagar nuevamente cuando gustes.</p>
      `,
      icon: 'info',
      confirmButtonText: 'Entendido'
    });
  }

  get detallesPedidos(): FormArray {
    return this.pedidoForm.get('detalle_pedidos') as FormArray;
  }

  cargarDatos(): void {
    this.cargando = true;
    Promise.all([
      this.cargarPedidos(),
      this.cargarMetodosPago(),
      this.cargarProductos()
    ]).finally(() => {
      this.cargando = false;
    });
  }  cargarPedidos(): Promise<void> {
    return new Promise((resolve) => {
      this.pedidoService.listarPedidos().subscribe({
        next: (response) => {
          this.pedidos = response.data;

          // ✅ Debug logging para verificar los métodos de pago
          console.log('📦 Pedidos cargados desde backend:', this.pedidos.length);
          this.pedidos.forEach((pedido, index) => {
            if (index < 3) { // Solo mostrar los primeros 3 para no sobrecargar el log
              console.log(`📦 Pedido #${pedido.id}:`, {
                id: pedido.id,
                estado: pedido.estado,
                metodo_pago: pedido.metodo_pago,
                metodo_pago_nombre: pedido.metodo_pago_nombre,
                metodoPago: pedido.metodoPago,
                importe_total: pedido.importe_total
              });
            }
          });

          this.filtrarPedidos(); // Aplicar filtros después de cargar
          resolve();
        },
        error: (error) => {
          console.error('Error al cargar pedidos:', error);
          Swal.fire('Error', 'No se pudieron cargar los pedidos', 'error');
          resolve();
        }
      });
    });
  }
  cargarMetodosPago(): Promise<void> {
    return new Promise((resolve) => {
      this.metodoPagoService.listarMetodosPago().subscribe({        next: (response) => {
          this.metodosPago = response.data;
          console.log('✅ Métodos de pago cargados:', this.metodosPago);
          // this.verificarMetodosPagoStripe(); // Función comentada temporalmente
          resolve();
        },
        error: (error) => {
          console.error('Error al cargar métodos de pago:', error);
          resolve();
        }
      });
    });
  }
  cargarProductos(): Promise<void> {
    return new Promise((resolve) => {
      this.productoService.getProductos().subscribe({
        next: (response: any) => {
          this.productos = response.data || response;
          resolve();
        },
        error: (error: any) => {
          console.error('Error al cargar productos:', error);
          resolve();
        }
      });
    });
  }
  filtrarPedidos(): void {
    let pedidosFiltrados = this.pedidos;

    // Filtrar por estado
    if (this.filtroEstado !== 'todos') {
      const estado = this.filtroEstado === 'activos';
      pedidosFiltrados = pedidosFiltrados.filter(pedido => pedido.estado === estado);
    }

    // Filtrar por término de búsqueda
    if (this.terminoBusqueda.trim()) {
      const termino = this.terminoBusqueda.toLowerCase().trim();
      pedidosFiltrados = pedidosFiltrados.filter(pedido =>
        (pedido.id?.toString() || '').includes(termino) ||
        (pedido.metodo_pago?.nombre?.toLowerCase() || '').includes(termino) ||
        pedido.fecha.includes(termino)
      );
    }

    this.pedidosFiltrados = pedidosFiltrados;
  }
  abrirFormularioCrear(): void {
    // Crear pedido inmediatamente en la base de datos
    this.crearPedidoVacio();
  }

  crearPedidoVacio(): void {
    this.cargando = true;
      const pedidoDTO: PedidoDTO = {
      fecha: new Date().toISOString().split('T')[0],
      descripcion: 'Pedido creado automáticamente',
      importe_total: 0,
      importe_total_desc: 0,
      estado: false, // Pendiente por defecto
      usuario_id: this.authService.obtenerUsuarioId(),
      metodo_pago_id: 1 // Valor por defecto, se puede cambiar después
    };

    this.pedidoService.crearPedido(pedidoDTO).subscribe({
      next: (response) => {
        console.log('Pedido vacío creado:', response);
        if (response.data?.id) {
          // Cargar el pedido recién creado para edición
          this.abrirFormularioEditar(response.data);
          this.modoEdicion = false; // Cambiar a modo creación para el formulario
          this.cargando = false;
        } else {
          this.cargando = false;
          Swal.fire('Error', 'No se pudo crear el pedido correctamente', 'error');
        }
      },
      error: (error) => {
        console.error('Error al crear pedido vacío:', error);
        this.cargando = false;
        Swal.fire('Error', 'No se pudo crear el pedido: ' + (error.error?.message || 'Error desconocido'), 'error');
      }
    });
  }

  abrirFormularioEditar(pedido: Pedido): void {
    this.modoEdicion = true;
    this.mostrarFormulario = true;
    this.pedidoEditando = pedido;      this.pedidoForm.patchValue({
      fecha: pedido.fecha.split('T')[0],
      descripcion: pedido.descripcion || '',
      importe_total: pedido.importe_total,
      importe_total_desc: pedido.importe_total_desc,
      estado: pedido.estado,
      metodo_pago_id: pedido.metodo_pago?.id
    });// Cargar detalles del pedido
    this.detallesPedidos.clear();    if (pedido.detalle_pedidos && pedido.detalle_pedidos.length > 0) {
      pedido.detalle_pedidos.forEach(detalle => {        const detalleFormGroup = this.formBuilder.group({
          id: [detalle.id], // ✅ Incluir el ID del detalle
          cantidad: [detalle.cantidad, [Validators.required, Validators.min(1)]],
          // ✅ CORREGIDO: Usar 'precio_unitario' y 'subtotal' que coinciden con el template
          precio_unitario: [detalle.precioUnitario || detalle.precio_unitario, [Validators.required, Validators.min(0)]],
          subtotal: [detalle.importe_total || detalle.subtotal, [Validators.required, Validators.min(0)]],
          importe_Desc: [detalle.importe_total_desc, [Validators.min(0)]],
          estado: [detalle.estado],
          producto_id: [detalle.producto?.id, [Validators.required]]
        });// ✅ Agregar listeners para cálculos automáticos también en detalles existentes
        detalleFormGroup.get('cantidad')?.valueChanges.subscribe(() => this.calcularImporte(detalleFormGroup));
        // ✅ CORREGIDO: Usar 'precio_unitario' que coincide con el template
        detalleFormGroup.get('precio_unitario')?.valueChanges.subscribe(() => this.calcularImporte(detalleFormGroup));

        // ✅ Escuchar cambios en producto_id para auto-poblar precio
        detalleFormGroup.get('producto_id')?.valueChanges.subscribe((productoId) => {
          if (productoId) {
            this.autoLlenarPrecioProducto(detalleFormGroup, parseInt(productoId.toString()));
          }
        });

        this.detallesPedidos.push(detalleFormGroup);
      });
    } else {
      this.agregarDetalle();
    }
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.modoEdicion = false;
    this.pedidoForm.reset();
    this.pedidoEditando = null;
    this.detallesPedidos.clear();
  }  agregarDetalle(): void {
    const detalle = this.formBuilder.group({
      cantidad: [1, [Validators.required, Validators.min(1)]],
      precio_unitario: [0, [Validators.required, Validators.min(0)]],
      subtotal: [0], // Solo subtotal, sin campos de descuento innecesarios
      estado: [true],
      producto_id: ['', [Validators.required]]
    });

    // Escuchar cambios en cantidad y precio para calcular subtotal
    detalle.get('cantidad')?.valueChanges.subscribe(() => this.calcularImporte(detalle));
    detalle.get('precio_unitario')?.valueChanges.subscribe(() => this.calcularImporte(detalle));

    // Escuchar cambios en producto_id para auto-poblar precio
    detalle.get('producto_id')?.valueChanges.subscribe((productoId) => {
      if (productoId) {
        this.autoLlenarPrecioProducto(detalle, parseInt(productoId.toString()));
      }
    });

    this.detallesPedidos.push(detalle);
  }// Método auxiliar para el template
  agregarDetalleAlBackendFromIndex(index: number): void {
    const detalleControl = this.detallesPedidos.at(index) as FormGroup;
    this.agregarDetalleAlBackend(detalleControl);
  }  // Nuevo método para agregar detalle directamente al backend
  agregarDetalleAlBackend(detalleForm: FormGroup): void {
    if (!this.pedidoEditando?.id) {
      Swal.fire('Error', 'Debe tener un pedido activo para agregar detalles', 'warning');
      return;
    }

    if (!detalleForm.valid) {
      Swal.fire('Error', 'Por favor complete todos los campos del detalle', 'warning');
      return;
    }

    const detalleValue = detalleForm.value;
    console.log('🔍 Valores del formulario de detalle:', detalleValue);

    // 🔍 Validar datos antes de enviar
    if (!detalleValue.producto_id || detalleValue.producto_id <= 0) {
      Swal.fire('Error', 'Debe seleccionar un producto válido', 'warning');
      return;
    }

    if (!detalleValue.cantidad || detalleValue.cantidad <= 0) {
      Swal.fire('Error', 'La cantidad debe ser mayor a 0', 'warning');
      return;
    }

    // 🔍 Obtener precio correcto desde el formulario
    const precio = Number(detalleValue.precio) || 0;
    const cantidad = Number(detalleValue.cantidad) || 0;
    const importe = cantidad * precio;    // 🔧 Asegurar que los tipos de datos sean correctos
    const detalleDTO: DetallePedidoDTO = {
      cantidad: cantidad,
      subtotal: importe,
      importe_Total: importe,
      importe_Total_Desc: Number(detalleValue.importe_Desc) || 0,
      precio_unitario: precio,
      precioUnitario: precio,
      productoId: Number(detalleValue.producto_id),
      producto_id: Number(detalleValue.producto_id),
      pedidoId: Number(this.pedidoEditando.id),
      pedido_id: Number(this.pedidoEditando.id)
    };

    console.log('🚀 Enviando DTO de detalle al servicio:', detalleDTO);
    console.log('📍 Pedido ID:', this.pedidoEditando.id);
    console.log('📍 Producto ID:', detalleValue.producto_id);
    console.log('📍 Cantidad:', cantidad);
    console.log('📍 Precio:', precio);
    console.log('📍 Importe calculado:', importe);

    this.cargando = true;
    this.detallePedidoService.crearDetalle(detalleDTO).subscribe({
      next: (response) => {
        console.log('✅ Detalle creado - Respuesta completa:', response);
        console.log('✅ Datos del detalle creado:', response.data);
        console.log('✅ Estado de la respuesta:', response.statusCode);

        if (response.statusCode === 200 || response.statusCode === 201) {
          Swal.fire('Éxito', 'Detalle agregado correctamente', 'success');
          // Recargar el pedido para obtener los totales actualizados
          this.recargarPedidoActual();
          this.cargarPedidos(); // Actualizar la lista principal
        } else {
          console.warn('⚠️ Respuesta inesperada del servidor:', response);
          Swal.fire('Advertencia', 'El detalle se procesó pero hubo una respuesta inesperada', 'warning');
        }
        this.cargando = false;
      },
      error: (error) => {
        console.error('❌ Error al crear detalle - Detalle del error:', error);
        console.error('❌ Status:', error.status);
        console.error('❌ Error message:', error.error?.message || 'Sin mensaje');
        console.error('❌ Error details:', error.error);

        this.cargando = false;
        const errorMessage = error.error?.message || error.message || 'Error desconocido';
        Swal.fire('Error', `Error al agregar detalle: ${errorMessage}`, 'error');
      }
    });
  }

  eliminarDetalle(index: number): void {
    const detalleControl = this.detallesPedidos.at(index);
    const detalleId = detalleControl.get('id')?.value;

    if (detalleId && this.pedidoEditando?.id) {
      // Si el detalle ya existe en el backend, eliminarlo de la base de datos
      Swal.fire({
        title: '¿Está seguro?',
        text: 'Este detalle será eliminado permanentemente',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.cargando = true;
          this.detallePedidoService.eliminarDetalle(detalleId).subscribe({
            next: (response) => {
              Swal.fire('Eliminado', 'El detalle ha sido eliminado', 'success');
              this.recargarPedidoActual(); // Recargar datos del backend
              this.cargarPedidos(); // Actualizar lista principal
              this.cargando = false;
            },
            error: (error) => {
              console.error('Error al eliminar detalle:', error);
              this.cargando = false;
              Swal.fire('Error', 'No se pudo eliminar el detalle', 'error');
            }
          });
        }
      });
    } else {
      // Si es un detalle nuevo (sin ID), solo eliminarlo del formulario
      this.detallesPedidos.removeAt(index);
      if (this.detallesPedidos.length === 0) {
        this.agregarDetalle(); // Asegurar que siempre haya al menos una línea
      }
    }
  }  calcularImporte(detalle: FormGroup): void {
    const cantidad = parseFloat(detalle.get('cantidad')?.value) || 0;
    const precio = parseFloat(detalle.get('precio_unitario')?.value) || 0;
    const subtotal = cantidad * precio;

    console.log('🧮 Calculando subtotal:', { cantidad, precio, subtotal });

    // Solo calcular: cantidad × precio = subtotal
    detalle.get('subtotal')?.setValue(subtotal, { emitEvent: false });

    console.log('💰 Subtotal calculado:', subtotal);

    // Recalcular totales del pedido
    this.calcularTotales();
  }  calcularTotales(): void {
    let total = 0;

    this.detallesPedidos.controls.forEach((detalle, index) => {
      const subtotal = parseFloat(detalle.get('subtotal')?.value) || 0;
      total += subtotal;

      console.log(`📊 Detalle ${index + 1}: Subtotal=${subtotal}`);
    });    console.log('💰 Total general calculado:', total);

    // ✅ SOLO actualizar el total - NO tocar el campo de descuento
    this.pedidoForm.get('importe_total')?.setValue(total, { emitEvent: false });

    // ✅ NO modificar importe_total_desc automáticamente - dejar que el usuario lo maneje
    console.log('🎯 Campo descuento NO modificado - valor actual:', this.pedidoForm.get('importe_total_desc')?.value);
  }autoLlenarPrecioProducto(detalle: FormGroup, productoId: number): void {
    console.log('🔍 Buscando precio para producto ID:', productoId);
    console.log('📦 Productos disponibles:', this.productos);

    const producto = this.productos.find(p => p.id === parseInt(productoId.toString()));
    console.log('🎯 Producto encontrado:', producto);

    if (producto) {
      // Mostrar TODA la estructura del producto para debugging
      console.log('📋 Estructura completa del producto:', JSON.stringify(producto, null, 2));

      // Intentar múltiples nombres de campos para el precio
      let precio = null;
      const camposPrecio = ['precioUnitario', 'precio_unitario', 'precio', 'price', 'importe_total', 'valor', 'costo'];

      for (const campo of camposPrecio) {
        if (producto[campo] !== undefined && producto[campo] !== null) {
          precio = parseFloat(producto[campo]);
          console.log(`💰 Precio encontrado en campo '${campo}': ${precio}`);
          break;
        }
      }
        if (precio && precio > 0) {
        // ✅ CORREGIDO: Usar 'precio_unitario' que coincide con el template
        detalle.get('precio_unitario')?.setValue(precio, { emitEvent: true });
        console.log('✅ Precio asignado al formulario:', precio);
      } else {
        console.log('⚠️ No se encontró precio válido para el producto');
        console.log('🚨 CAMPOS DISPONIBLES EN PRODUCTO:', Object.keys(producto));

        // NO asignar precio por defecto automáticamente
        detalle.get('precio_unitario')?.setValue('', { emitEvent: false });

        Swal.fire({
          title: 'Precio no encontrado',
          text: `El producto "${producto.nombre || producto.name || 'Desconocido'}" no tiene precio asignado. Por favor ingrese el precio manualmente.`,
          icon: 'warning',
          confirmButtonText: 'OK'
        });
      }    } else {
      console.log('❌ Producto no encontrado en la lista');
      // ✅ CORREGIDO: Usar 'precio_unitario' que coincide con el template
      detalle.get('precio_unitario')?.setValue('', { emitEvent: false });
    }
  }guardarPedido(): void {
    console.log('🚀 Iniciando guardado de pedido...');

    // Validar que el formulario principal sea válido
    if (!this.pedidoForm.valid) {
      console.log('❌ Formulario principal inválido:', this.pedidoForm.errors);
      Swal.fire('Error', 'Por favor complete todos los campos requeridos', 'warning');
      return;
    }

    // Validación adicional para metodo_pago_id
    const metodoPagoId = this.pedidoForm.get('metodo_pago_id')?.value;
    if (!metodoPagoId || metodoPagoId === '') {
      Swal.fire('Error', 'Debe seleccionar un método de pago', 'warning');
      return;
    }    // Validar que haya al menos un detalle válido
    const detallesValidos = this.detallesPedidos.controls.filter(detalle => {
      const productoId = detalle.get('producto_id')?.value;
      const cantidad = detalle.get('cantidad')?.value;
      // ✅ CORREGIDO: Usar 'precio_unitario' que coincide con el template
      const precio = detalle.get('precio_unitario')?.value;

      console.log('🔍 Validando detalle:', { productoId, cantidad, precio });
      return productoId && cantidad > 0 && precio > 0;
    });

    console.log('📊 Detalles válidos encontrados:', detallesValidos.length);
    console.log('📋 Total de controles en detallesPedidos:', this.detallesPedidos.controls.length);

    if (detallesValidos.length === 0) {
      Swal.fire('Error', 'Debe agregar al menos un producto al pedido', 'warning');
      return;
    }

    console.log(`✅ Validación pasada. ${detallesValidos.length} detalles válidos encontrados`);

    this.cargando = true;
    const formValue = this.pedidoForm.value;

    const pedidoDTO: PedidoDTO = {
      fecha: formValue.fecha,
      descripcion: formValue.descripcion || 'Pedido creado desde formulario',
      importe_total: formValue.importe_total || 0,
      importe_total_desc: formValue.importe_total_desc || 0,
      estado: formValue.estado || false,
      usuario_id: this.authService.obtenerUsuarioId(),
      metodo_pago_id: parseInt(metodoPagoId) // Asegurar que sea número
    };

    console.log('📦 DTO del pedido preparado:', pedidoDTO);      if (this.pedidoEditando?.id) {
        // Actualizar la información del pedido
        this.pedidoService.actualizarPedido(this.pedidoEditando.id, pedidoDTO).subscribe({
          next: (response) => {
            console.log('✅ Pedido actualizado correctamente');

            // 🔥 NUEVO: Procesar todos los detalles del formulario automáticamente
            this.procesarTodosLosDetalles().then(() => {
              Swal.fire('Éxito', 'Pedido y todos los detalles guardados correctamente', 'success');
              this.cargarPedidos();
              this.cerrarFormulario();
              this.cargando = false;
            }).catch((error) => {
              console.error('Error al procesar detalles:', error);
              Swal.fire('Advertencia', 'El pedido se guardó pero hubo problemas con algunos detalles', 'warning');
              this.cargarPedidos();
              this.cargando = false;
            });
          },
          error: (error) => {
            console.error('Error al actualizar pedido:', error);
            Swal.fire('Error', 'No se pudo actualizar el pedido', 'error');
            this.cargando = false;
          }
        });
      } else {
        // Si no hay pedido editando, significa que algo salió mal
        Swal.fire('Error', 'No hay un pedido activo para guardar', 'error');
        this.cargando = false;
      }
  }

  // 🔥 NUEVO MÉTODO: Procesar todos los detalles del formulario automáticamente
  private async procesarTodosLosDetalles(): Promise<void> {
    console.log('🔄 Iniciando procesamiento automático de todos los detalles...');

    const detallesArray = this.obtenerArrayDetalles();
    if (!detallesArray || detallesArray.length === 0) {
      console.log('⚠️ No hay detalles para procesar');
      return;
    }

    console.log(`📊 Procesando ${detallesArray.length} detalles automáticamente:`);

    const promesas = [];

    for (let i = 0; i < detallesArray.length; i++) {
      const detalle = detallesArray.at(i);

      if (detalle && detalle.value) {
        const detalleValue = detalle.value;

        // Validar que tenga datos mínimos
        if (detalleValue.producto_id && detalleValue.cantidad > 0) {
          console.log(`📝 Procesando detalle ${i + 1}:`, detalleValue);

          const promesa = this.procesarDetalleIndividual(detalleValue, i);
          promesas.push(promesa);
        } else {
          console.log(`⚠️ Detalle ${i + 1} omitido (datos incompletos):`, detalleValue);
        }
      }
    }

    if (promesas.length > 0) {
      try {
        await Promise.all(promesas);
        console.log('✅ Todos los detalles procesados correctamente');
      } catch (error) {
        console.error('❌ Error al procesar algunos detalles:', error);
        throw error;
      }
    } else {
      console.log('⚠️ No se encontraron detalles válidos para procesar');
    }
  }

  private procesarDetalleIndividual(detalleValue: any, index: number): Promise<void> {
    return new Promise((resolve, reject) => {      const detalleFinal = {
        productoId: detalleValue.producto_id,
        producto_id: detalleValue.producto_id,
        pedidoId: this.pedidoEditando!.id!,
        pedido_id: this.pedidoEditando!.id!,
        cantidad: detalleValue.cantidad,
        subtotal: detalleValue.importe || 0,
        importe_Total: detalleValue.importe || 0,
        importe_Total_Desc: detalleValue.importe_Desc || 0,
        precio_unitario: detalleValue.precio || 0,
        precioUnitario: detalleValue.precio || 0
      };

      console.log(`🚀 Enviando detalle ${index + 1} al backend:`, detalleFinal);

      this.detallePedidoService.crearDetalle(detalleFinal).subscribe({
        next: (response) => {
          console.log(`✅ Detalle ${index + 1} guardado exitosamente:`, response);
          resolve();
        },
        error: (error: any) => {
          console.error(`❌ Error al guardar detalle ${index + 1}:`, error);
          reject(error);
        }
      });
    });
  }

  // Método auxiliar para obtener el array de detalles
  private obtenerArrayDetalles(): any[] {
    return this.detallesPedidos.controls;
  }

  crearDetallesPedido(pedidoId: number, detalles: DetallePedidoDTO[]): void {
    let detallesCreados = 0;
    const totalDetalles = detalles.length;

    detalles.forEach((detalle, index) => {
      // Agregar el ID del pedido al detalle
      const detalleConPedido = {
        ...detalle,
        pedidoId: pedidoId
      };      this.detallePedidoService.crearDetalle(detalleConPedido).subscribe({
        next: (detalleResponse: any) => {
          console.log(`Detalle ${index + 1} creado:`, detalleResponse);
          detallesCreados++;

          // Si se han creado todos los detalles
          if (detallesCreados === totalDetalles) {
            this.cargando = false;
            Swal.fire('Éxito', 'Pedido y detalles creados correctamente', 'success');
            this.cargarPedidos();
            this.cerrarFormulario();
          }
        },
        error: (error: any) => {
          console.error(`Error al crear detalle ${index + 1}:`, error);
          this.cargando = false;
          Swal.fire('Error', `Error al crear detalle ${index + 1}: ${error.error?.message || 'Error desconocido'}`, 'error');
        }
      });
    });
  }

  eliminarPedido(pedido: Pedido): void {
    Swal.fire({
      title: '¿Está seguro?',
      text: `¿Desea eliminar el pedido #${pedido.id}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && pedido.id) {
        this.cargando = true;
        this.pedidoService.eliminarPedido(pedido.id).subscribe({
          next: (response) => {
            Swal.fire('Eliminado', 'El pedido ha sido eliminado', 'success');
            this.cargarPedidos();
            this.cargando = false;
          },
          error: (error) => {
            console.error('Error al eliminar pedido:', error);
            Swal.fire('Error', 'No se pudo eliminar el pedido', 'error');
            this.cargando = false;
          }
        });
      }
    });
  }
  verDetalle(pedido: Pedido): void {
    this.pedidoDetalle = pedido;
    this.mostrarDetalle = true;

    // ✅ Cargar los detalles completos desde el backend
    this.cargarDetallesCompletos(pedido.id!);
  }

  cerrarDetalle(): void {
    this.mostrarDetalle = false;
    this.pedidoDetalle = null;
  }
  obtenerNombreProducto(productoId: number | undefined): string {
    if (!productoId) return 'Producto no especificado';

    const producto = this.productos.find(p => p.id === productoId);
    return producto ? producto.nombre : `Producto ID: ${productoId}`;
  }
  obtenerNombreMetodoPago(metodoId: number | undefined): string {
    if (!metodoId) return 'N/A';
    const metodo = this.metodosPago.find(m => m.id === metodoId);
    return metodo ? metodo.nombre : 'Método no encontrado';
  }
  obtenerNombreMetodoPagoPedido(pedido: Pedido): string {
    // Priorizar el campo metodo_pago_nombre que viene directamente del backend
    if (pedido.metodo_pago_nombre) {
      return pedido.metodo_pago_nombre;
    }

    // Segundo: Si existe el objeto metodo_pago con nombre
    if (pedido.metodo_pago?.nombre) {
      return pedido.metodo_pago.nombre;
    }

    // Tercero: Si existe el objeto metodo_pago con id, buscar en la lista local
    if (pedido.metodo_pago?.id) {
      return this.obtenerNombreMetodoPago(pedido.metodo_pago.id);
    }

    // Cuarto: Campo alternativo metodoPago (sin underscore)
    if (pedido.metodoPago) {
      return pedido.metodoPago;
    }

    console.warn('⚠️ No se pudo determinar el método de pago para el pedido:', pedido.id, {
      metodo_pago_nombre: pedido.metodo_pago_nombre,
      metodo_pago: pedido.metodo_pago,
      metodoPago: pedido.metodoPago
    });

    return 'N/A';
  }

  cambiarEstadoPedido(pedido: Pedido): void {
    const nuevoEstado = !pedido.estado;
    const mensajeAccion = nuevoEstado ? 'marcar como pagado' : 'marcar como pendiente';
    const mensajeConfirmacion = nuevoEstado ? 'El pedido será marcado como PAGADO' : 'El pedido será marcado como PENDIENTE';

    Swal.fire({
      title: '¿Está seguro?',
      text: mensajeConfirmacion,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: nuevoEstado ? '#10b981' : '#f59e0b',
      cancelButtonColor: '#6b7280',
      confirmButtonText: `Sí, ${mensajeAccion}`,
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && pedido.id) {        this.cargando = true;

        console.log('🔄 [Pedidos] Cambiando estado del pedido:', pedido.id, 'a:', nuevoEstado);

        // Usar el método específico para cambiar estado en lugar de actualizar todo el pedido
        this.pedidoService.cambiarEstadoPedido(pedido.id, nuevoEstado).subscribe({
          next: (response) => {
            console.log('✅ [Pedidos] Estado del pedido actualizado:', response);

            // ✅ Después de actualizar el pedido, actualizar todos los detalles
            this.actualizarEstadoTodosLosDetalles(pedido.id!, nuevoEstado).then(() => {
              const estadoTexto = nuevoEstado ? 'pagado' : 'pendiente';
              Swal.fire('Éxito', `El pedido y todos sus productos han sido marcados como ${estadoTexto}`, 'success');
              this.cargarPedidos();
              this.cargando = false;
            }).catch((error: any) => {
              console.error('Error al actualizar detalles:', error);
              Swal.fire('Advertencia', 'El pedido se actualizó pero hubo un problema actualizando algunos productos', 'warning');
              this.cargarPedidos();
              this.cargando = false;
            });
          },          error: (error) => {
            console.error('❌ [Pedidos] Error al cambiar estado del pedido:', error);

            // Si el primer método falla, intentar con el método alternativo
            console.log('🔄 [Pedidos] Intentando método alternativo...');
            if (pedido.id) {
              this.pedidoService.cambiarEstadoPedidoConQuery(pedido.id, nuevoEstado).subscribe({
                next: (response) => {
                  console.log('✅ [Pedidos] Estado actualizado con método alternativo:', response);
                  const estadoTexto = nuevoEstado ? 'pagado' : 'pendiente';
                  Swal.fire('Éxito', `El pedido ha sido marcado como ${estadoTexto}`, 'success');
                  this.cargarPedidos();
                  this.cargando = false;
                },
                error: (errorAlternativo) => {
                  console.error('❌ [Pedidos] Error con método alternativo:', errorAlternativo);
                  Swal.fire('Error', 'No se pudo cambiar el estado del pedido. Por favor, verifica que el backend esté funcionando correctamente.', 'error');
                  this.cargando = false;
                }
              });            } else {
              console.error('❌ [Pedidos] ID de pedido no definido');
              Swal.fire('Error', 'Error interno: ID de pedido no válido', 'error');
              this.cargando = false;
            }
          }
        });
      }
    });
  }

  // Método para actualizar el estado de todos los detalles de un pedido
  async actualizarEstadoTodosLosDetalles(pedidoId: number, nuevoEstado: boolean): Promise<void> {
    try {
      // Obtener todos los detalles del pedido
      const responseDetalles = await this.detallePedidoService.obtenerPorPedido(pedidoId).toPromise();

      if (responseDetalles?.data && responseDetalles.data.length > 0) {
        // Actualizar el estado de cada detalle
        const promesasActualizacion = responseDetalles.data.map(detalle => {
          if (detalle.id) {
            return this.detallePedidoService.actualizarDetalleEstado(detalle.id, nuevoEstado).toPromise();
          }
          return Promise.resolve();
        });

        // Esperar a que todas las actualizaciones terminen
        await Promise.all(promesasActualizacion);
        console.log(`Estados de ${responseDetalles.data.length} detalles actualizados correctamente`);
      }
    } catch (error) {
      console.error('Error al actualizar estados de detalles:', error);
      throw error;
    }
  }

  recargarPedidoActual(): void {
    if (this.pedidoEditando?.id) {
      this.pedidoService.obtenerPedido(this.pedidoEditando.id).subscribe({
        next: (response) => {
          this.pedidoEditando = response.data;
          // Actualizar el formulario con los nuevos totales
          this.pedidoForm.patchValue({
            importe_total: this.pedidoEditando.importe_total,
            importe_total_desc: this.pedidoEditando.importe_total_desc
          });
          // Recargar los detalles
          this.cargarDetallesPedido();
        },
        error: (error) => {
          console.error('Error al recargar pedido:', error);
        }
      });
    }
  }  cargarDetallesPedido(): void {
    if (this.pedidoEditando?.id) {
      console.log('Cargando detalles del pedido ID:', this.pedidoEditando.id);
      this.detallePedidoService.obtenerPorPedido(this.pedidoEditando.id).subscribe({
        next: (response) => {
          console.log('Respuesta de detalles del pedido:', response);
          console.log('Cantidad de detalles recibidos:', response.data ? response.data.length : 0);

          this.detallesPedidos.clear();
          if (response.data && response.data.length > 0) {
            console.log('Detalles encontrados, procesando...');
            response.data.forEach(detalle => {
              console.log('Procesando detalle:', detalle);              const detalleFormGroup = this.formBuilder.group({
                id: [detalle.id],
                cantidad: [detalle.cantidad, [Validators.required, Validators.min(1)]],
                // ✅ CORREGIDO: Usar 'precio_unitario' y 'subtotal' que coinciden con el template
                precio_unitario: [detalle.precioUnitario || detalle.precio_unitario, [Validators.required, Validators.min(0)]],
                subtotal: [detalle.importe_total || detalle.subtotal, [Validators.required, Validators.min(0)]],
                importe_Desc: [detalle.importe_total_desc, [Validators.min(0)]],
                estado: [detalle.estado],
                producto_id: [detalle.producto?.id, [Validators.required]]
              });

              // ✅ Agregar listeners para cálculos automáticos              detalleFormGroup.get('cantidad')?.valueChanges.subscribe(() => this.calcularImporte(detalleFormGroup));
              // ✅ CORREGIDO: Usar 'precio_unitario' que coincide con el template
              detalleFormGroup.get('precio_unitario')?.valueChanges.subscribe(() => this.calcularImporte(detalleFormGroup));

              // ✅ Escuchar cambios en producto_id para auto-poblar precio
              detalleFormGroup.get('producto_id')?.valueChanges.subscribe((productoId) => {
                if (productoId) {
                  this.autoLlenarPrecioProducto(detalleFormGroup, parseInt(productoId.toString()));
                }
              });

              this.detallesPedidos.push(detalleFormGroup);
            });
          }
        },
        error: (error) => {
          console.error('Error al cargar detalles del pedido:', error);
        }
      });
    }
  }// Método para cargar detalles completos del pedido para el modal
  cargarDetallesCompletos(pedidoId: number): void {
    this.cargando = true;

    // ✅ Usar el nuevo endpoint que devuelve productos completos
    this.pedidoService.obtenerProductosPedido(pedidoId).subscribe({
      next: (response) => {
        if (response.data && this.pedidoDetalle) {          // ✅ Mapear la nueva estructura de datos del backend
          this.pedidoDetalle.detalle_pedidos = response.data.map(item => ({
            id: item.detalleId,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            precio_unitario: item.precioUnitario,
            importe_total: item.importe_total,
            subtotal: item.importe_total,
            importe_total_desc: item.importe_total_desc,
            estado: item.estado,
            producto: {
              id: item.productoId,
              nombre: item.nombreProducto,
              descripcion: item.descripcionProducto,
              imagen: item.imagenProducto,
              tiempoProduccion: item.tiempoProduccion,
              stockDisponible: item.stockDisponible,
              stockMinimo: item.stockMinimo,
              precioUnitario: item.precioUnitario,
              categoria: item.categoriaId ? {
                id: item.categoriaId,
                nombre: item.nombreCategoria
              } : null
            }
          }));
          console.log('Detalles con productos completos cargados:', this.pedidoDetalle.detalle_pedidos);
        }
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar detalles completos:', error);
        this.cargando = false;

        // ✅ Fallback: si el nuevo endpoint falla, usar el método anterior
        console.log('Intentando con el método anterior...');
        this.detallePedidoService.obtenerPorPedido(pedidoId).subscribe({
          next: (response) => {
            if (response.data && this.pedidoDetalle) {
              // Usar el método anterior con búsqueda manual de productos
              this.pedidoDetalle.detalle_pedidos = response.data.map(detalle => ({
                ...detalle,
                producto: this.buscarProductoPorDetalle(detalle)
              }));
              console.log('Detalles cargados con método fallback:', this.pedidoDetalle.detalle_pedidos);
            }
            this.cargando = false;
          },
          error: (fallbackError) => {
            console.error('Error en método fallback:', fallbackError);
            this.cargando = false;
            Swal.fire('Error', 'No se pudieron cargar los detalles del pedido', 'error');
          }
        });
      }
    });
  }

  // Método auxiliar para buscar producto en la lista local
  private buscarProductoPorDetalle(detalle: any): any {
    // Si el detalle tiene producto_id (como campo separado)
    if (detalle.producto_id) {
      return this.productos.find(p => p.id === detalle.producto_id);
    }

    // Si el detalle tiene la estructura del backend con producto.id
    if (detalle.producto?.id) {
      return this.productos.find(p => p.id === detalle.producto.id);
    }

    // Buscar por ID si viene como campo directo
    const productoId = detalle.productoId || detalle.producto_id;
    if (productoId) {
      return this.productos.find(p => p.id === productoId);
    }    return null;
  }
  // ✅ MÉTODOS PARA CONVERSIÓN DE MONEDAS

  // Convertir USD a Bolivianos bolivianos
  convertirUSDaBOB(montoUSD: number): number {
    return montoUSD * this.tipoCambioUSDaBOB;
  }

  // Formatear precio con ambas monedas
  formatearPrecioConBolivianos(montoUSD: number | undefined): string {
    if (montoUSD === undefined || montoUSD === null) return '$0.00 USD (Bs. 0.00)';
    const montoBOB = this.convertirUSDaBOB(montoUSD);
    return `$${montoUSD.toFixed(2)} USD (Bs. ${montoBOB.toFixed(2)})`;
  }
  // Obtener solo el monto en bolivianos formateado
  obtenerPrecioEnBolivianos(montoUSD: number | undefined): string {
    if (montoUSD === undefined || montoUSD === null) return 'Bs. 0.00';
    const montoBOB = this.convertirUSDaBOB(montoUSD);
    return `Bs. ${montoBOB.toFixed(2)}`;
  }  // ✅ NUEVO: Verificar si hay parámetros de Stripe en la URL
  verificarRetornoDeStripe(): void {
    console.log('🔍 Verificando retorno de Stripe...');
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const pedidoId = urlParams.get('pedido_id');
    const paymentStatus = urlParams.get('payment');
    const token = urlParams.get('token');

    // Solo procesar si hay parámetros relacionados con pagos
    const tieneParametrosPago = paymentStatus || sessionId || pedidoId;

    if (!tieneParametrosPago) {
      console.log('ℹ️ No hay parámetros de pago en la URL. Navegación normal.');
      return;
    }

    console.log('🔍 Parámetros de pago detectados:', {
      url: window.location.href,
      sessionId,
      pedidoId,
      paymentStatus,
      token: token ? 'presente' : 'ausente'
    });

    // ✅ CRÍTICO: Restaurar token INMEDIATAMENTE si está presente
    if (token && !this.authService.obtenerToken()) {
      console.log('🔑 Restaurando token de autenticación desde URL');
      this.authService.guardarToken(token);
      console.log('✅ Token restaurado, verificando:', this.authService.obtenerToken() ? 'OK' : 'FALLO');
    }

    // Procesar el retorno de Stripe
    if (paymentStatus === 'success' && sessionId && pedidoId) {
      console.log('✅ Detectado retorno exitoso de Stripe:', { sessionId, pedidoId });

      // Limpiar la URL INMEDIATAMENTE para evitar loops de procesamiento
      const newUrl = window.location.origin + '/pedidos';
      window.history.replaceState({}, document.title, newUrl);
      console.log('🧹 URL limpiada a:', newUrl);

      // Mostrar mensaje de éxito
      Swal.fire({
        title: '¡Pago Exitoso!',
        text: `Su pago ha sido procesado correctamente para el pedido #${pedidoId}`,
        icon: 'success',
        confirmButtonText: 'Continuar'
      }).then(() => {
        // Recargar datos después de confirmar
        this.cargarPedidos();
      });

      // Confirmar el pago en segundo plano
      this.confirmarPagoStripe(sessionId, parseInt(pedidoId));

    } else if (paymentStatus === 'cancelled' && pedidoId) {
      console.log('❌ Pago cancelado por el usuario:', { pedidoId });

      // Limpiar la URL INMEDIATAMENTE
      const newUrl = window.location.origin + '/pedidos';
      window.history.replaceState({}, document.title, newUrl);
      console.log('🧹 URL limpiada a:', newUrl);

      Swal.fire('Pago Cancelado', 'El proceso de pago fue cancelado. Puede intentar nuevamente cuando guste.', 'info');

    } else if (token && (paymentStatus || sessionId || pedidoId)) {
      // Si hay parámetros de Stripe pero algo no coincide, limpiar URL
      console.log('🧹 Limpiando parámetros de Stripe no válidos');
      const newUrl = window.location.origin + '/pedidos';
      window.history.replaceState({}, document.title, newUrl);
      console.log('🧹 URL limpiada a:', newUrl);
    }

    // ✅ NUEVO: Asegurar que estamos en la ruta correcta después del procesamiento
    if ((paymentStatus || sessionId || pedidoId) && this.router.url !== '/pedidos') {
      console.log('🔄 Forzando navegación a /pedidos desde:', this.router.url);
      this.router.navigate(['/pedidos'], { replaceUrl: true });
    }
  }  // ✅ MEJORADO: Confirmar pago de Stripe y actualizar estado
  confirmarPagoStripe(sessionId: string, pedidoId: number): void {
    console.log('🔍 [Stripe] Iniciando confirmación de pago:', { sessionId, pedidoId });
    this.cargando = true;

    // Intentar confirmar con Stripe, pero no bloquear si falla
    this.stripeService.confirmarPago(sessionId).subscribe({
      next: (response: any) => {
        console.log('✅ [Stripe] Respuesta de confirmación de Stripe:', response);

        // Verificar si el pago fue exitoso
        if (response.status === 'complete' || response.payment_status === 'paid') {
          console.log('💳 [Stripe] Pago confirmado como exitoso por Stripe, actualizando estado del pedido...');
        } else {
          console.log('⚠️ [Stripe] Pago no completado según Stripe, pero actualizando de todas formas...');
        }

        // En ambos casos, actualizar el estado (porque el usuario viene de success)
        this.actualizarEstadoPedidoDespuesPago(pedidoId);
      },
      error: (error: any) => {
        console.error('❌ [Stripe] Error al confirmar pago con Stripe (pero continuando):', error);
        console.log('🔄 [Stripe] El usuario viene de Stripe con éxito, actualizando estado sin confirmación...');
        // Como el usuario viene de payment=success, asumimos que el pago fue exitoso
        this.actualizarEstadoPedidoDespuesPago(pedidoId);
      }
    });
  }  // ✅ ACTUALIZADO: Actualizar estado del pedido después del pago usando el mismo método que funciona en el botón
  actualizarEstadoPedidoDespuesPago(pedidoId: number): void {
    console.log('💳 INICIANDO actualización de estado del pedido a PAGADO (Stripe):', pedidoId);

    // Primero, buscar el ID del método de pago "Stripe"
    const metodoStripe = this.metodosPago.find(m =>
      m.nombre.toLowerCase().includes('stripe') ||
      m.nombre.toLowerCase().includes('tarjeta') ||
      m.nombre.toLowerCase().includes('card')
    );

    console.log('🔍 Método de pago Stripe encontrado:', metodoStripe);

    // Si encontramos un método de pago para Stripe, actualizamos el pedido completo
    if (metodoStripe?.id) {
      this.actualizarPedidoConMetodoStripe(pedidoId, metodoStripe.id);
    } else {
      // Si no hay método Stripe específico, solo cambiar el estado
      console.log('⚠️ No se encontró método de pago específico para Stripe, solo actualizando estado');
      this.cambiarSoloEstadoPedido(pedidoId);
    }
  }

  // Nuevo método para actualizar pedido completo con método de pago Stripe
  private actualizarPedidoConMetodoStripe(pedidoId: number, metodoStripeId: number): void {
    // Buscar el pedido actual
    const pedidoActual = this.pedidos.find(p => p.id === pedidoId);
    if (!pedidoActual) {
      console.error('❌ No se encontró el pedido:', pedidoId);
      this.cambiarSoloEstadoPedido(pedidoId);
      return;
    }

    // Crear DTO para actualizar el pedido completo
    const pedidoDTO: PedidoDTO = {
      fecha: pedidoActual.fecha,
      descripcion: pedidoActual.descripcion || 'Pagado con Stripe',
      importe_total: pedidoActual.importe_total,
      importe_total_desc: pedidoActual.importe_total_desc,
      estado: true, // Marcar como pagado
      usuario_id: this.authService.obtenerUsuarioId(),
      metodo_pago_id: metodoStripeId // ✅ Actualizar método de pago a Stripe
    };

    console.log('🔄 [Stripe] Actualizando pedido completo:', { pedidoId, pedidoDTO });

    this.pedidoService.actualizarPedido(pedidoId, pedidoDTO).subscribe({
      next: (response: any) => {
        console.log('✅ [Stripe] Pedido actualizado exitosamente:', response);
        this.finalizarActualizacionStripe(pedidoId);
      },
      error: (error: any) => {
        console.error('❌ [Stripe] Error al actualizar pedido completo:', error);
        // Fallback: solo cambiar estado
        this.cambiarSoloEstadoPedido(pedidoId);
      }
    });
  }

  // Método de respaldo para solo cambiar el estado
  private cambiarSoloEstadoPedido(pedidoId: number): void {
    this.pedidoService.cambiarEstadoPedido(pedidoId, true).subscribe({
      next: (response: any) => {
        console.log('✅ [Stripe] Estado del pedido actualizado exitosamente:', response);
        this.finalizarActualizacionStripe(pedidoId);
      },
      error: (error: any) => {
        console.error('❌ [Stripe] Error con cambiarEstadoPedido:', error);

        // Si el primer método falla, intentar con el método alternativo
        console.log('🔄 [Stripe] Intentando método alternativo...');
        this.pedidoService.cambiarEstadoPedidoConQuery(pedidoId, true).subscribe({
          next: (response: any) => {
            console.log('✅ [Stripe] Estado actualizado con método alternativo:', response);
            this.finalizarActualizacionStripe(pedidoId);
          },
          error: (errorAlternativo: any) => {
            console.error('❌ [Stripe] Error con método alternativo:', errorAlternativo);
            this.mostrarErrorActualizacion(pedidoId);
          }
        });
      }
    });
  }

  // Finalizar la actualización después del pago con Stripe
  private finalizarActualizacionStripe(pedidoId: number): void {
    // Actualizar todos los detalles del pedido
    this.actualizarEstadoTodosLosDetalles(pedidoId, true).then(() => {
      console.log('✅ [Stripe] Pedido y productos marcados como pagados');
      this.mostrarConfirmacionPago(pedidoId);
      this.cargarPedidos(); // Recargar pedidos para mostrar cambios
      this.cargando = false;
    }).catch((error: any) => {
      console.error('⚠️ [Stripe] Error al actualizar detalles:', error);
      // El pedido se actualizó, solo hubo problema con los detalles
      this.mostrarConfirmacionPago(pedidoId);
      this.cargarPedidos(); // Recargar pedidos para mostrar cambios
      this.cargando = false;
    });
  }

  // Mostrar error de actualización
  private mostrarErrorActualizacion(pedidoId: number): void {
    Swal.fire({
      title: 'Pago Exitoso',
      html: `
        <p>Su pago fue procesado correctamente en Stripe.</p>
        <p>Sin embargo, hubo un problema técnico actualizando el estado del pedido.</p>
        <p>Por favor, contacte a soporte técnico mencionando el pedido #${pedidoId}</p>
      `,
      icon: 'warning',
      confirmButtonText: 'Entendido'
    });
    this.cargando = false;
  }
  // Método para mostrar confirmación
  private mostrarConfirmacionPago(pedidoId: number): void {
    console.log('🎉 Mostrando confirmación de pago exitoso para pedido:', pedidoId);
    Swal.fire({
      title: '🎉 ¡Pago Confirmado!',
      html: `<div style="font-size: 16px;">
        <p><strong>Su pago ha sido procesado exitosamente</strong></p>
        <p>Pedido #${pedidoId} ahora está marcado como <span style="color: green; font-weight: bold;">PAGADO</span></p>
        <p>¡Gracias por su compra!</p>
      </div>`,      icon: 'success',
      confirmButtonText: 'Continuar',
      confirmButtonColor: '#28a745',
      timer: 5000,
      timerProgressBar: true,
      allowOutsideClick: false
    });
  }

  // ✅ MÉTODO PARA PROCESAR PAGO CON STRIPE
  pagarConStripe(pedido: Pedido): void {
    if (!pedido.id) {
      Swal.fire('Error', 'ID de pedido no válido', 'error');
      return;
    }

    if (!pedido.importe_total || pedido.importe_total <= 0) {
      Swal.fire('Error', 'El monto del pedido debe ser mayor a 0', 'error');
      return;
    }

    this.cargando = true;

    // ✅ CLAVE: Detectar automáticamente la URL actual del frontend
    const frontendUrl = window.location.origin; // http://localhost:4200 (o el puerto que sea)

    // Obtener email del usuario
    const userEmail = this.authService.obtenerEmail();    // ✅ ENVIAR MONTO TAL COMO ESTÁ - El backend manejará la conversión a centavos
    const amount = pedido.importe_total;

    const paymentRequest: StripeCheckoutRequest = {
      amount: amount, // El backend convertirá a centavos para Stripe
      currency: 'usd',
      orderId: pedido.id,
      customerEmail: userEmail || 'cliente@email.com',
      description: `Pedido #${pedido.id}`,
      returnUrl: frontendUrl // ← ESTO ES LO IMPORTANTE para URLs dinámicas
    };    console.log('🔗 Frontend URL detectada:', frontendUrl);
    console.log('💳 Creando sesión de pago para pedido:', pedido.id);
    console.log('💰 Monto enviado al backend:', amount, '(el backend convertirá a centavos)');
    console.log('🚀 Request completo:', paymentRequest);

    this.stripeService.crearCheckoutSession(paymentRequest).subscribe({
      next: (response: StripeResponse) => {
        console.log('✅ Sesión de Stripe creada:', response);

        if (response.success && response.url) {
          console.log('✅ Sesión creada, redirigiendo a Stripe...');

          // Guardar info para cuando regrese del pago
          localStorage.setItem('pending_payment', JSON.stringify({
            pedidoId: pedido.id,
            amount: pedido.importe_total,
            timestamp: Date.now()
          }));

          // Redirigir a Stripe Checkout
          window.location.href = response.url;
        } else {
          this.cargando = false;
          const errorMessage = response.error || response.message || 'No se pudo crear la sesión de pago';
          Swal.fire('Error', errorMessage, 'error');
        }
      },
      error: (error: any) => {
        console.error('❌ Error al crear sesión de Stripe:', error);
        this.cargando = false;

        let errorMessage = 'Error al procesar el pago';
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        } else if (error.status === 400) {
          errorMessage = 'Datos de pago inválidos. Verifique el pedido y vuelva a intentar.';
        }

        Swal.fire('Error de Pago', errorMessage, 'error');
      }
    });
  }

  // TrackBy function para mejorar el rendimiento en *ngFor de detalles
  trackByDetalleId(index: number, detalle: any): any {
    return detalle.id || index;
  }
}
