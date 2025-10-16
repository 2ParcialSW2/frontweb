import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { MaquinariasService } from './maquinarias.service';

describe('MaquinariasService', () => {
  let service: MaquinariasService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(MaquinariasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
}); 