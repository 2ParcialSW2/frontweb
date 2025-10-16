import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrePlanoComponent } from './pre-plano.component';

describe('PrePlanoComponent', () => {
  let component: PrePlanoComponent;
  let fixture: ComponentFixture<PrePlanoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrePlanoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrePlanoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
