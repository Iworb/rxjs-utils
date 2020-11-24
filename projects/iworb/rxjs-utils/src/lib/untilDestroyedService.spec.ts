import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UntilDestroyedService } from './untilDestroyedService';

@Component({
  selector: 'lib-test',
  template: '',
  providers: [UntilDestroyedService]
})
export class TestComponent {}

describe('untilDestroyedService', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and provide UntilDestroyedService', () => {
    expect(component).toBeTruthy();
    expect(fixture.debugElement.injector.get(UntilDestroyedService)).toBeTruthy();
  });

  it('should destroy on component destroy', () => {
    const s = fixture.debugElement.injector.get(UntilDestroyedService);
    const completeSpy = spyOn(s, 'complete');
    fixture.destroy();
    expect(completeSpy).toHaveBeenCalled();
  });
});
