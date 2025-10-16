import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { ProductoService } from '../../services/producto.service';
import { NgxDropzoneModule } from 'ngx-dropzone';
import { map, Observable } from 'rxjs';
import { ImgDropService } from '../../services/img-drop.service';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxDropzoneModule],
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.css'
})
export class ProductosComponent {
  productos: any[] = [];
  productosFiltrados: any[] = [];
  filtro: string = '';
  cantidadProducida: number = 0;
  disponibilidad: boolean | null = null;

  productoNuevo: any = {
    nombre: '',
    descripcion: '',
    precioUnitario: 0,
    stock: 0,
    stock_minimo: 0,
    imagen: '',
    tiempo: ''
  };

  productoEdit: any = {
    id: 0,
    nombre: '',
    descripcion: '',
    precioUnitario: 0,
    stock: 0,
    stock_minimo: 0,
    imagen: '',
    tiempo: ''
  };

  //Variables para la actualizacion de la imagen o stock
  productoSeleccionado: any = null;
  nuevaImagen: string = '';
  previewImageUrl: string | ArrayBuffer | null = null;
  nuevoStock: number = 0;
  editandoStock: boolean = false;
  editandoImagen: boolean = false;
  isModalActualizarOpen: boolean = false;

  // Control de modales
  isModalNuevoOpen: boolean = false;
  isModalEditarOpen: boolean = false;

  constructor(private productoService: ProductoService, private imgdropService: ImgDropService) { }

  ngOnInit(): void {
    this.obtenerProductos();
  }

  files: File[] = [];

  onSelect(event: any) {
    this.files = []; // solo permite una imagen
    this.files.push(...event.addedFiles);

    const reader = new FileReader();
    reader.onload = () => {
      this.previewImageUrl = reader.result;
    };

    if (this.files[0]) {
      reader.readAsDataURL(this.files[0]);
    }
  }

  onRemove(file: File): void {
    this.files.splice(this.files.indexOf(file), 1);
    this.previewImageUrl = null;
  }

  upload(): Observable<string> {
    const file_data = this.files[0];
    const data = new FormData();

    data.append('file', file_data);
    data.append('upload_preset', 'nova-library');
    data.append('cloud_name', 'day1tsmdn');

    return this.imgdropService.uploadImg(data).pipe(
      map((response: any) => response.secure_url)
    );
  }

  obtenerProductos(): void {
    Swal.fire({ title: 'Cargando productos...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    this.productoService.getProductos().subscribe({
      next: (data) => {
        this.productos = data;
        this.productosFiltrados = data;
        Swal.close();
      },
      error: (err) => {
        console.error('Error al obtener productos', err);
        Swal.close();
      }
    });
  }

  filtrarProductos(): void {
    const termino = this.filtro.trim().toLowerCase();
    this.productosFiltrados = termino
      ? this.productos.filter(p => p.nombre.toLowerCase().includes(termino))
      : this.productos;
  }

  abrirModalNuevo(): void {
    this.productoNuevo = {
      nombre: '',
      descripcion: '',
      precioUnitario: 0,
      stock: 0,
      stock_minimo: 1,
      imagen: '',
      tiempo: ''
    };
    this.previewImageUrl = null;
    this.files = [];
    this.isModalNuevoOpen = true;
  }

  cerrarModalNuevo(): void {
    this.isModalNuevoOpen = false;
  }

  crearProducto(): void {
    if (this.files.length === 0) {
      Swal.fire("Por favor selecciona una imagen");
      return;
    }

    this.upload().subscribe({
      next: (imagen: string) => {
        const producto = {
          nombre: this.productoNuevo.nombre,
          descripcion: this.productoNuevo.descripcion,
          precioUnitario: this.productoNuevo.precioUnitario,
          stock: this.productoNuevo.stock,
          stock_minimo: this.productoNuevo.stock_minimo,
          imagen: imagen, // aqui la URL de Cloudinary
          tiempo: this.productoNuevo.tiempo
        };

        this.productoService.createProducto(producto).subscribe({
          next: (resp: any) => {
            if (resp.id || resp.id >= 1) {
              this.obtenerProductos();
              Swal.fire({
                position: "center",
                icon: "success",
                title: "Producto registrado!",
                showConfirmButton: false,
                timer: 2500
              });
              setTimeout(() => this.cerrarModalNuevo(), 2600);
            } else {
              Swal.fire({
                position: "center",
                icon: "error",
                title: "Error al registrar el Producto!",
                showConfirmButton: false,
                timer: 2500
              });
            }
          },
          error: () => {
            Swal.fire({
              position: "center",
              icon: "error",
              title: "Error al registrar el Producto!",
              showConfirmButton: false,
              timer: 2500
            });
          }
        });
      },
      error: (e: any) => {
        console.log(e);
        Swal.fire("Error al subir la imagen");
      }
    });
  }

  abrirModalEditar(producto: any): void {
    this.productoEdit = { ...producto };
    this.previewImageUrl = producto.imagen; // mostrar imagen actual
    this.files = []; // evitar arrastre previo
    this.isModalEditarOpen = true;
  }

  cerrarModalEditar(): void {
    this.isModalEditarOpen = false;
  }

  updateproducto() {
    if (this.files.length > 0) {
      // Subir imagen nueva a Cloudinary
      Swal.fire({ title: 'Subiendo imagen...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

      this.upload().subscribe({
        next: (imgUrl: string) => {
          // Asignar nueva imagen al producto y actualizar
          this.productoEdit.imagen = imgUrl;
          this.actualizarProducto();
        },
        error: (e: any) => {
          Swal.close();
          console.error(e);
          Swal.fire("Error al subir la nueva imagen");
        }
      });
    } else {
      // No se subió una nueva imagen, usar la existente
      this.actualizarProducto();
    }
  }

  actualizarProducto(): void {
    this.productoService.updateProducto(this.productoEdit.id, this.productoEdit).subscribe({
      next: () => {
        Swal.close();
        Swal.fire('¡Actualizado!', 'Producto actualizado correctamente.', 'success');
        this.obtenerProductos();
        this.cerrarModalEditar();
      },
      error: (err) => {
        Swal.close();
        console.error(err);
        Swal.fire('Error', 'No se pudo actualizar el producto.', 'error');
      }
    });
  }

  eliminarProducto(producto: any): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Eliminarás el producto: ${producto.nombre}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.productoService.deleteProducto(producto.id).subscribe({
          next: () => {
            Swal.fire('¡Eliminado!', 'Producto eliminado exitosamente.', 'success');
            this.obtenerProductos();
          },
          error: (err) => {
            console.error(err);
            Swal.fire('Error', 'No se pudo eliminar el producto.', 'error');
          }
        });
      }
    });
  }

  XactualizarImagen(): void {
    if (!this.nuevaImagen.trim()) return;

    this.productoService.updateImageProducto(this.productoSeleccionado.id, this.nuevaImagen).subscribe({
      next: (resp: any) => {
        if (resp) {
          this.obtenerProductos();
          Swal.fire({
            position: "center",
            icon: "success",
            title: "¡Imagen actualizada!",
            showConfirmButton: false,
            timer: 2500
          }).then(() => {
            this.cerrarModalActualizar();
          });
        }
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'No se pudo actualizar la imagen.', 'error');
      }
    });
  }

  actualizarImagen(): void {
    if (this.files.length === 0) {
      Swal.fire("Por favor selecciona una imagen");
      return;
    }

    Swal.fire({ title: 'Subiendo imagen...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    this.upload().subscribe({
      next: (imgUrl: string) => {
        this.productoService.updateImageProducto(this.productoSeleccionado.id, imgUrl).subscribe({
          next: (resp: any) => {
            Swal.close();
            if (resp) {
              this.obtenerProductos();
              Swal.fire({
                position: "center",
                icon: "success",
                title: "¡Imagen actualizada!",
                showConfirmButton: false,
                timer: 2500
              }).then(() => {
                this.cerrarModalActualizar();
                this.files = []; // Limpiar dropzone
                this.previewImageUrl = null;
              });
            }
          },
          error: (err) => {
            Swal.close();
            console.error(err);
            Swal.fire('Error', 'No se pudo actualizar la imagen.', 'error');
          }
        });
      },
      error: (e: any) => {
        Swal.close();
        console.error(e);
        Swal.fire("Error al subir la imagen");
      }
    });
  }


  actualizarStock(): void {
    if (this.nuevoStock < 0) return;
    this.productoService.updateStockProducto(this.productoSeleccionado.id, this.nuevoStock).subscribe({
      next: (resp: any) => {
        if (resp) {
          this.obtenerProductos();
          Swal.fire({
            position: "center",
            icon: "success",
            title: "¡Stock actualizado!",
            showConfirmButton: false,
            timer: 2500
          }).then(() => {
            this.cerrarModalActualizar();
          });
        }
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'No se pudo actualizar el stock.', 'error');
      }
    });
  }

  registrarProduccion(): void {
    if (this.cantidadProducida <= 0) return;

    this.productoService.registerProduction(this.productoSeleccionado.id, this.cantidadProducida).subscribe({
      next: () => {
        Swal.fire('¡Producción registrada!', 'La cantidad producida fue añadida al stock.', 'success');
        this.obtenerProductos();
        //this.cerrarModalProduccion();
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'No se pudo registrar la producción.', 'error');
      }
    });
  }

  verificarDisponibilidadProducto(producto: any, cantidad: number): void {
    this.productoService.verificarDisponibilidad(producto.id, cantidad).subscribe({
      next: (resp) => {
        this.disponibilidad = resp.disponible;
        Swal.fire({
          title: 'Disponibilidad',
          text: resp.disponible ? 'Producto disponible' : 'Producto NO disponible',
          icon: resp.disponible ? 'success' : 'warning',
          confirmButtonText: 'OK'
        });
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'No se pudo verificar la disponibilidad.', 'error');
      }
    });
  }

  abrirModalActualizar(producto: any): void {
    this.productoSeleccionado = producto;
    this.editandoImagen = false;
    this.editandoStock = false;
    this.nuevaImagen = producto.imagen || '';
    this.nuevoStock = producto.stock;
    this.isModalActualizarOpen = true;
  }

  cerrarModalActualizar(): void {
    this.isModalActualizarOpen = false;
  }
}
