import {
  HTTP_INTERCEPTORS,
  HttpClient,
  HttpClientModule,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { cold } from 'jasmine-marbles';
import { Observable, of, throwError } from 'rxjs';
import { dematerialize, materialize, mergeMap } from 'rxjs/operators';
import { download, DownloadEvent, downloadWaterfall, performObservables } from './downloadWaterfall';

@Injectable()
export class MockInterceptor implements HttpInterceptor {

  static readonly STRINGS_TOTAL = 20.0;

  constructor() {
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {


    return of(null).pipe(
      mergeMap(() => {
        if (request.url.startsWith('posts_e') && request.method === 'GET') {
          const matches = request.url.match(/posts_e\/(.*)\/?$/);
          return matches[1] === '1' ? throwError({
            code: '400',
            status: 400,
            message: 'Error',
          }) : of(new HttpResponse({
            status: 200,
            body: matches[1]
          }));
        }
        if (request.url.startsWith('posts') && request.method === 'GET') {
          const matches = request.url.match(/posts\/(.*)\/?$/);
          return of(new HttpResponse({
            status: 200,
            body: matches[1]
          }));
        }
        if (request.url.startsWith('strings_e') && request.method === 'GET') {
          return throwError({
            code: '400',
            status: 400,
            message: 'Error',
          });
        }
        if (request.url.startsWith('strings') && request.method === 'GET') {
          const skip = request.params.has('skip') ? Number.parseInt(request.params.get('skip'), 10) : 0;
          const take = request.params.has('take') ? Number.parseInt(request.params.get('take'), 10) : 5;
          return of(new HttpResponse({
            status: 200,
            body: Array.from({ length: take }, (v, i) => skip + i + 1)
              .filter((it) => it <= MockInterceptor.STRINGS_TOTAL)
              .map((it) => it.toString())
          }));
        }
        return next.handle(request);
      }),
      materialize(),
      dematerialize()
    );
  }
}

export function getMarbleString(total: number): string {
  return '(' + Array.from({ length: total + 1 }, (_, i) => String.fromCharCode(97 + i)).join('') + '|)';
}

export const eventsToMarbleReducer = (prev, cur, idx) => ({
  ...prev,
  [String.fromCharCode(97 + idx)]: cur
});

describe('DownloadEvent', () => {
  it('hasErrors should return valid value', () => {
    const e1 = new DownloadEvent();
    expect(e1.hasErrors).toBeFalse();
    const e2 = new DownloadEvent({ errors: [{}] });
    expect(e2.hasErrors).toBeTrue();
    const e3 = new DownloadEvent();
    e3.errors = null;
    expect(e3.hasErrors).toBeFalse();
  });

  it('should calculate progress', () => {
    const e1 = new DownloadEvent();
    expect(e1.progress).toBe(0);
    e1.done = 100;
    expect(e1.progress).toBe(0);
    e1.total = 5;
    expect(e1.progress).toBe(100 / 5);
  });
});

describe('download', () => {

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientModule],
      providers: [
        {
          provide: HTTP_INTERCEPTORS,
          useClass: MockInterceptor,
          multi: true
        }
      ]
    })
      .compileComponents();
  });

  it('should download requests without errors', () => {
    const total = 5;
    const fixedRequests = Array.from(
      { length: total },
      (v, i) =>
        new HttpRequest<any>(
          'GET',
          `posts/${i + 1}`
        )
    );
    const http = TestBed.inject(HttpClient);
    const expectedEvents = Array.from(
      { length: total + 1 },
      (v, i) =>
        new DownloadEvent({
          name: 'posts',
          items: Array.from({ length: i }, (vv, ii) => (ii + 1).toString()),
          done: i,
          total,
          isComplete: i === total,
          errors: [],
        })
    );
    const marblesString = getMarbleString(total);
    const marblesValues = expectedEvents.reduce(eventsToMarbleReducer, {});
    const expectedMarbles = cold(marblesString, marblesValues);
    expect(download('posts', http, fixedRequests)).toBeObservable(expectedMarbles);
  });

  it('should download requests with errors', () => {
    const total = 5;
    const fixedRequests = Array.from(
      { length: total },
      (v, i) =>
        new HttpRequest<any>(
          'GET',
          `posts_e/${i + 1}`
        )
    );
    const http = TestBed.inject(HttpClient);
    const expectedEvents = Array.from(
      { length: total + 1 },
      (v, i) =>
        new DownloadEvent({
          name: 'posts',
          items: Array.from({ length: i }, (vv, ii) => (ii + 1).toString()),
          done: i > 0 ? i - 1 : i,
          total,
          isComplete: i === total,
          errors: i >= 1 ? [{ code: '400', status: 400, message: 'Error' }] : [],
        })
    );
    expectedEvents.forEach((evt, idx) => {
      if (idx > 0) {
        evt.items[0] = undefined;
      }
    });
    const marblesString = getMarbleString(total);
    const marblesValues = expectedEvents.reduce(eventsToMarbleReducer, {});
    const expectedMarbles = cold(marblesString, marblesValues);
    expect(download('posts', http, fixedRequests)).toBeObservable(expectedMarbles);
  });

  it('should retry exactly times', () => {
    const total = 5;
    const fixedRequests = Array.from(
      { length: total },
      (v, i) =>
        new HttpRequest<any>(
          'GET',
          `posts_e/${i + 1}`
        )
    );
    const http = TestBed.inject(HttpClient);
    const mockInterceptor = TestBed.inject(HTTP_INTERCEPTORS);
    const spyOnIntercept = spyOn(mockInterceptor[0], 'intercept').and.callThrough();
    const expectedEvents = Array.from(
      { length: total + 1 },
      (v, i) =>
        new DownloadEvent({
          name: 'posts',
          items: Array.from({ length: i }, (vv, ii) => (ii + 1).toString()),
          done: i > 0 ? i - 1 : i,
          total,
          isComplete: i === total,
          errors: i >= 1 ? [{ code: '400', status: 400, message: 'Error' }] : [],
        })
    );
    expectedEvents.forEach((evt, idx) => {
      if (idx > 0) {
        evt.items[0] = undefined;
      }
    });
    const marblesString = getMarbleString(total);
    const marblesValues = expectedEvents.reduce(eventsToMarbleReducer, {});
    const expectedMarbles = cold(marblesString, marblesValues);
    expect(download('posts', http, fixedRequests, { retryOnError: 5, concurrentCount: 2 })).toBeObservable(expectedMarbles);
    expect(spyOnIntercept.calls.count()).toBe(total + 5);
  });

  it('empty requests download', () => {
    const http = TestBed.inject(HttpClient);
    const marblesString = getMarbleString(0);
    const marblesValues = {
      a: new DownloadEvent({
        name: 'posts',
        items: [],
        done: 0,
        total: 0,
        isComplete: true,
      })
    };
    const expectedMarbles = cold(marblesString, marblesValues);
    expect(download('posts', http, [])).toBeObservable(expectedMarbles);
  });
});

describe('performObservables', () => {

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientModule],
      providers: [
        {
          provide: HTTP_INTERCEPTORS,
          useClass: MockInterceptor,
          multi: true
        }
      ]
    })
      .compileComponents();
  });

  it('should perform without errors', () => {
    const total = 5;
    const links = Array.from(
      { length: total },
      (v, i) => `posts/${i + 1}`
    );
    const http = TestBed.inject(HttpClient);
    const observables = links.map((link) => http.get<any>(link));
    const expectedEvents = Array.from(
      { length: total + 1 },
      (v, i) =>
        new DownloadEvent({
          name: 'posts',
          items: Array.from({ length: i }, (vv, ii) => (ii + 1).toString()),
          done: i,
          total,
          isComplete: i === total,
          errors: [],
        })
    );
    const marblesString = getMarbleString(total);
    const marblesValues = expectedEvents.reduce(eventsToMarbleReducer, {});
    const expectedMarbles = cold(marblesString, marblesValues);
    expect(performObservables('posts', observables)).toBeObservable(expectedMarbles);
  });

  it('should perform with errors', () => {
    const total = 5;
    const links = Array.from(
      { length: total },
      (v, i) => `posts_e/${i + 1}`
    );
    const http = TestBed.inject(HttpClient);
    const observables = links.map((link) => http.get<any>(link));
    const expectedEvents = Array.from(
      { length: total + 1 },
      (v, i) =>
        new DownloadEvent({
          name: 'posts',
          items: Array.from({ length: i }, (vv, ii) => (ii + 1).toString()),
          done: i > 0 ? i - 1 : i,
          total,
          isComplete: i === total,
          errors: i >= 1 ? [{ code: '400', status: 400, message: 'Error' }] : [],
        })
    );
    expectedEvents.forEach((evt, idx) => {
      if (idx > 0) {
        evt.items[0] = undefined;
      }
    });
    const marblesString = getMarbleString(total);
    const marblesValues = expectedEvents.reduce(eventsToMarbleReducer, {});
    const expectedMarbles = cold(marblesString, marblesValues);
    expect(performObservables('posts', observables)).toBeObservable(expectedMarbles);
  });

  it('should retry exactly times', () => {
    const total = 5;
    const links = Array.from(
      { length: total },
      (v, i) => `posts_e/${i + 1}`
    );
    const http = TestBed.inject(HttpClient);
    const observables = links.map((link) => http.get<any>(link));
    const mockInterceptor = TestBed.inject(HTTP_INTERCEPTORS);
    const spyOnIntercept = spyOn(mockInterceptor[0], 'intercept').and.callThrough();
    const expectedEvents = Array.from(
      { length: total + 1 },
      (v, i) =>
        new DownloadEvent({
          name: 'posts',
          items: Array.from({ length: i }, (vv, ii) => (ii + 1).toString()),
          done: i > 0 ? i - 1 : i,
          total,
          isComplete: i === total,
          errors: i >= 1 ? [{ code: '400', status: 400, message: 'Error' }] : [],
        })
    );
    expectedEvents.forEach((evt, idx) => {
      if (idx > 0) {
        evt.items[0] = undefined;
      }
    });
    const marblesString = getMarbleString(total);
    const marblesValues = expectedEvents.reduce(eventsToMarbleReducer, {});
    const expectedMarbles = cold(marblesString, marblesValues);
    expect(performObservables('posts', observables, { retryOnError: 5, concurrentCount: 2 })).toBeObservable(expectedMarbles);
    expect(spyOnIntercept.calls.count()).toBe(total + 5);
  });

  it('empty perform download', () => {
    const marblesString = getMarbleString(0);
    const marblesValues = {
      a: new DownloadEvent({
        name: 'posts',
        items: [],
        done: 0,
        total: 0,
        isComplete: true,
      })
    };
    const expectedMarbles = cold(marblesString, marblesValues);
    expect(performObservables('posts', [])).toBeObservable(expectedMarbles);
  });
});

describe('downloadWaterfall', () => {

  const pageSize = 5.0;

  function getStrings(http: HttpClient): (payload?: { skip?: number, take?: number }) => Observable<string[]> {
    return (payload?: { skip?: number, take?: number }): Observable<string[]> => {
      return http.get<string[]>(
        'strings',
        {
          params: {
            skip: (payload?.skip ?? 0).toString(),
            take: (payload?.take ?? pageSize).toString()
          }
        }
      );
    };
  }

  function getStringsWithError(http: HttpClient): (payload?: { skip?: number, take?: number }) => Observable<string[]> {
    return (payload?: { skip?: number, take?: number }): Observable<string[]> => {
      return http.get<string[]>(
        (payload?.skip ?? 0) === 0 ? 'strings_e' : 'strings',
        {
          params: {
            skip: (payload?.skip ?? 0).toString(),
            take: (payload?.take ?? pageSize).toString()
          }
        }
      );
    };
  }

  function updatePayload(payload?: { skip?: number, take?: number }): { skip?: number, take?: number } {
    const take = payload?.take ?? pageSize;
    return { skip: (payload?.skip ?? 0) + take, take };
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientModule],
      providers: [
        {
          provide: HTTP_INTERCEPTORS,
          useClass: MockInterceptor,
          multi: true
        }
      ]
    })
      .compileComponents();
  });

  it('should download requests without errors', () => {
    const http = TestBed.inject(HttpClient);
    // count of request with empty ones
    const requests = Math.ceil(MockInterceptor.STRINGS_TOTAL / pageSize) + 1;
    // count of events
    const total = requests + 1;
    const expectedEvents = Array.from({ length: total }, (v, i) => {
      if (i === 0) {
        return new DownloadEvent({
          name: 'strings',
          items: [],
          done: 0,
          total: 0,
          isComplete: false,
          errors: [],
        });
      } else if (i === total - 1) {
        return new DownloadEvent({
          name: 'strings',
          items: Array.from({ length: MockInterceptor.STRINGS_TOTAL }, (vv, ii) => (ii + 1).toString()),
          done: MockInterceptor.STRINGS_TOTAL,
          total: MockInterceptor.STRINGS_TOTAL,
          isComplete: true,
          errors: [],
        });
      } else {
        const done = Math.min(i * pageSize, MockInterceptor.STRINGS_TOTAL);
        return new DownloadEvent({
          name: 'strings',
          items: Array.from({ length: done },
            (vv, ii) => (ii + 1).toString()),
          done,
          total: 0,
          isComplete: false,
          errors: [],
        });
      }
    });
    const marblesString = getMarbleString(total - 1);
    const marblesValues = expectedEvents.reduce(eventsToMarbleReducer, {});
    const expectedMarbles = cold(marblesString, marblesValues);
    expect(downloadWaterfall('strings', getStrings(http), updatePayload)).toBeObservable(expectedMarbles);
  });

  it('should download requests with errors', () => {
    const http = TestBed.inject(HttpClient);
    // count of request with empty ones
    const requests = Math.ceil(MockInterceptor.STRINGS_TOTAL / pageSize) + 1;
    // count of events
    const total = requests + 1;
    const expectedEvents = Array.from({ length: total }, (v, i) => {
      if (i === 0) {
        return new DownloadEvent({
          name: 'strings',
          items: [],
          done: 0,
          total: 0,
          isComplete: false,
          errors: [],
        });
      } else if (i === 1) {
        return new DownloadEvent({
          name: 'strings',
          items: [],
          done: 0,
          total: 0,
          isComplete: false,
          errors: [{ code: '400', status: 400, message: 'Error' }],
        });
      } else if (i === total - 1) {
        return new DownloadEvent({
          name: 'strings',
          items: Array.from({ length: MockInterceptor.STRINGS_TOTAL }, (vv, ii) => (ii + 1).toString()).slice(5),
          done: MockInterceptor.STRINGS_TOTAL - pageSize,
          total: MockInterceptor.STRINGS_TOTAL - pageSize,
          isComplete: true,
          errors: [{ code: '400', status: 400, message: 'Error' }],
        });
      } else {
        const done = Math.min(i * pageSize, MockInterceptor.STRINGS_TOTAL);
        return new DownloadEvent({
          name: 'strings',
          items: Array.from({ length: done }, (vv, ii) => (ii + 1).toString()).slice(5),
          done: done - pageSize,
          total: 0,
          isComplete: false,
          errors: [{ code: '400', status: 400, message: 'Error' }],
        });
      }
    });
    const marblesString = getMarbleString(total - 1);
    const marblesValues = expectedEvents.reduce(eventsToMarbleReducer, {});
    const expectedMarbles = cold(marblesString, marblesValues);
    expect(downloadWaterfall('strings', getStringsWithError(http), updatePayload)).toBeObservable(expectedMarbles);
  });

  it('should retry exact times', () => {
    const http = TestBed.inject(HttpClient);
    // count of request with empty ones
    const requests = Math.ceil(MockInterceptor.STRINGS_TOTAL / pageSize) + 1;
    // count of events
    const total = requests + 1;
    const expectedEvents = Array.from({ length: total }, (v, i) => {
      if (i === 0) {
        return new DownloadEvent({
          name: 'strings',
          items: [],
          done: 0,
          total: 0,
          isComplete: false,
          errors: [],
        });
      } else if (i === 1) {
        return new DownloadEvent({
          name: 'strings',
          items: [],
          done: 0,
          total: 0,
          isComplete: false,
          errors: [{ code: '400', status: 400, message: 'Error' }],
        });
      } else if (i === total - 1) {
        return new DownloadEvent({
          name: 'strings',
          items: Array.from({ length: MockInterceptor.STRINGS_TOTAL }, (vv, ii) => (ii + 1).toString()).slice(5),
          done: MockInterceptor.STRINGS_TOTAL - pageSize,
          total: MockInterceptor.STRINGS_TOTAL - pageSize,
          isComplete: true,
          errors: [{ code: '400', status: 400, message: 'Error' }],
        });
      } else {
        const done = Math.min(i * pageSize, MockInterceptor.STRINGS_TOTAL);
        return new DownloadEvent({
          name: 'strings',
          items: Array.from({ length: done }, (vv, ii) => (ii + 1).toString()).slice(5),
          done: done - pageSize,
          total: 0,
          isComplete: false,
          errors: [{ code: '400', status: 400, message: 'Error' }],
        });
      }
    });
    const mockInterceptor = TestBed.inject(HTTP_INTERCEPTORS);
    const spyOnIntercept = spyOn(mockInterceptor[0], 'intercept').and.callThrough();
    const marblesString = getMarbleString(total - 1);
    const marblesValues = expectedEvents.reduce(eventsToMarbleReducer, {});
    const expectedMarbles = cold(marblesString, marblesValues);
    expect(downloadWaterfall('strings', getStringsWithError(http), updatePayload, null, { retryOnError: 5 }))
      .toBeObservable(expectedMarbles);
    expect(spyOnIntercept.calls.count()).toBe(requests + 5);
  });

});
