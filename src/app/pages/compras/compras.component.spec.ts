import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { ComprasComponent } from './compras.component';
import { ComprasService } from '../../services/compras.service';
import { DetallePedidoCompraService } from '../../services/detalle-pedido-compra.service';
import { ProveedoresService } from '../../services/proveedores.service';
import { MaterialesService } from '../../services/materiales.service';

describe('ComprasComponent', () => {
  let component: ComprasComponent;
  let fixture: ComponentFixture<ComprasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        HttpClientTestingModule,
        ComprasComponent
      ],
      providers: [
        ComprasService,
        DetallePedidoCompraService,
        ProveedoresService,
        MaterialesService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ComprasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
}); 