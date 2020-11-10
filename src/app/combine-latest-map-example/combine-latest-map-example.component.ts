import { Component, OnInit } from '@angular/core';
import { combineLatestMap } from '@iworb/rxjs-utils';
import { interval, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-combine-latest-map-example',
  templateUrl: './combine-latest-map-example.component.html',
  styleUrls: ['./combine-latest-map-example.component.scss']
})
export class CombineLatestMapExampleComponent implements OnInit {

  ctx$: Observable<{
    a: number,
    b: string,
    c: string
  }>;

  constructor() {
    const intervalA = interval(500);
    const intervalB = interval(1200).pipe(map((value) => value.toString()));
    this.ctx$ = combineLatestMap({
      a: intervalA,
      b: intervalB,
      c: 'constant string'
    });
  }

  ngOnInit(): void {
  }

}
