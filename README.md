# RxjsUtils

![](https://img.shields.io/badge/license-MIT-blue.svg)

## Install

You could install this package with `npm i @iworb/rxjs-utils` or `yarn add @iworb/rxjs-utils` 

## Features

### `combineLatestMap`

This function combines map of observables and constants to Object.

Example:

```typescript
const intervalA = interval(500);
const intervalB = interval(1200).pipe(map((value) => value.toString()));
/// This is Observable<{a: number, b: string, c: string}>
const ctx$ = combineLatestMap({
  a: intervalA,
  b: intervalB,
  c: 'constant string'
});
```

## Demo

You could check an online demo of all features [here](https://iworb.github.io/rxjs-utils/).
