import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { CategoriasService } from '../../services/categorias.service';
import { SubcategoriasService } from '../../services/subcategorias.service';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './categorias.component.html',
  styleUrl: './categorias.component.css'
})
export default class CategoriasComponent implements OnInit {
  categoriasFiltradas: any[] = []; // visibles según filtro
  filtro: string = '';
  categorias: any[] = [];
  subcategorias: any[] = [];
  nuevoCategoria: any = { nombre: '', descripcion: '', subCategoriaId: null };
  categoriaUpdate: any = { id: null, nombre: '', descripcion: '', subCategoriaId: null };
  isModalRegisterCategoriaOpen: boolean = false;
  isModalUpdateCategoriaOpen: boolean = false;

  constructor(
    private categoriaService: CategoriasService,
    private subcategoriaService: SubcategoriasService
  ) {}

  ngOnInit(): void {
    this.getCategorias();
    this.getSubcategorias();
  }

  getCategorias(): void {
    Swal.fire({
      title: 'Cargando categorias...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    this.categoriaService.getCategorias().subscribe({
      next: (data) => {this.categorias = data;
      Swal.close();
      this.categoriasFiltradas = data; // Mostrar todas al inicio
      },error: (error) => console.error('Error al obtener las Categorias', error)
    });
  }

  buscarCategorias(): void {
    const termino = this.filtro.trim().toLowerCase();
    if (termino === '') {
      this.categoriasFiltradas = this.categorias;
    } else {
      this.categoriasFiltradas = this.categorias.filter(sub =>
        sub.nombre.toLowerCase().includes(termino)
      );
    }
  }

  getSubcategorias(): void {
    this.subcategoriaService.getSubcategorias().subscribe({
      next: (data) => {
        this.subcategorias = data;
        console.log('Subcategorías recibidas:', this.subcategorias); // Verifica cómo se reciben las subcategorías
      },
      error: (error) => console.error('Error al obtener las Subcategorias', error)
    });
  }

  activeRegisterForm(): void {
    this.nuevoCategoria = { nombre: '', descripcion: '', subCategoriaId: null };
    this.isModalRegisterCategoriaOpen = true;
  }

  createCategoria(): void {
    const { nombre, descripcion, subCategoriaId } = this.nuevoCategoria;

    if (!nombre.trim() || !descripcion.trim() || !subCategoriaId) {
      Swal.fire("Error", "Todos los campos son obligatorios", "error");
      return;
    }

    this.categoriaService.createCategoria(this.nuevoCategoria).subscribe({
      next: () => {
        this.getCategorias();
        Swal.fire("Categoría registrada", "", "success");
        this.closeRegisterCategoriaModal();
      },
      // error: (err) => {
      //   console.error('Error al registrar categoría', err);
      //   Swal.fire("Error al registrar la categoría", "", "error");
      // }
      error: (err) => {
        console.error('Error completo:', err);
        console.error('Status:', err.status);
        console.error('Mensaje:', err.message);
        console.error('Detalle:', err.error);
        Swal.fire("Error al registrar la categoría", "", "error");
      }
    });
  }

  openModalToUpdateCategoria(categoria: any): void {
    this.categoriaUpdate = {
      id: categoria.id,
      nombre: categoria.nombre,
      descripcion: categoria.descripcion,
      subCategoriaId: categoria.subCategoria?.id || null
    };
    this.isModalUpdateCategoriaOpen = true;
  }

  updateCategoria(): void {
    const { id, nombre, descripcion, subCategoriaId } = this.categoriaUpdate;

    if (!id || !nombre.trim() || !descripcion.trim() || !subCategoriaId) {
      Swal.fire("Error", "Todos los campos son obligatorios", "error");
      return;
    }

    this.categoriaService.updateCategoria(id, {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      subCategoriaId
    }).subscribe({
      next: () => {
        this.getCategorias();
        Swal.fire("Categoría actualizada", "", "success");
        this.closeUpdateCategoriaModal();
      },
      error: (err) => {
        console.error('Error al actualizar categoría', err);
        Swal.fire("Error al actualizar la categoría", "", "error");
      }
    });
  }

  deleteCategoria(categoria: any): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.categoriaService.deleteCategoria(categoria.id).subscribe({
          next: () => {
            this.getCategorias();
            Swal.fire("Categoría eliminada", "", "success");
          },
          error: (err) => {
            console.error('Error al eliminar categoría', err);
            Swal.fire("Error al eliminar la categoría", "", "error");
          }
        });
      }
    });
  }

  closeRegisterCategoriaModal(): void {
    this.isModalRegisterCategoriaOpen = false;
  }

  closeUpdateCategoriaModal(): void {
    this.isModalUpdateCategoriaOpen = false;
  }
}
