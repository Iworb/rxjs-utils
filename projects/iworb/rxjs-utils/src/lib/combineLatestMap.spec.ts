import { combineLatestMap } from '@iworb/rxjs-utils';
import { cold, getTestScheduler, hot } from 'jasmine-marbles';
import { interval } from 'rxjs';
import { take } from 'rxjs/operators';

describe('combineLatestMap', () => {
  it('should create observable of object of observables and objects', () => {
    const expectedValues = { a: { a: 0, b: 42 }, b: { a: 1, b: 42 }, c: { a: 2, b: 42 }, d: { a: 3, b: 42 }, e: { a: 4, b: 42 } };
    const source = combineLatestMap({
      a: interval(10, getTestScheduler()),
      b: 42,
    }).pipe(take(5));
    const expectedMarble = cold('-abcd(e|)', expectedValues);
    expect(source).toBeObservable(expectedMarble);
  });

  it('should create observable of object of observables', () => {
    const expectedValues = { a: { a: 0 }, b: { a: 1 }, c: { a: 2 }, d: { a: 3 }, e: { a: 4 } };
    const source = combineLatestMap({
      a: interval(10, getTestScheduler())
    }).pipe(take(5));
    const expectedMarble = cold('-abcd(e|)', expectedValues);
    expect(source).toBeObservable(expectedMarble);
  });

  it('should create observable of object of constants (itt won\'t emit anything)', () => {
    const source = combineLatestMap({
      a: 0
    });
    const expectedMarble = cold('(a|)', { a: { a: 0 } });
    expect(source).toBeObservable(expectedMarble);
  });
});
