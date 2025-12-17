import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaContiBancariComponent } from './lista-conti-bancari.component';

describe('ListaContiBancariComponent', () => {
  let component: ListaContiBancariComponent;
  let fixture: ComponentFixture<ListaContiBancariComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListaContiBancariComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaContiBancariComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
