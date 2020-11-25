# RxjsUtils

![](https://img.shields.io/badge/license-MIT-blue.svg)

## Install

You could install this package with `npm i @iworb/rxjs-utils` or `yarn add @iworb/rxjs-utils` 

## Features

### `combineLatestMap`

```typescript
combineLatestMap<T>(sources: ObservableOrAnyMap<T>): Observable<T>
```

This function combines map of observables and constants to Object.

Example:

```typescript
const intervalA = interval(500);
const intervalB = interval(1200).pipe(map((value) => value.toString()));
// This is Observable<{a: number, b: string, c: string}>
const ctx$ = combineLatestMap({
  a: intervalA,
  b: intervalB,
  c: 'constant string'
});
// Output:
// { a: 1, b: '1', c: 'constant string'}
// { a: 2, b: '1', c: 'constant string'}
// { a: 2, b: '2', c: 'constant string'}
// { a: 3, b: '2', c: 'constant string'}
// ...
```

### `download` and `performObservables`, `downloadWaterfall`

```typescript
function download<T>(
  name: string,
  http: HttpClient,
  requests: HttpRequest<T>[],
  options?: { concurrentCount?: number, retryOnError?: number }
): Observable<DownloadEvent<T>> { /* ... */ }

function performObservables<T>(
  name: string,
  observables: Observable<T>[],
  options?: { concurrentCount?: number, retryOnError?: number }
): Observable<DownloadEvent<T>> { /* ... */}

function downloadWaterfall<T, R>(
  name: string,
  createRequest: (payload?: R) => Observable<T[]>,
  nextStep: (payload?: R) => R,
  payload?: R,
  options?: { retryOnError?: number }
): Observable<DownloadEvent<T>> { /* ... */ }
```

This function allows you to perform multiple requests and gather all results with progress per each request.

If you have exact amount of requests - use `download` (or `performObservables` if you have requests as observables), otherwise, when you have to load page by page, use `downloadWaterfall`.

Examples:

```typescript
const links = Array.from(
  { length: 20 },
  (v, i) => `https://jsonplaceholder.typicode.com/posts/${i + 1}`
);
const requests = links.map((link) =>
  new HttpRequest<Post>('GET', link)
);

const status1$ = performObservables(
  'posts',               // just a name for events
   this.links.map((link) => this.http.get<Post>(link)), // observables
  {concurrentCount: 5},  // 5 posts could be loaded at the same time
).subscribe();

const status2$ = download(
  'posts',               // just a name for events
  this.http,             // Angular HttpClient
  this.requests,         // List of requests
  {concurrentCount: 5},  // 5 posts could be loaded at the same time
).subscribe();
```

```typescript
// return function because of bind issues
function getPosts(): (payload?: {skip?: number, take?: number}) => Observable<Post[]> {
  return (payload?: {skip?: number, take?: number}): Observable<Post[]> => {
    return this.http.get<Post[]>(
      `https://jsonplaceholder.typicode.com/posts?_start=${payload?.skip ?? 0}&_limit=${payload?.take ?? 5}`
  );
  }
}

// this function shows how we have to modify our payload to perform next request
function updatePayload(payload?: {skip?: number, take?: number}): {skip?: number, take?: number} {
  const take = payload?.take ?? 5;
  return {skip: (payload?.skip ?? 0) + take, take};
}

const status$ = downloadWaterfall(
  'posts',               // just a name for events
  this.getPosts(),       // function to get items based on payload
  this.updatePayload,    // function to update payload
).subscribe();
```

### `UntilDestroyedService`

This service should be used to unsubscribe when component destroyed

Example:

```typescript
@Component({
  selector: 'lib-test',
  template: '',
  providers: [UntilDestroyedService]
})
export class TestComponent {
  constructor(@Self() private destroyed$: UntilDestroyedService) {
    interval(500)
      .pipe(takeUntil(this.destroyed$))
      .subscribe((c) => console.log('count: ' + c));
  }
}
```

## Demo

You could check an online demo of all features [here](https://iworb.github.io/rxjs-utils/).
