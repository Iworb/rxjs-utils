import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UntilDestroyedExampleComponent } from './until-destroyed-example.component';

describe('UntilDestroyedExampleComponent', () => {
  let component: UntilDestroyedExampleComponent;
  let fixture: ComponentFixture<UntilDestroyedExampleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UntilDestroyedExampleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UntilDestroyedExampleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
