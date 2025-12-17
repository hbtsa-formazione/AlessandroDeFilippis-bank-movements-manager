import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormMovimentoComponent } from './form-movimento.component';

describe('FormMovimentoComponent', () => {
  let component: FormMovimentoComponent;
  let fixture: ComponentFixture<FormMovimentoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FormMovimentoComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormMovimentoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
