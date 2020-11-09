import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RxjsUtilsComponent } from './rxjs-utils.component';

describe('RxjsUtilsComponent', () => {
  let component: RxjsUtilsComponent;
  let fixture: ComponentFixture<RxjsUtilsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RxjsUtilsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RxjsUtilsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
