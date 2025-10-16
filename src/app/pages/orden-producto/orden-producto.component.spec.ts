import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdenProductoComponent } from './orden-producto.component';

describe('OrdenProductoComponent', () => {
  let component: OrdenProductoComponent;
  let fixture: ComponentFixture<OrdenProductoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrdenProductoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrdenProductoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
