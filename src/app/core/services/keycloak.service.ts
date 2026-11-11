import { Injectable } from '@angular/core';
import Keycloak from 'keycloak-js';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class KeycloakService {
  private instance: Keycloak | null = null;
  private initialized = false;

  get enabled(): boolean {
    return environment.keycloak?.enabled !== false;
  }

  get isAuthenticated(): boolean {
    return !!this.instance?.authenticated;
  }

  get token(): string | null {
    return this.instance?.token ?? null;
  }

  async init(): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }
    if (this.initialized) {
      return this.isAuthenticated;
    }

    const config = environment.keycloak;
    this.instance = new Keycloak({
      url: config.url,
      realm: config.realm,
      clientId: config.clientId,
    });

    this.instance.onTokenExpired = () => {
      this.instance?.updateToken(30).catch(() => undefined);
    };

    try {
      const authenticated = await this.instance.init({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        checkLoginIframe: false,
      });
      this.initialized = true;
      return authenticated;
    } catch (error) {
      console.error('Keycloak initialization failed', error);
      this.initialized = true;
      return false;
    }
  }

  /**
   * Refreshes the access token when it is about to expire.
   * Resolves to true when a valid token is available.
   */
  async refresh(minValiditySeconds = 30): Promise<boolean> {
    if (!this.instance?.authenticated) {
      return false;
    }
    try {
      await this.instance.updateToken(minValiditySeconds);
      return true;
    } catch {
      return false;
    }
  }

  login(redirectUri?: string): Promise<void> {
    if (!this.instance) {
      return Promise.reject(new Error('Keycloak is not initialized'));
    }
    return this.instance.login({
      redirectUri: redirectUri || `${window.location.origin}/login`,
    });
  }

  register(redirectUri?: string): Promise<void> {
    if (!this.instance) {
      return Promise.reject(new Error('Keycloak is not initialized'));
    }
    return this.instance.register({
      redirectUri: redirectUri || `${window.location.origin}/login`,
    });
  }

  accountManagement(): Promise<void> {
    if (!this.instance) {
      return Promise.reject(new Error('Keycloak is not initialized'));
    }
    return this.instance.accountManagement();
  }

  logout(redirectUri?: string): Promise<void> {
    if (!this.instance?.authenticated) {
      this.instance?.clearToken();
      return Promise.resolve();
    }
    return this.instance.logout({
      redirectUri: redirectUri || `${window.location.origin}/`,
    });
  }
}
