import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { forkJoin } from 'rxjs';
import { PlanoService } from '../../services/plano.service';
import { ProductoService } from '../../services/producto.service';
import { PreProductoService } from '../../services/pre-producto.service';

@Component({
  selector: 'app-planos',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './plano.component.html',
  styleUrl: './plano.component.css'
})
export class PlanoComponent implements OnInit {
  planos: any[] = [];
  productos: any[] = [];
  preProductos: any[] = [];
  planosAgrupados: any[] = [];
  filtro: string = '';

  nuevoPlano: any = {
    producto: null,
    cantidad: null,
    tiempo_estimado: '',
    detalles: []
  };

  planoUpdate: any = {
    id: null,
    cantidad: null,
    descripcion: '',
    tiempo_estimado: '',
    producto: null,
    preProducto: null
  };

  isModalRegisterPlanoOpen: boolean = false;
  isModalUpdatePlanoOpen: boolean = false;

  constructor(
    private planoService: PlanoService,
    private productoService: ProductoService,
    private preProductoService: PreProductoService
  ) {}

  ngOnInit(): void {
    forkJoin([
      this.productoService.getProductos(),
      this.preProductoService.obtenerTodos(),
      this.planoService.getPlanos()
    ]).subscribe({
      next: ([productos, preProductos, planosRaw]) => {
        this.productos = productos;
        this.preProductos = preProductos;

        this.planos = planosRaw.map(plano => {
          return {
            ...plano,
            producto: plano.producto || this.productos.find(p => p.id === plano.productoId),
            preProducto: plano.preProducto || this.preProductos.find(pp => pp.id === plano.preProductoId)
          };
        });

        this.agruparPlanos();
      },
      error: (err) => {
        console.error("Error al cargar datos iniciales", err);
      }
    });
  }

  agruparPlanos(): void {
    const mapaAgrupado = new Map<number, any>();

    this.planos.forEach(plano => {
      const pid = plano.producto.id;

      if (!mapaAgrupado.has(pid)) {
        mapaAgrupado.set(pid, {
          producto: plano.producto,
          cantidad: plano.cantidad,
          tiempo_estimado: plano.tiempo_estimado || 'N/A',
          descripcion: plano.descripcion.split(' - ')[0],
          preProductos: [plano.preProducto.nombre],
          planos: [plano]
        });
      } else {
const grupo = mapaAgrupado.get(pid);
      grupo.preProductos.push(plano.preProducto?.nombre || '');
      grupo.planos.push(plano); 
      }
    });

    this.planosAgrupados = Array.from(mapaAgrupado.values());
  }

  buscarPlanos(): void {
    const termino = this.filtro.trim().toLowerCase();
    if (termino === '') {
      this.agruparPlanos();
    } else {
      const filtrados = this.planos.filter(p => p.descripcion.toLowerCase().includes(termino));
      this.planos = filtrados;
      this.agruparPlanos();
    }
  }

  activeRegisterForm(): void {
    this.nuevoPlano = {
      producto: null,
      cantidad: null,
      tiempo_estimado: '',
      detalles: [
        { preProducto: null }
      ]
    };
    this.isModalRegisterPlanoOpen = true;
  }

  agregarDetallePlano(): void {
    this.nuevoPlano.detalles.push({
      preProducto: null
    });
  }

  eliminarDetallePlano(index: number): void {
    this.nuevoPlano.detalles.splice(index, 1);
  }

  createMultiplePlanos(): void {
    const producto = this.nuevoPlano.producto;

    if (!producto || !this.nuevoPlano.detalles.length || !this.nuevoPlano.cantidad || !this.nuevoPlano.tiempo_estimado?.trim()) {
      Swal.fire('Error', 'Todos los campos son obligatorios.', 'error');
      return;
    }

    const peticiones = this.nuevoPlano.detalles.map((detalle: any) => {
      return this.planoService.createPlano({
        productoId: producto.id,
        preProductoId: detalle.preProducto.id,
        descripcion: `Plano para ${producto.nombre} - ${detalle.preProducto.nombre}`,
        cantidad: this.nuevoPlano.cantidad,
        tiempo_estimado: this.nuevoPlano.tiempo_estimado
      });
    });

    forkJoin(peticiones).subscribe({
      next: () => {
        Swal.fire('Éxito', 'Todos los planos fueron registrados.', 'success');
        this.closeRegisterPlanoModal();
        this.ngOnInit();
      },
      error: (err) => {
        console.error('Error al crear planos', err);
        Swal.fire('Error', 'Hubo un problema al registrar los planos.', 'error');
      }
    });
  }

  openModalToUpdatePlano(plano: any): void {
    this.planoUpdate = {
      id: plano.id,
      cantidad: plano.cantidad,
      descripcion: plano.descripcion,
      tiempo_estimado: plano.tiempo_estimado,
      producto: this.productos.find(p => p.id === plano.producto?.id),
      preProducto: this.preProductos.find(p => p.id === plano.preProducto?.id)
    };
    this.isModalUpdatePlanoOpen = true;
  }

  updatePlano(): void {
    const { id, cantidad, descripcion, tiempo_estimado, producto, preProducto } = this.planoUpdate;

    if (!id || !cantidad || !descripcion.trim() || !tiempo_estimado.trim() || !producto || !preProducto) {
      Swal.fire("Error", "Todos los campos son obligatorios", "error");
      return;
    }

    this.planoService.updatePlano(id, {
      cantidad,
      descripcion: descripcion.trim(),
      tiempo_estimado: tiempo_estimado.trim(),
      productoId: producto.id,
      preProductoId: preProducto.id
    }).subscribe({
      next: () => {
        this.ngOnInit();
        Swal.fire("Plano actualizado", "", "success");
        this.closeUpdatePlanoModal();
      },
      error: (err) => {
        console.error('Error al actualizar plano', err);
        Swal.fire("Error al actualizar el plano", "", "error");
      }
    });
  }

  deletePlano(planoAgrupado: any): void {
  Swal.fire({
    title: '¿Eliminar todos los planos del producto?',
    html: `Se eliminarán ${planoAgrupado.planos.length} plano(s) de <b>${planoAgrupado.producto.nombre}</b>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  }).then(result => {
    if (result.isConfirmed) {
      const peticiones = planoAgrupado.planos.map((p: any) =>
        this.planoService.deletePlano(p.id)
      );

      forkJoin(peticiones).subscribe({
        next: () => {
          Swal.fire('Eliminado', 'Los planos han sido eliminados.', 'success');
          this.ngOnInit(); // o this.getPlanos();
        },
        error: (err) => {
          console.error('Error al eliminar planos', err);
          Swal.fire('Error', 'Ocurrió un error al eliminar los planos.', 'error');
        }
      });
    }
  });

}


  closeRegisterPlanoModal(): void {
    this.isModalRegisterPlanoOpen = false;
  }

  closeUpdatePlanoModal(): void {
    this.isModalUpdatePlanoOpen = false;
  }
}
