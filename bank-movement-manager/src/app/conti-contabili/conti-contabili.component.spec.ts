import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContiContabiliComponent } from './conti-contabili.component';

describe('ContiContabiliComponent', () => {
  let component: ContiContabiliComponent;
  let fixture: ComponentFixture<ContiContabiliComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ContiContabiliComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContiContabiliComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
