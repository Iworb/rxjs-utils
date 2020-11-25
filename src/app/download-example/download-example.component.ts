import { HttpClient, HttpRequest } from '@angular/common/http';
import { Component } from '@angular/core';
import { download, DownloadEvent, downloadWaterfall, performObservables } from '@iworb/rxjs-utils';
import { Observable, Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';

class Post {
  id: number;
  userId: number;
  body: string;
  title: string;
}

@Component({
  selector: 'app-download-example',
  templateUrl: './download-example.component.html',
  styleUrls: ['./download-example.component.scss']
})
export class DownloadExampleComponent {

  links = Array.from(
    { length: 20 },
    (v, i) => `https://jsonplaceholder.typicode.com/posts/${i + 1}`
  );
  fixedRequests = this.links.map((link) => new HttpRequest<Post>('GET', link));
  linksWithError = Array.from(
    { length: 20 },
    (v, i) =>
      i === 2 ? `https://jsonplaceholder.typicode.com/pops/` : `https://jsonplaceholder.typicode.com/posts/${i + 1}`
  );
  fixedRequestsWithError = this.linksWithError.map((link) => new HttpRequest<Post>('GET', link));

  status$: Observable<DownloadEvent<Post>>;
  stop$ = new Subject<boolean>();

  constructor(private http: HttpClient) {
  }

  private getPosts(): (payload?: { skip?: number, take?: number }) => Observable<Post[]> {
    return (payload?: { skip?: number, take?: number }): Observable<Post[]> => {
      return this.http.get<Post[]>(
        `https://jsonplaceholder.typicode.com/posts?_start=${payload?.skip ?? 0}&_limit=${payload?.take ?? 5}`
      );
    };
  }

  private getPostsWithError(): (payload?: { skip?: number, take?: number }) => Observable<Post[]> {
    return (payload?: { skip?: number, take?: number }): Observable<Post[]> => {
      const name = payload?.skip === 10 ? 'pops' : 'posts';
      return this.http.get<Post[]>(
        `https://jsonplaceholder.typicode.com/${name}?_start=${payload?.skip ?? 0}&_limit=${payload?.take ?? 5}`
      );
    };
  }

  private updatePayload(payload?: { skip?: number, take?: number }): { skip?: number, take?: number } {
    const take = payload?.take ?? 5;
    return { skip: (payload?.skip ?? 0) + take, take };
  }

  downloadObservables(): void {
    this.status$ = performObservables('posts', this.links.map((link) => this.http.get<Post>(link)), { concurrentCount: 5 })
      .pipe(
        takeUntil(this.stop$),
        tap((status) => console.log('status', status))
      );
  }

  downloadFixed(): void {
    this.status$ = download('posts', this.http, this.fixedRequests, { concurrentCount: 5 })
      .pipe(
        takeUntil(this.stop$),
        tap((status) => console.log('status', status))
      );
  }

  downloadUnknown(): void {
    this.status$ = downloadWaterfall('posts', this.getPosts(), this.updatePayload)
      .pipe(
        takeUntil(this.stop$),
        tap((status) => console.log('status', status))
      );
  }

  downloadObservablesError(): void {
    this.status$ = performObservables('posts', this.linksWithError.map((link) => this.http.get<Post>(link)), { concurrentCount: 5 })
      .pipe(
        takeUntil(this.stop$),
        tap((status) => console.log('status', status))
      );
  }

  downloadFixedError(): void {
    this.status$ = download('posts', this.http, this.fixedRequestsWithError)
      .pipe(
        takeUntil(this.stop$),
        tap((status) => console.log('status', status))
      );
  }

  downloadUnknownError(): void {
    this.status$ = downloadWaterfall('posts', this.getPostsWithError(), this.updatePayload, null, { retryOnError: 0 })
      .pipe(
        takeUntil(this.stop$),
        tap((status) => console.log('status', status))
      );
  }

  stop(): void {
    this.stop$.next(true);
  }

}
