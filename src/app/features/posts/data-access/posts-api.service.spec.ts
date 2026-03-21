import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { PostsApiService } from './posts-api.service';

describe('PostsApiService', () => {
  let service: PostsApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PostsApiService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(PostsApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('calls the expected posts endpoint and maps the response', async () => {
    const requestPromise = firstValueFrom(service.getPostsByUserId(10));

    const request = httpTestingController.expectOne(
      'https://jsonplaceholder.typicode.com/posts?userId=10',
    );
    expect(request.request.method).toBe('GET');

    request.flush([
      {
        id: 1,
        userId: 10,
        title: 'First title',
        body: 'First body',
      },
      {
        id: 2,
        userId: 10,
        title: 'Second title',
        body: 'Second body',
      },
    ]);

    await expect(requestPromise).resolves.toEqual([
      {
        id: 1,
        userId: 10,
        title: 'First title',
        body: 'First body',
        comments: null,
      },
      {
        id: 2,
        userId: 10,
        title: 'Second title',
        body: 'Second body',
        comments: null,
      },
    ]);
  });

  it('calls the expected comments endpoint and derives the count', async () => {
    const requestPromise = firstValueFrom(service.getCommentsCountByPostId(99));

    const request = httpTestingController.expectOne(
      'https://jsonplaceholder.typicode.com/comments?postId=99',
    );
    expect(request.request.method).toBe('GET');

    request.flush([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]);

    await expect(requestPromise).resolves.toBe(4);
  });

  it('propagates failure responses for posts fetch', async () => {
    const requestPromise = firstValueFrom(service.getPostsByUserId(10));

    const request = httpTestingController.expectOne(
      'https://jsonplaceholder.typicode.com/posts?userId=10',
    );
    request.flush(
      { message: 'Request failed' },
      {
        status: 503,
        statusText: 'Service Unavailable',
      },
    );

    await expect(requestPromise).rejects.toMatchObject({
      status: 503,
      statusText: 'Service Unavailable',
    });
  });

  it('propagates failure responses for comments fetch', async () => {
    const requestPromise = firstValueFrom(service.getCommentsCountByPostId(99));

    const request = httpTestingController.expectOne(
      'https://jsonplaceholder.typicode.com/comments?postId=99',
    );
    request.flush(
      { message: 'Request failed' },
      {
        status: 500,
        statusText: 'Server Error',
      },
    );

    await expect(requestPromise).rejects.toMatchObject({
      status: 500,
      statusText: 'Server Error',
    });
  });
});
