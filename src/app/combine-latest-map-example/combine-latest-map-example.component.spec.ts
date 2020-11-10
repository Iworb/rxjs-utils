import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CombineLatestMapExampleComponent } from './combine-latest-map-example.component';

describe('CombineLatestMapExampleComponent', () => {
  let component: CombineLatestMapExampleComponent;
  let fixture: ComponentFixture<CombineLatestMapExampleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CombineLatestMapExampleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CombineLatestMapExampleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
