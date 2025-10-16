import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { PrePlanoService } from '../../services/pre-plano.service';
import { MaterialesService } from '../../services/materiales.service';
import { PreProductoService } from '../../services/pre-producto.service';

@Component({
  selector: 'app-preplanos',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './pre-plano.component.html',
  styleUrl: './pre-plano.component.css'
})
export class PrePlanoComponent implements OnInit {
  prePlanos: any[] = [];
  prePlanosFiltrados: any[] = [];
  materiales: any[] = [];
  preProductos: any[] = [];
  filtro: string = '';

  nuevoPrePlano: any = {
    cantidad: null,
    descripcion: '',
    tiempo_estimado: '',
    material: null,
    preProducto: null
  };

  prePlanoUpdate: any = {
    id: null,
    cantidad: null,
    descripcion: '',
    tiempo_estimado: '',
    material: null,
    preProducto: null
  };

  isModalRegisterOpen: boolean = false;
  isModalUpdateOpen: boolean = false;

  constructor(
    private prePlanoService: PrePlanoService,
    private materialService: MaterialesService,
    private preProductoService: PreProductoService
  ) {}

  ngOnInit(): void {
    this.getPrePlanos();
    this.getMateriales();
    this.getPreProductos();
  }

  getPrePlanos(): void {
    Swal.fire({ title: 'Cargando pre-planos...', didOpen: () => Swal.showLoading(), allowOutsideClick: false });
    this.prePlanoService.getPrePlanos().subscribe({
      next: (data) => {
        this.prePlanos = data;
        this.prePlanosFiltrados = data;
        Swal.close();
      },
      error: (error) => {
        console.error('Error al obtener pre-planos', error);
        Swal.close();
      }
    });
  }

  getMateriales(): void {
    this.materialService.getMateriales().subscribe({
      next: (data) => this.materiales = data,
      error: (error) => console.error('Error al obtener materiales', error)
    });
  }

  getPreProductos(): void {
    this.preProductoService.obtenerTodos().subscribe({
      next: (data) => this.preProductos = data,
      error: (error) => console.error('Error al obtener pre-productos', error)
    });
  }

  buscarPrePlanos(): void {
    const termino = this.filtro.trim().toLowerCase();
    this.prePlanosFiltrados = termino === ''
      ? this.prePlanos
      : this.prePlanos.filter(p => p.descripcion.toLowerCase().includes(termino));
  }

  openRegisterModal(): void {
    this.nuevoPrePlano = {
      cantidad: null,
      descripcion: '',
      tiempo_estimado: '',
      material: null,
      preProducto: null
    };
    this.isModalRegisterOpen = true;
  }

  createPrePlano(): void {
    const body = {
      cantidad: this.nuevoPrePlano.cantidad,
      descripcion: this.nuevoPrePlano.descripcion,
      tiempo_estimado: this.nuevoPrePlano.tiempo_estimado,
      materialId: this.nuevoPrePlano.material.id,
      preProductoId: this.nuevoPrePlano.preProducto.id
    };


    this.prePlanoService.createPrePlano(body).subscribe({
      next: () => {
        this.getPrePlanos();
        Swal.fire('Pre-plano registrado', '', 'success');
        this.closeRegisterModal();
      },
      error: (err) => {
        console.error('Error al registrar pre-plano', err);
        Swal.fire('Error al registrar el pre-plano', '', 'error');
      }
    });
  }

  openUpdateModal(preplano: any): void {
  this.prePlanoUpdate = {
    id: preplano.id,
    cantidad: preplano.cantidad,
    descripcion: preplano.descripcion,
    tiempo_estimado: preplano.tiempo_estimado,
    material: this.materiales.find(m => m.id === preplano.material.id),
    preProducto: this.preProductos.find(p => p.id === preplano.preProducto.id)
  };
  this.isModalUpdateOpen = true;
}


  updatePrePlano(): void {
    const body = {
  cantidad: this.prePlanoUpdate.cantidad,
  descripcion: this.prePlanoUpdate.descripcion,
  tiempo_estimado: this.prePlanoUpdate.tiempo_estimado,
  materialId: this.prePlanoUpdate.material.id,
  preProductoId: this.prePlanoUpdate.preProducto.id
};

this.prePlanoService.updatePrePlano(this.prePlanoUpdate.id, body).subscribe({
      next: () => {
        this.getPrePlanos();
        Swal.fire('Pre-plano actualizado', '', 'success');
        this.closeUpdateModal();
      },
      error: (err) => {
        console.error('Error al actualizar pre-plano', err);
        Swal.fire('Error al actualizar el pre-plano', '', 'error');
      }
    });
  }

  deletePrePlano(preplano: any): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.prePlanoService.deletePrePlano(preplano.id).subscribe({
          next: () => {
            this.getPrePlanos();
            Swal.fire('Pre-plano eliminado', '', 'success');
          },
          error: (err) => {
            console.error('Error al eliminar pre-plano', err);
            Swal.fire('Error al eliminar el pre-plano', '', 'error');
          }
        });
      }
    });
  }

  closeRegisterModal(): void {
    this.isModalRegisterOpen = false;
  }

  closeUpdateModal(): void {
    this.isModalUpdateOpen = false;
  }
}