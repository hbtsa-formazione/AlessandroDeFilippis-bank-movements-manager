import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaMovimentiComponent } from './lista-movimenti.component';

describe('ListaMovimentiComponent', () => {
  let component: ListaMovimentiComponent;
  let fixture: ComponentFixture<ListaMovimentiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListaMovimentiComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaMovimentiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
