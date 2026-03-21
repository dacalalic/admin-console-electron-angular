import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { AuthApiService } from './auth-api.service';

describe('AuthApiService', () => {
  let service: AuthApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthApiService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AuthApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('calls the expected user endpoint and maps the response', async () => {
    const requestPromise = firstValueFrom(service.getUserById(7));

    const request = httpTestingController.expectOne('https://jsonplaceholder.typicode.com/users/7');
    expect(request.request.method).toBe('GET');

    request.flush({
      id: 7,
      name: 'Jane Doe',
      email: 'jane@example.com',
    });

    await expect(requestPromise).resolves.toEqual({
      id: 7,
      name: 'Jane Doe',
      email: 'jane@example.com',
    });
  });

  it('propagates failure responses', async () => {
    const requestPromise = firstValueFrom(service.getUserById(7));

    const request = httpTestingController.expectOne('https://jsonplaceholder.typicode.com/users/7');
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
