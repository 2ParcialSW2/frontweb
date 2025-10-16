import { TestBed } from '@angular/core/testing';

import { PrePlanoService } from './pre-plano.service';

describe('PrePlanoService', () => {
  let service: PrePlanoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PrePlanoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
