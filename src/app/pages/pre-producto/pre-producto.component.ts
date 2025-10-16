import { Component, OnInit } from '@angular/core';
import { PreProductoService } from '../../services/pre-producto.service';
import { PreProducto, PreProductoDTO } from '../../models/preProducto.model';
import { PreMaquinaria, PreMaquinariaDTO, Maquinaria } from '../../models/preMaquinaria.model';
import { PreMaquinariaService } from '../../services/pre-maquinaria.service';
import { MaquinariasService } from '../../services/maquinarias.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { forkJoin, of, delay, retry, catchError } from 'rxjs';
import { ImgDropService } from '../../services/img-drop.service';
import { NgxDropzoneModule } from 'ngx-dropzone';
import { map, Observable } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


@Component({
  selector: 'app-pre-producto',
  templateUrl: './pre-producto.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxDropzoneModule],
  styleUrls: ['./pre-producto.component.css']
})
export class PreProductoComponent implements OnInit {
  // Listas principales
  preProductos: PreProducto[] = [];
  preProductosFiltrados: PreProducto[] = [];
  maquinarias: Maquinaria[] = [];

  // Filtros
  filtro: string = '';

  // Modales
  isModalRegisterOpen = false;
  isModalUpdateOpen = false;
  isModalPlanificacionOpen = false;

  // Objetos para formularios
  nuevoPreProducto: PreProductoDTO = {
    nombre: '',
    descripcion: '',
    stock: 0,
    tiempo: '',
    url_Image: ''
  };

  preProductoUpdate: PreProducto = {
    id: 0,
    nombre: '',
    descripcion: '',
    stock: 0,
    tiempo: '',
    url_Image: ''
  };

  // Planificación de maquinarias
  preProductoSeleccionado: PreProducto | null = null;
  planificacionesActuales: PreMaquinaria[] = [];
  nuevaPlanificacion: PreMaquinariaDTO = {
    cantidad: 1,
    descripcion: '',
    tiempoEstimado: '',
    maquinariaId: 0,
    preProductoId: 0
  };

  // Estados de carga
  cargandoPlanificaciones = false;
  resumenPlanificacion: any = null;
  resumenesPlanificacion: Map<number, any> = new Map();
  estadosPlanificacion: Map<number, string> = new Map();
  
  // ✅ NUEVO: Control de llamadas en progreso
  estadosEnCarga: Set<number> = new Set();
  cargandoEstadosGlobales = false;

  dropdownOpen: number | null = null;
  files: File[] = [];

  nuevaImagen: string = '';
  previewImageUrl: string | ArrayBuffer | null = null;
  editandoImagen: boolean = false;

  constructor(
    private preProductoService: PreProductoService,
    private preMaquinariaService: PreMaquinariaService,
    private maquinariasService: MaquinariasService,
    private imgDropService: ImgDropService,
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  // ================ CARGA DE DATOS ================
  cargarDatos(): void {
    this.cargarPreProductos();
    this.cargarMaquinarias();
  }

  cargarPreProductos(): void {
    this.preProductoService.obtenerTodos().subscribe({
      next: (data) => {
        this.preProductos = data;
        this.preProductosFiltrados = data;
        this.cargarTodosLosEstadosOptimizado();
        console.log('📦 Preproductos:', data); 
      },
      error: (error) => {
        console.error('Error al cargar pre-productos:', error);
        Swal.fire('Error', 'No se pudieron cargar los pre-productos', 'error');
      }
    });
  }

  cargarMaquinarias(): void {
    this.maquinariasService.getMaquinarias().subscribe({
      next: (data: any) => {
        this.maquinarias = data;
      },
      error: (error: any) => {
        console.error('Error al cargar maquinarias:', error);
      }
    });
  }

  // ================ SOLUCIÓN 1: CARGA OPTIMIZADA CON CONTROL DE CONCURRENCIA ================
  cargarTodosLosEstadosOptimizado(): void {
    if (this.cargandoEstadosGlobales) {
      console.log('Ya se están cargando los estados globales');
      return;
    }

    this.cargandoEstadosGlobales = true;
    
    // Crear observables con retry y manejo de errores
    const estadosObservables = this.preProductos.map(producto => 
      this.preProductoService.verificarPlanificacionCompleta(producto.id).pipe(
        retry(2), // Reintenta 2 veces en caso de error
        delay(Math.random() * 100), // Delay aleatorio para evitar concurrencia
        catchError(error => {
          console.error(`Error al cargar estado del producto ${producto.id}:`, error);
          return of(null); // Retorna null en caso de error
        })
      )
    );

    // Ejecutar todas las llamadas de forma controlada
    forkJoin(estadosObservables).subscribe({
      next: (resultados) => {
        resultados.forEach((resumen, index) => {
          const producto = this.preProductos[index];
          if (resumen) {
            this.procesarResumenEstado(producto.id, resumen);
          } else {
            this.estadosPlanificacion.set(producto.id, 'Error');
          }
        });
        this.cargandoEstadosGlobales = false;
      },
      error: (error) => {
        console.error('Error al cargar estados globales:', error);
        this.cargandoEstadosGlobales = false;
      }
    });
  }

  // ================ SOLUCIÓN 2: ACTUALIZACIÓN INDIVIDUAL CONTROLADA ================
  actualizarEstadoProducto(preProductoId: number): void {
    // ✅ Evitar múltiples llamadas simultáneas al mismo producto
    if (this.estadosEnCarga.has(preProductoId)) {
      console.log(`Ya se está actualizando el estado del producto ${preProductoId}`);
      return;
    }

    this.estadosEnCarga.add(preProductoId);
    this.estadosPlanificacion.set(preProductoId, 'Cargando...');

    this.preProductoService.verificarPlanificacionCompleta(preProductoId).pipe(
      retry(2), // Reintenta 2 veces
      catchError(error => {
        console.error(`Error al actualizar estado del producto ${preProductoId}:`, error);
        
        // ✅ Manejo específico del error 409
        if (error.status === 409) {
          console.log(`Conflicto detectado para producto ${preProductoId}, reintentando en 1 segundo...`);
          return of(null).pipe(delay(1000));
        }
        
        return of(null);
      })
    ).subscribe({
      next: (resumen) => {
        if (resumen) {
          this.procesarResumenEstado(preProductoId, resumen);
        } else {
          this.estadosPlanificacion.set(preProductoId, 'Error');
        }
        this.estadosEnCarga.delete(preProductoId);
      },
      error: (error) => {
        console.error(`Error final al actualizar estado del producto ${preProductoId}:`, error);
        this.estadosPlanificacion.set(preProductoId, 'Error');
        this.estadosEnCarga.delete(preProductoId);
      }
    });
  }

  // ✅ NUEVO: Método para procesar resumen de estado
  private procesarResumenEstado(preProductoId: number, resumen: any): void {
    console.log('Resumen recibido:', resumen);
    this.resumenesPlanificacion.set(preProductoId, resumen);
    
    // Determinar estado basado en el resumen
    let estado = 'Sin planificación';
    if (resumen && typeof resumen.totalMaquinarias === 'number') {
      estado = resumen.planificacionCompleta ? 'Completa' : 'Incompleta';
    }
    
    this.estadosPlanificacion.set(preProductoId, estado);
    console.log(`Estado actualizado para producto ${preProductoId}: ${estado}`, resumen);
  }

  // ================ BÚSQUEDA Y FILTROS ================
  buscarPreProductos(): void {
    if (this.filtro.trim() === '') {
      this.preProductosFiltrados = this.preProductos;
    } else {
      this.preProductosFiltrados = this.preProductos.filter(p =>
        p.nombre.toLowerCase().includes(this.filtro.toLowerCase()) ||
        p.descripcion.toLowerCase().includes(this.filtro.toLowerCase())
      );
    }
  }

 


  // ================ CRUD PRE-PRODUCTOS ================
  openRegisterModal(): void {
    this.nuevoPreProducto = {
      nombre: '',
      descripcion: '',
      stock: 0,
      tiempo: '',
      url_Image: ''
    };
    this.isModalRegisterOpen = true;
  }

  closeRegisterModal(): void {
    this.isModalRegisterOpen = false;
  }

createPreProducto(): void {
  if (!this.validarPreProducto(this.nuevoPreProducto)) {
    return;
  }

  // Si hay imagen seleccionada, primero se sube a Cloudinary
  if (this.files.length > 0) {
    this.upload().subscribe({
      next: (url) => {
        this.nuevoPreProducto.url_Image = url; // asignar URL a preproducto
        this.guardarPreProducto(); // guardar en la BD
      },
      error: (error) => {
        console.error('Error al subir imagen a Cloudinary:', error);
        Swal.fire('Error', 'No se pudo subir la imagen', 'error');
      }
    });
  } else {
    this.guardarPreProducto(); // guardar sin imagen
  }
}

guardarPreProducto(): void {
  this.preProductoService.crear(this.nuevoPreProducto).subscribe({
    next: () => {
      Swal.fire('Éxito', 'Pre-producto creado correctamente', 'success');
      this.cargarPreProductos();
      this.closeRegisterModal();
    },
    error: (error) => {
      console.error('Error al crear pre-producto:', error);
      Swal.fire('Error', 'No se pudo crear el pre-producto', 'error');
    }
  });
}

openUpdateModal(preProducto: PreProducto): void {
  this.preProductoUpdate = { ...preProducto };
  this.isModalUpdateOpen = true;
  this.previewImageUrl = preProducto.url_Image || null;
  this.files = [];
}


  closeUpdateModal(): void {
    this.isModalUpdateOpen = false;
  }

updatePreProducto(): void {
  if (!this.validarPreProducto(this.preProductoUpdate)) {
    return;
  }

  // Si hay una nueva imagen seleccionada
  if (this.files.length > 0) {
    this.upload().subscribe({
      next: (url) => {
        this.preProductoUpdate.url_Image = url; // ✅ asignamos la nueva URL
        this.enviarActualizacion();             // 👇 separamos la lógica de envío
      },
      error: (error) => {
        console.error('Error al subir imagen:', error);
        Swal.fire('Error', 'No se pudo subir la nueva imagen', 'error');
      }
    });
  } else {
    this.enviarActualizacion(); // Si no hay nueva imagen, solo actualizamos
  }
}
enviarActualizacion(): void {
  this.preProductoService.actualizar(this.preProductoUpdate.id, this.preProductoUpdate).subscribe({
    next: () => {
      Swal.fire('Éxito', 'Pre-producto actualizado correctamente', 'success');
      this.cargarPreProductos();  // ✅ Refresca la tabla
      this.closeUpdateModal();
    },
    error: (error) => {
      console.error('Error al actualizar pre-producto:', error);
      Swal.fire('Error', 'No se pudo actualizar el pre-producto', 'error');
    }
  });
}


  deletePreProducto(preProducto: PreProducto): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará el pre-producto "${preProducto.nombre}" y todas sus planificaciones`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.preProductoService.eliminar(preProducto.id).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'Pre-producto eliminado correctamente', 'success');
            this.cargarPreProductos();
          },
          error: (error) => {
            console.error('Error al eliminar pre-producto:', error);
            Swal.fire('Error', 'No se pudo eliminar el pre-producto', 'error');
          }
        });
      }
    });
  }
//IMAGENES
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

    return this.imgDropService.uploadImg(data).pipe(
      map((response: any) => response.secure_url)
    );
  }

  // ================ GESTIÓN DE PLANIFICACIONES ================
  openPlanificacionModal(preProducto: PreProducto): void {
    this.preProductoSeleccionado = preProducto;
    this.cargarPlanificacionesActuales(preProducto.id);
    this.cargarResumenPlanificacion(preProducto.id);
    this.resetNuevaPlanificacion();
    this.isModalPlanificacionOpen = true;
  }

  closePlanificacionModal(): void {
    this.isModalPlanificacionOpen = false;
    this.preProductoSeleccionado = null;
    this.planificacionesActuales = [];
    this.resumenPlanificacion = null;
  }

  cargarPlanificacionesActuales(preProductoId: number): void {
    this.cargandoPlanificaciones = true;
    this.preMaquinariaService.obtenerPorProducto(preProductoId).subscribe({
      next: (data) => {
        this.planificacionesActuales = data;
        this.cargandoPlanificaciones = false;
      },
      error: (error) => {
        console.error('Error al cargar planificaciones:', error);
        this.cargandoPlanificaciones = false;
      }
    });
  }

  cargarResumenPlanificacion(preProductoId: number): void {
    this.preProductoService.verificarPlanificacionCompleta(preProductoId).subscribe({
      next: (data) => {
        this.resumenPlanificacion = data;
      },
      error: (error) => {
        console.error('Error al cargar resumen:', error);
      }
    });
  }

  // ================ MÉTODOS DE VERIFICACIÓN DE ESTADOS ================
  tienePlanificacion(preProductoId: number): boolean {
    const estado = this.estadosPlanificacion.get(preProductoId);
    return estado === 'Completa' || estado === 'Incompleta';
  }

  tienePlanificacionCompleta(preProductoId: number): boolean {
    return this.estadosPlanificacion.get(preProductoId) === 'Completa';
  }

  tienePlanificacionParcial(preProductoId: number): boolean {
    return this.estadosPlanificacion.get(preProductoId) === 'Incompleta';
  }

 obtenerEstadoPlanificacion(preProductoId: number): string {
  return this.estadosPlanificacion.get(preProductoId) || 'Sin planificación';
}


  // ✅ NUEVO: Verificar si un estado está cargando
  estaEstadoCargando(preProductoId: number): boolean {
    return this.estadosEnCarga.has(preProductoId);
  }

  // ================ AGREGAR/ELIMINAR PLANIFICACIÓN MEJORADO ================
  agregarPlanificacion(): void {
    if (!this.validarNuevaPlanificacion()) {
      return;
    }

    this.preMaquinariaService.verificarPlanificacion(
      this.preProductoSeleccionado!.id,
      this.nuevaPlanificacion.maquinariaId
    ).subscribe({
      next: (existe) => {
        if (existe.existe) {
          Swal.fire('Advertencia', 'Ya existe una planificación para esta maquinaria', 'warning');
          return;
        }

        this.nuevaPlanificacion.preProductoId = this.preProductoSeleccionado!.id;
        this.preMaquinariaService.crear(this.nuevaPlanificacion).subscribe({
          next: (data) => {
            Swal.fire('Éxito', 'Planificación agregada correctamente', 'success');
            
            const preProductoId = this.preProductoSeleccionado!.id;
            
            // Recargar planificaciones del modal
            this.cargarPlanificacionesActuales(preProductoId);
            this.cargarResumenPlanificacion(preProductoId);
            
            // ✅ Actualizar estado con delay para evitar conflictos
            setTimeout(() => {
              this.actualizarEstadoProducto(preProductoId);
            }, 500);
            
            this.resetNuevaPlanificacion();
          },
          error: (error) => {
            console.error('Error al crear planificación:', error);
            Swal.fire('Error', 'No se pudo agregar la planificación', 'error');
          }
        });
      },
      error: (error) => {
        console.error('Error al verificar planificación:', error);
        Swal.fire('Error', 'Error al verificar la planificación existente', 'error');
      }
    });
  }

  eliminarPlanificacion(planificacionId: number): void {
    Swal.fire({
      title: '¿Eliminar planificación?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.preMaquinariaService.eliminar(planificacionId).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'Planificación eliminada correctamente', 'success');
            
            const preProductoId = this.preProductoSeleccionado!.id;
            
            // Recargar planificaciones del modal
            this.cargarPlanificacionesActuales(preProductoId);
            this.cargarResumenPlanificacion(preProductoId);
            
            // ✅ Actualizar estado con delay para evitar conflictos
            setTimeout(() => {
              this.actualizarEstadoProducto(preProductoId);
            }, 500);
          },
          error: (error) => {
            console.error('Error al eliminar planificación:', error);
            Swal.fire('Error', 'No se pudo eliminar la planificación', 'error');
          }
        });
      }
    });
  }

  // ================ UTILIDADES ================
  validarPreProducto(preProducto: any): boolean {
    if (!preProducto.nombre || preProducto.nombre.trim() === '') {
      Swal.fire('Error', 'El nombre es obligatorio', 'error');
      return false;
    }
    if (!preProducto.descripcion || preProducto.descripcion.trim() === '') {
      Swal.fire('Error', 'La descripción es obligatoria', 'error');
      return false;
    }
    if (preProducto.stock < 0) {
      Swal.fire('Error', 'El stock no puede ser negativo', 'error');
      return false;
    }
    if (!preProducto.tiempo || preProducto.tiempo.trim() === '') {
      Swal.fire('Error', 'El tiempo es obligatorio', 'error');
      return false;
    }
    return true;
  }

  validarNuevaPlanificacion(): boolean {
    if (!this.nuevaPlanificacion.maquinariaId || this.nuevaPlanificacion.maquinariaId === 0) {
      Swal.fire('Error', 'Debe seleccionar una maquinaria', 'error');
      return false;
    }
    if (!this.nuevaPlanificacion.cantidad || this.nuevaPlanificacion.cantidad <= 0) {
      Swal.fire('Error', 'La cantidad debe ser mayor a 0', 'error');
      return false;
    }
    if (!this.nuevaPlanificacion.descripcion || this.nuevaPlanificacion.descripcion.trim() === '') {
      Swal.fire('Error', 'La descripción es obligatoria', 'error');
      return false;
    }
    if (!this.nuevaPlanificacion.tiempoEstimado || this.nuevaPlanificacion.tiempoEstimado.trim() === '') {
      Swal.fire('Error', 'El tiempo estimado es obligatorio', 'error');
      return false;
    }
    return true;
  }

  resetNuevaPlanificacion(): void {
    this.nuevaPlanificacion = {
      cantidad: 1,
      descripcion: '',
      tiempoEstimado: '',
      maquinariaId: 0,
      preProductoId: 0
    };
  }

  obtenerNombreMaquinaria(maquinariaId: number): String {
    const maquinaria = this.maquinarias.find(m => m.id === maquinariaId);
    return maquinaria ? maquinaria.nombre : 'Desconocida';
  }

  // ================ FUNCIONES ADICIONALES ================
  duplicarPlanificacion(preProductoOrigen: PreProducto): void {
    const opcionesProductos = this.preProductos
      .filter(p => p.id !== preProductoOrigen.id)
      .map(p => ({ value: p.id.toString(), text: p.nombre }));

    if (opcionesProductos.length === 0) {
      Swal.fire('Info', 'No hay otros pre-productos disponibles para duplicar', 'info');
      return;
    }

    Swal.fire({
      title: 'Duplicar Planificación',
      text: `Seleccione el pre-producto destino para duplicar las planificaciones de "${preProductoOrigen.nombre}"`,
      input: 'select',
      inputOptions: opcionesProductos.reduce((acc, curr) => {
        acc[curr.value] = curr.text;
        return acc;
      }, {} as any),
      inputPlaceholder: 'Seleccione pre-producto destino',
      showCancelButton: true,
      confirmButtonText: 'Duplicar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const preProductoDestinoId = parseInt(result.value);
        this.preMaquinariaService.duplicarPlanificacion(preProductoOrigen.id, preProductoDestinoId).subscribe({
          next: (data) => {
            Swal.fire('Éxito', `Se duplicaron ${data.length} planificaciones`, 'success');
            // ✅ Actualizar estado con delay
            setTimeout(() => {
              this.actualizarEstadoProducto(preProductoDestinoId);
            }, 500);
          },
          error: (error) => {
            console.error('Error al duplicar planificación:', error);
            Swal.fire('Error', 'No se pudo duplicar la planificación', 'error');
          }
        });
      }
    });
  }


exportarResumen(preProducto: PreProducto): void {
  this.preProductoService.verificarPlanificacionCompleta(preProducto.id).subscribe({
    next: (resumen) => {
      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.text(`Resumen de Planificación`, 14, 20);

      autoTable(doc, {
        startY: 30,
        head: [['Campo', 'Valor']],
        body: [
          ['PreProducto', resumen.preProducto],
          ['¿Planificación completa?', resumen.planificacionCompleta ? 'Sí' : 'No'],
          ['Total de maquinarias', resumen.totalMaquinarias.toString()],
          ['Tiempo total estimado', `${resumen.tiempoTotalEstimado} horas`],
        ],
      });

      doc.save(`Resumen_${resumen.preProducto}.pdf`);
    },
    error: (error) => {
      console.error('Error al obtener resumen:', error);
      Swal.fire('Error', 'No se pudo exportar el resumen', 'error');
    }
  });
}


  toggleDropdown(productId: number | null): void {
    if (this.dropdownOpen === productId) {
      this.dropdownOpen = null;
    } else {
      this.dropdownOpen = productId;
    }
  }
}