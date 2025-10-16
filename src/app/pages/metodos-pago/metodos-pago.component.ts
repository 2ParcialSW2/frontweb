import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MetodoPagoService } from '../../services/metodo-pago.service';
import { MetodoPago, MetodoPagoDTO } from '../../models/pedido.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-metodos-pago',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './metodos-pago.component.html',
  styleUrls: ['./metodos-pago.component.css']
})
export class MetodosPagoComponent implements OnInit {
  metodosPago: MetodoPago[] = [];
  mostrarFormulario = false;
  modoEdicion = false;
  metodoPagoForm: FormGroup;
  metodoPagoEditando: MetodoPago | null = null;
  cargando = false;

  constructor(
    private metodoPagoService: MetodoPagoService,
    private formBuilder: FormBuilder
  ) {
    this.metodoPagoForm = this.formBuilder.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      descripcion: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  ngOnInit(): void {
    this.cargarMetodosPago();
  }

  cargarMetodosPago(): void {
    this.cargando = true;
    this.metodoPagoService.listarMetodosPago().subscribe({
      next: (response) => {
        this.metodosPago = response.data;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar métodos de pago:', error);
        Swal.fire('Error', 'No se pudieron cargar los métodos de pago', 'error');
        this.cargando = false;
      }
    });
  }

  abrirFormularioCrear(): void {
    this.modoEdicion = false;
    this.mostrarFormulario = true;
    this.metodoPagoForm.reset();
    this.metodoPagoEditando = null;
  }

  abrirFormularioEditar(metodoPago: MetodoPago): void {
    this.modoEdicion = true;
    this.mostrarFormulario = true;
    this.metodoPagoEditando = metodoPago;
    this.metodoPagoForm.patchValue({
      nombre: metodoPago.nombre,
      descripcion: metodoPago.descripcion
    });
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.modoEdicion = false;
    this.metodoPagoForm.reset();
    this.metodoPagoEditando = null;
  }

  guardarMetodoPago(): void {
    if (this.metodoPagoForm.valid) {
      this.cargando = true;
      const metodoPagoDTO: MetodoPagoDTO = this.metodoPagoForm.value;

      if (this.modoEdicion && this.metodoPagoEditando?.id) {
        this.metodoPagoService.actualizarMetodoPago(this.metodoPagoEditando.id, metodoPagoDTO).subscribe({
          next: (response) => {
            Swal.fire('Éxito', response.message, 'success');
            this.cargarMetodosPago();
            this.cerrarFormulario();
            this.cargando = false;
          },
          error: (error) => {
            console.error('Error al actualizar método de pago:', error);
            Swal.fire('Error', 'No se pudo actualizar el método de pago', 'error');
            this.cargando = false;
          }
        });
      } else {
        this.metodoPagoService.crearMetodoPago(metodoPagoDTO).subscribe({
          next: (response) => {
            Swal.fire('Éxito', response.message, 'success');
            this.cargarMetodosPago();
            this.cerrarFormulario();
            this.cargando = false;
          },
          error: (error) => {
            console.error('Error al crear método de pago:', error);
            Swal.fire('Error', 'No se pudo crear el método de pago', 'error');
            this.cargando = false;
          }
        });
      }
    } else {
      Swal.fire('Error', 'Por favor, complete todos los campos requeridos', 'warning');
    }
  }

  eliminarMetodoPago(metodoPago: MetodoPago): void {
    Swal.fire({
      title: '¿Está seguro?',
      text: `¿Desea eliminar el método de pago "${metodoPago.nombre}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && metodoPago.id) {
        this.cargando = true;
        this.metodoPagoService.eliminarMetodoPago(metodoPago.id).subscribe({
          next: (response) => {
            Swal.fire('Eliminado', 'El método de pago ha sido eliminado', 'success');
            this.cargarMetodosPago();
            this.cargando = false;
          },
          error: (error) => {
            console.error('Error al eliminar método de pago:', error);
            Swal.fire('Error', 'No se pudo eliminar el método de pago', 'error');
            this.cargando = false;
          }
        });
      }
    });
  }
}
