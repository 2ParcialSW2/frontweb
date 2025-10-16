import { TestBed } from '@angular/core/testing';

import { ImgDropService } from './img-drop.service';

describe('ImgDropService', () => {
  let service: ImgDropService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImgDropService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
