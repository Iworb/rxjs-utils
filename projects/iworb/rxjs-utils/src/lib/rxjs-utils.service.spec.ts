import { TestBed } from '@angular/core/testing';

import { RxjsUtilsService } from './rxjs-utils.service';

describe('RxjsUtilsService', () => {
  let service: RxjsUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RxjsUtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
