import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthFacade } from '../data-access/auth-facade.service';

export const authGuard: CanActivateFn = () => {
  const authFacade = inject(AuthFacade);
  const router = inject(Router);

  if (authFacade.isSignedIn()) {
    return true;
  }

  return router.createUrlTree(['/sign-in']);
};