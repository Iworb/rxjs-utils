import { Component, EventEmitter, Output, Self } from '@angular/core';
import { UntilDestroyedService } from '@iworb/rxjs-utils';
import { interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-until-destroyed',
  templateUrl: './until-destroyed.component.html',
  styleUrls: ['./until-destroyed.component.scss'],
  providers: [UntilDestroyedService]
})
export class UntilDestroyedComponent {
  public value: number;

  @Output() message = new EventEmitter<string>();

  constructor(@Self() private destroyed$: UntilDestroyedService) {
    interval(1000)
      .pipe(takeUntil(this.destroyed$))
      .subscribe((v) => {
        this.value = v;
        this.message.emit(v.toString());
      });
  }
}
