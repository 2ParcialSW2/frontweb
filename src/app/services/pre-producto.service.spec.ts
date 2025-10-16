import { TestBed } from '@angular/core/testing';

import { PreProductoService } from './pre-producto.service';

describe('PreProductoService', () => {
  let service: PreProductoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PreProductoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
