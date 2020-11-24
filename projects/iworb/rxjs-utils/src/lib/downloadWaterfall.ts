import { HttpClient, HttpEventType, HttpRequest, HttpResponse } from '@angular/common/http';
import { concat, from, Observable, of } from 'rxjs';
import { catchError, filter, mergeMap, retry, scan, startWith, switchMap } from 'rxjs/operators';

export class DownloadEvent<T> {
  name: string;
  items: T[];
  done: number;
  total: number;
  isComplete: boolean;
  errors: any[];

  get hasErrors(): boolean {
    return (this.errors?.length ?? 0) > 0;
  }

  get progress(): number {
    return this.total ? this.done / this.total : 0;
  }

  constructor(payload?: { name?: string; items?: T[]; done?: number; total?: number; isComplete?: boolean, errors?: any[] }) {
    this.name = payload?.name ?? '';
    this.items = payload?.items ?? [];
    this.done = payload?.done ?? 0;
    this.total = payload?.total ?? 0;
    this.isComplete = payload?.isComplete ?? false;
    this.errors = payload?.errors ?? [];
  }
}

/**
 * Download multiple requests with progress and error catching
 * @param name Collection name
 * @param http Http service to handle requests
 * @param requests List of requests
 * @param options Options to tune download
 *   `concurrentCount` - set maximum of requests which perform at the same time
 *   `retryOnError` - set count of retries if request had error
 */
export function download<T>(
  name: string, http: HttpClient,
  requests: HttpRequest<T>[],
  options?: { concurrentCount?: number, retryOnError?: number }
): Observable<DownloadEvent<T>> {
  if (requests && requests.length) {
    return from(
      requests.map((req, idx) => {
        return http.request(req).pipe(
          filter(res => res.type === HttpEventType.Response),
          retry((options?.retryOnError ?? -1) >= 0 ? options.retryOnError : 2),
          catchError((err) => of([idx, 'error', err])),
          switchMap((res: HttpResponse<T> | any[]) =>
            Array.isArray(res) ? of(res) : of([idx, 'result', res.body])),
        );
      })
    ).pipe(
      mergeMap(req => req, (options?.concurrentCount ?? 1) > 1 ? options.concurrentCount : 1),
      startWith(
        new DownloadEvent<T>({
          name,
          items: [],
          done: 0,
          total: requests.length,
          isComplete: false,
          errors: [],
        }),
      ),
      scan((acc: DownloadEvent<any>, curr: any[]) => {
        const items = [...acc.items];
        const errors = [...acc.errors];
        if (curr[1] === 'error') {
          errors[curr[0]] = curr[2];
          items[curr[0]] = undefined;
        } else {
          items[curr[0]] = curr[2];
        }
        const itLength = items.filter((it) => !!it).length;
        return new DownloadEvent<any>({
          name,
          items,
          done: itLength,
          total: requests.length,
          isComplete: items.length === requests.length,
          errors,
        });
      })
    );
  } else {
    return of(
      new DownloadEvent<T>({
        name,
        items: [],
        done: 0,
        total: 0,
        isComplete: true,
      })
    );
  }
}

/**
 * Download unknown count of requests with progress and error catching
 * @param name Collection name
 * @param createRequest Function to create request which returns array of items
 * @param nextStep Function to modify payload
 * @param payload Initial payload
 * @param options Options to tune download
 *   `retryOnError` - set count of retries if request had error
 */
export function downloadWaterfall<T, R>(
  name: string,
  createRequest: (payload?: R) => Observable<T[]>,
  nextStep: (payload?: R) => R,
  payload?: R,
  options?: { retryOnError?: number }
): Observable<DownloadEvent<T>> {
  const f = (p) => {
    const pl = nextStep(p);
    return createRequest(p).pipe(
      retry((options?.retryOnError ?? -1) >= 0 ? options.retryOnError : 2),
      catchError((err) => of(['error', err])),
      mergeMap((resItems: T[] | any[]) =>
        resItems.length > 0
        ? concat(
          resItems[0] === 'error' ? of(resItems) : of(['result', resItems]),
          f(pl)
        )
        : of(['complete'])
      ),
    );
  };
  return f(payload).pipe(
    startWith(
      new DownloadEvent<T>({
        name,
        items: [],
        done: 0,
        total: 0,
        isComplete: false,
        errors: [],
      })
    ),
    scan((acc: DownloadEvent<T>, curr: any[]) => {
      const items = [...acc.items];
      const errors = [...acc.errors];
      let isComplete = acc.isComplete;
      switch (curr[0]) {
        case 'error':
          errors.push(curr[1]);
          break;
        case 'result':
          items.push(...curr[1]);
          break;
        case 'complete':
          isComplete = true;
          break;
      }
      return new DownloadEvent<any>({
        name,
        items,
        done: items.length,
        total: isComplete ? items.length : 0,
        isComplete,
        errors,
      });
    })
  );
}
