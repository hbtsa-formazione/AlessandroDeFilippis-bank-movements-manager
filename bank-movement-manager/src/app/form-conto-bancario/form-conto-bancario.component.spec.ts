import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormContoBancarioComponent } from './form-conto-bancario.component';

describe('FormContoBancarioComponent', () => {
  let component: FormContoBancarioComponent;
  let fixture: ComponentFixture<FormContoBancarioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FormContoBancarioComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormContoBancarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
