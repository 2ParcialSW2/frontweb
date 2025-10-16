import { TestBed } from '@angular/core/testing';

import { PreMaquinariaService } from './pre-maquinaria.service';

describe('PreMaquinariaService', () => {
  let service: PreMaquinariaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PreMaquinariaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
