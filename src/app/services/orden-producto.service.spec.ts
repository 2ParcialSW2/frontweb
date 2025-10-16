import { TestBed } from '@angular/core/testing';

import { OrdenProductoService } from './orden-producto.service';

describe('OrdenProductoService', () => {
  let service: OrdenProductoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrdenProductoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
