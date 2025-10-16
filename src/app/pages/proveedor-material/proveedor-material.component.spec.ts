import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProveedorMaterialComponent } from './proveedor-material.component';

describe('ProveedorMaterialComponent', () => {
  let component: ProveedorMaterialComponent;
  let fixture: ComponentFixture<ProveedorMaterialComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProveedorMaterialComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProveedorMaterialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
