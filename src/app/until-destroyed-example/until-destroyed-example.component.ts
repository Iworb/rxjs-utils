import { Component } from '@angular/core';

@Component({
  selector: 'app-until-destroyed-example',
  templateUrl: './until-destroyed-example.component.html',
  styleUrls: ['./until-destroyed-example.component.scss']
})
export class UntilDestroyedExampleComponent {

  showUntilDestroyed = true;
  value = '';

  constructor() {
  }

  updateValue(value: string): void {
    this.value = value;
  }

}
