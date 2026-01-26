import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabellaContiComponent } from './tabella-conti.component';

describe('TabellaContiComponent', () => {
  let component: TabellaContiComponent;
  let fixture: ComponentFixture<TabellaContiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TabellaContiComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TabellaContiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
