import {
  APP_INITIALIZER,
  ApplicationConfig,
  inject,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { httpLoggingInterceptor } from './core/http/http-logging.interceptor';
import { LoggerService } from './core/logging/logger.service';
import { AuthFacade } from './features/auth/data-access/auth-facade.service';

function restoreSessionOnBootstrap(): () => Promise<void> {
  const authFacade = inject(AuthFacade);
  const logger = inject(LoggerService);
  const router = inject(Router);

  return async () => {
    const currentPath = window.location.pathname;

    logger.info('app-flow', 'App initialization started.');
    await authFacade.restoreSession();
    logger.info('app-flow', 'Session restore finished.', {
      isSignedIn: authFacade.isSignedIn(),
      route: currentPath,
    });

    if (authFacade.isSignedIn() && currentPath !== '/posts') {
      logger.info('app-flow', 'Redirecting signed-in user to posts page.');
      await router.navigate(['/posts']);
    }
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([httpLoggingInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: restoreSessionOnBootstrap,
      multi: true,
    },
  ],
};
