import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { SubcategoriasService } from '../../services/subcategorias.service';

@Component({
  selector: 'app-subcategorias',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './subcategorias.component.html',
  styleUrl: './subcategorias.component.css'
})
export class SubcategoriasComponent {
  subcategoriasFiltradas: any[] = []; // Subcategorías visibles según filtro
  filtro: string = '';
  subcategorias: any[] = [];
  subcategoriaUpdate: string = '';
  subcategoriaDescripcionUpdate: string = '';
  nuevaSubcategoria: any = { nombre: '', descripcion: '' };
  subcategoriaIdSelected: number = 0;
  isModalRegisterSubcategoriaOpen: boolean = false;
  isModalUpdateSubcategoriaOpen: boolean = false;

  constructor(private subcategoriasService: SubcategoriasService) { }

  ngOnInit(): void {
    this.getSubcategorias();
  }

  getSubcategorias(): void {
    Swal.fire({
      title: 'Cargando subcategorias...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    this.subcategoriasService.getSubcategorias().subscribe({
      next: (data) => {
        this.subcategorias = data;
          Swal.close();
        this.subcategoriasFiltradas = data; // Mostrar todas al inicio
      },
      error: (error) => {
        console.error('Error al obtener las subcategorias', error);
      }
    });
  }

  buscarSubcategorias(): void {
    const termino = this.filtro.trim().toLowerCase();
    if (termino === '') {
      this.subcategoriasFiltradas = this.subcategorias;
    } else {
      this.subcategoriasFiltradas = this.subcategorias.filter(sub =>
        sub.nombre.toLowerCase().includes(termino)
      );
    }
  }

  createSubcategoria(): void {
    if (!this.nuevaSubcategoria.nombre.trim() || !this.nuevaSubcategoria.descripcion.trim()) return;
    this.subcategoriasService.createSubcategoria(this.nuevaSubcategoria).subscribe({
      next: (data) => {
        //this.subcategorias.push(data);
        console.log(data);
        this.nuevaSubcategoria = { nombre: '', descripcion: '' };
        this.getSubcategorias();
        Swal.fire({
          position: "center",
          icon: "success",
          title: "Subcategoria registrada!",
          showConfirmButton: false,
          timer: 2500
        });
        setTimeout(() => {
          this.closeRegisterSubcategoriaModal();
        }, 2600);
      },
      error: (error: any) => {
        console.log('Error al registrar la subcategoria:', error);
        Swal.fire({
          position: "center",
          icon: "error",
          title: "Error al registrar la subcategoria!",
          showConfirmButton: false,
          timer: 2500
        });
      }
    });
  }

  activeRegisterForm() {
    this.isModalRegisterSubcategoriaOpen = true;
  }

  openModalToUpdateSubcategoria(subcategoria: any) {
    console.log('subcategoria id: ' + subcategoria.id);
    this.isModalUpdateSubcategoriaOpen = true;
    this.subcategoriaUpdate = subcategoria.nombre;
    this.subcategoriaIdSelected = subcategoria.id;               
    this.subcategoriaDescripcionUpdate = subcategoria.descripcion;
  }

  updateSubcategoria() {
    let subcategoriaData = {
      nombre: this.subcategoriaUpdate,
      descripcion: this.subcategoriaDescripcionUpdate
    };
    this.subcategoriasService.updateSubcategoria(this.subcategoriaIdSelected, subcategoriaData).subscribe(
      {
        next: (resp: any) => {
          console.log(resp);
          if (resp) {
            this.getSubcategorias();
            Swal.fire({
              position: "center",
              icon: "success",
              title: "Subcategoria actualizada!",
              showConfirmButton: false,
              timer: 2500
            });

            setTimeout(() => {
              this.closeUpdateSubcategoriaModal();
            }, 2600);
          }

        },
        error: (error: any) => {
          console.log(error);

        }
      }
    );
  }

  deleteSubcategoria(subcategoria: any) {
    this.subcategoriasService.deleteSubcategoria(subcategoria.id).subscribe(
      {
        next: (resp: any) => {
          console.log(resp);
          this.getSubcategorias();
          Swal.fire({
            position: "center",
            icon: "success",
            title: "Subcategoria eliminado!",
            showConfirmButton: false,
            timer: 2500
          });
        },
        error: (error: any) => {
          console.log(error);

        }
      }
    );

  }
  closeRegisterSubcategoriaModal() {
    this.isModalRegisterSubcategoriaOpen = false;
  }

  closeUpdateSubcategoriaModal() {
    this.isModalUpdateSubcategoriaOpen = false;
  }
}