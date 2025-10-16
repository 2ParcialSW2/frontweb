import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { AsignacionesMaquinariaService } from './asignaciones-maquinaria.service';

describe('AsignacionesMaquinariaService', () => {
  let service: AsignacionesMaquinariaService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(AsignacionesMaquinariaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
}); 