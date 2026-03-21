import {
  HttpErrorResponse,
  HttpEvent,
  HttpInterceptorFn,
  HttpResponse,
  HttpStatusCode,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs';
import { LoggerService } from '../logging/logger.service';

export const httpLoggingInterceptor: HttpInterceptorFn = (request, next) => {
  const logger = inject(LoggerService);
  const startedAt = performance.now();

  logger.info('http', 'HTTP request started.', {
    method: request.method,
    url: request.urlWithParams,
  });

  return next(request).pipe(
    tap({
      next: (event: HttpEvent<unknown>) => {
        if (!(event instanceof HttpResponse)) {
          return;
        }

        logger.info('http', 'HTTP response received.', {
          method: request.method,
          url: request.urlWithParams,
          status: event.status,
          ok: event.ok,
          durationMs: Math.round(performance.now() - startedAt),
        });
      },
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse) {
          logger.error('http', 'HTTP request failed.', {
            method: request.method,
            url: request.urlWithParams,
            status: error.status,
            statusText: error.statusText || 'Unknown Error',
            durationMs: Math.round(performance.now() - startedAt),
          });
          return;
        }

        logger.error('http', 'HTTP request failed with unknown error.', {
          method: request.method,
          url: request.urlWithParams,
          status: HttpStatusCode.InternalServerError,
          durationMs: Math.round(performance.now() - startedAt),
        });
      },
    }),
  );
};
