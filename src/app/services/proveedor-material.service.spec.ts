import { TestBed } from '@angular/core/testing';

import { ProveedorMaterialService } from './proveedor-material.service';

describe('ProveedorMaterialService', () => {
  let service: ProveedorMaterialService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProveedorMaterialService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
