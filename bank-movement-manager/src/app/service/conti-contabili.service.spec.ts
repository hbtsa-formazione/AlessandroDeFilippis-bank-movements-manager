import { TestBed } from '@angular/core/testing';

import { ContiContabiliService } from './conti-contabili.service';

describe('ContiContabiliService', () => {
  let service: ContiContabiliService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ContiContabiliService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
