import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DetallePedidoCompraService } from './detalle-pedido-compra.service';

describe('DetallePedidoCompraService', () => {
  let service: DetallePedidoCompraService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DetallePedidoCompraService]
    });
    service = TestBed.inject(DetallePedidoCompraService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
}); 