import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComprasService } from './compras.service';

describe('ComprasService', () => {
  let service: ComprasService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ComprasService]
    });
    service = TestBed.inject(ComprasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
