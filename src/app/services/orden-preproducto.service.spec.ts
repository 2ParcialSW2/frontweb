import { TestBed } from '@angular/core/testing';

import { OrdenPreproductoService } from './orden-preproducto.service';

describe('OrdenPreproductoService', () => {
  let service: OrdenPreproductoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrdenPreproductoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
