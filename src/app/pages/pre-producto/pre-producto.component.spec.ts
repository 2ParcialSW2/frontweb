import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreProductoComponent } from './pre-producto.component';

describe('PreProductoComponent', () => {
  let component: PreProductoComponent;
  let fixture: ComponentFixture<PreProductoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreProductoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PreProductoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
