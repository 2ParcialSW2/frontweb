import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialesService } from '../../services/materiales.service';
import { SectorService } from '../../services/sector.service';
import { CategoriasService } from '../../services/categorias.service';
import Swal from 'sweetalert2';
import { Subject, debounceTime, switchMap } from 'rxjs';

@Component({
  selector: 'app-materiales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './materiales.component.html'
})
export class MaterialesComponent implements OnInit {
  materiales: any[] = [];
  sectores: any[] = [];
  categorias: any[] = [];
  materialesFiltradas: any[] = []; // visibles según filtro
  filtro: string = '';

  materialSeleccionado: any = null;
  nuevoMaterial: any = {
    nombre: '',
    descripcion: '',
    unidadMedida: '',
    stockActual: 0,
    stockMinimo: 0,
    imagen: '',
    categoriaId: null,
    sectorId: null
  };

  xnuevoMaterial = {
    nombre: '',
    stockActual: 0,
    unidadMedida: '',
    stockMinimo: 0,
    categoriaId: null,
    descripcion: '',
    imagen: ''
  };
  busquedaNombre: string = '';
  private busquedaNombreSubject = new Subject<string>();
  proveedorId: number = 0;
  actualizacionStock: { id: number, cantidad: number } = { id: 0, cantidad: 0 };
  actualizacionImagen: { id: number, imagen: string } = { id: 0, imagen: '' };

  // Modales
  isModalRegisterMaterialesOpen: boolean = false;
  isModalUpdateMaterialesOpen: boolean = false;

  constructor(
    private materialesService: MaterialesService,
    private sectorService: SectorService,
    private categoriasService: CategoriasService
  ) {}

  ngOnInit(): void {
    this.obtenerMateriales();
    this.obtenerSectores();
    this.obtenerCategorias();
    this.busquedaNombreSubject.pipe(
      debounceTime(300), // Espera 3s después de escribir
      switchMap((nombre: string) => {
        if (nombre.trim() === '') {
          return this.materialesService.getMateriales(); // Devuelve todos los materiales si está vacío
        } else {
          return this.materialesService.buscarPorNombre(nombre); // Busca por nombre si no está vacío
        }
      })
    ).subscribe(response => {
      if (response && response.data) {
        this.materiales = Array.isArray(response.data) ? response.data : [response.data];
      } else {
        this.materiales = [];
      }
    });
  }

  obtenerMateriales() {
    Swal.fire({
    title: 'Cargando materias primas...',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });
    this.materialesService.getMateriales().subscribe({
      next: (data) => {
        this.materiales = data
        Swal.close();
        this.materialesFiltradas = data; // Mostrar todos al inicio
      },
      error: (error) => {
        console.error('Error al obtener los materiales', error);
      }
    });
  }

  buscarMateriales(): void {
    const termino = this.filtro.trim().toLowerCase();
    if (termino === '') {
      this.materialesFiltradas = this.materiales;
    } else {
      this.materialesFiltradas = this.materiales.filter(sub =>
        sub.nombre.toLowerCase().includes(termino)
      );
    }
  }

  obtenerSectores() {
    this.sectorService.getSectores().subscribe(response => {
      this.sectores = response.data;  //Extrae el array desde .data
      console.log(this.sectores);
    });
  }

  obtenerCategorias() {
    this.categoriasService.getCategorias().subscribe(
      (data) => {
        this.categorias = data;
      },
      (error) => {
        console.error('Error al obtener categorías', error);
      }
    );
  }

  crearMaterial() {
    this.materialesService.createMaterial(this.nuevoMaterial).subscribe(() => {
      this.obtenerMateriales();
      this.limpiarFormularioMaterial();
      this.closeRegisterMaterialModal();
    });
  }

  actualizarMaterial() {
    if (!this.materialSeleccionado) return;

    this.materialesService.updateMaterial(
      this.materialSeleccionado.id,
      this.materialSeleccionado
    ).subscribe(() => {
      this.obtenerMateriales();
      this.materialSeleccionado = null;
      this.closeUpdateMaterialModal();
    });
  }

  eliminarMaterial(id: number) {
    this.materialesService.deleteMaterial(id).subscribe(() => this.obtenerMateriales());
  }

  onInputBuscarNombre(event: string): void {
    if (event=="") {
      this.obtenerMateriales();
    }
    this.materialesService.buscarPorNombre(event).subscribe((data) => {
      console.log("Datos recibidos de la búsqueda:", data);
      this.materiales = data;
    }, (error) => {
      console.error("Error buscando materiales:", error);
    });
  }
  
  buscarPorProveedor() {
    this.materialesService.getPorProveedor(this.proveedorId).subscribe(data => this.materiales = data);
  }

  obtenerBajoStock() {
    this.materialesService.getBajoStock().subscribe(data => this.materiales = data);
  }

  obtenerReabastecimiento() {
    this.materialesService.getNecesitanReabastecimiento().subscribe(data => this.materiales = data);
  }

  actualizarStock() {
    this.materialesService.actualizarStock(this.actualizacionStock.id, { cantidad: this.actualizacionStock.cantidad })
      .subscribe(() => this.obtenerMateriales());
  }

  actualizarImagen() {
    this.materialesService.actualizarImagen(this.actualizacionImagen.id, { imagen: this.actualizacionImagen.imagen })
      .subscribe(() => this.obtenerMateriales());
  }

  buscar(query: string) {
    this.materialesService.buscar(query).subscribe(data => this.materiales = data);
  }

  activeRegisterMaterialForm() {
    this.limpiarFormularioMaterial();
    this.isModalRegisterMaterialesOpen = true;
  }

  closeRegisterMaterialModal() {
    this.isModalRegisterMaterialesOpen = false;
  }

  openModalToUpdateMaterial(material: any) {
    this.materialSeleccionado = { ...material };
    this.isModalUpdateMaterialesOpen = true;
  }

  closeUpdateMaterialModal() {
    this.isModalUpdateMaterialesOpen = false;
    this.materialSeleccionado = null;
  }

  limpiarFormularioMaterial() {
    this.nuevoMaterial = {
      nombre: '',
      stockActual: 0,
      unidadMedida: '',
      stockMinimo: 0,
      categoriaId: null,
      descripcion: '',
      imagen: '',
      sectorId: null
    };
  }
}
