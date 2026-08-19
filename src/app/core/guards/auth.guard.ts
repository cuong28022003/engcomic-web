import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { FULL_ROUTE } from '@shared/constants/route';

/** Guard for routes requiring login */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  }

  router.navigate([FULL_ROUTE.login]);
  return false;
};

/** Guard for admin-only routes */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn() && auth.isAdmin()) {
    return true;
  }

  router.navigate([FULL_ROUTE.home]);
  return false;
};
