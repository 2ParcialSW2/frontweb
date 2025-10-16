import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BitacoraService } from '../../services/bitacora.service';
import { Bitacora } from '../../models/bitacora.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-bitacora',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bitacora.component.html',
  styleUrls: ['./bitacora.component.css']
})
export class BitacoraComponent implements OnInit {
  bitacoras: Bitacora[] = [];

  constructor(private bitacoraService: BitacoraService) {}

  ngOnInit(): void {
    this.cargarBitacoras();
  }

  cargarBitacoras(): void {
    Swal.fire({
      title: 'Cargando registros...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.bitacoraService.getBitacoras().subscribe({
      next: (bitacoras) => {
        this.bitacoras = bitacoras;
        Swal.close();
      },
      error: (error) => {
        console.error('Error al cargar registros:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los registros. Por favor, intente nuevamente.'
        });
      }
    });
  }
}
