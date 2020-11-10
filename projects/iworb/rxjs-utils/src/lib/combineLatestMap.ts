import { combineLatest, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import fromPairs from 'lodash-es/fromPairs';
import unzip from 'lodash-es/unzip';
import zip from 'lodash-es/zip';

type ObservableMap<T> = {
  [P in keyof T]: Observable<T[P]>;
};

type ObservableOrAnyMap<T> = {
  [P in keyof T]: Observable<T[P]> | T[P];
};

export function combineLatestMap<T>(sources: ObservableOrAnyMap<T>): Observable<T> {
  const obs = {} as ObservableMap<T>;
  const vals: object = {};
  Object.keys(sources).forEach((k) => {
    if (Observable.prototype.isPrototypeOf(sources[k])) {
      obs[k] = sources[k];
    } else {
      vals[k] = sources[k];
    }
  });
  const sourceEntries = Object.entries<Observable<any>>(obs);
  const [sourceKeys, sourceValues] = unzip(sourceEntries);

  if (!sourceValues || sourceValues.length < 1) {
    return of(Object.assign({} as T, vals));
  } else {
    return combineLatest(sourceValues).pipe(
      map((values) => Object.assign({} as T, vals, fromPairs(zip(sourceKeys, values)))),
    );
  }
}
