import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideExperimentalZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { AuthService } from './core/services/auth.service';
import { KeycloakService } from './core/services/keycloak.service';

function initializeKeycloak(): Promise<void> {
  const keycloak = inject(KeycloakService);
  const auth = inject(AuthService);

  return keycloak.init().then(async (authenticated) => {
    if (authenticated) {
      await auth.syncKeycloakUser();
    }
  });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideAnimations(),
    provideAppInitializer(initializeKeycloak),
  ],
};
