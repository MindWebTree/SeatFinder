import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'counselling_app_token';
const REFRESH_KEY = 'counselling_app_refresh_token';

/**
 * Holds the JWT access token used to call protected endpoints (seat-finder).
 * There's no login UI yet (out of scope for this build) - for now, get a
 * token from POST /api/auth/login via Swagger/Postman and paste it into the
 * dev token banner in the app, or call `setToken()` directly from devtools.
 * Once a real login flow exists, wire it up to call `setToken()` on success
 * and this service needs no other changes.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  /** Reactive signal so the UI (e.g. the dev banner) can reflect auth state. */
  readonly token = signal<string | null>(localStorage.getItem(STORAGE_KEY));
  readonly refreshToken = signal<string | null>(localStorage.getItem(REFRESH_KEY));

  setToken(accessToken: string, refreshToken?: string): void {
    localStorage.setItem(STORAGE_KEY, accessToken);
    this.token.set(accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_KEY, refreshToken);
      this.refreshToken.set(refreshToken);
    }
  }

  clearToken(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(REFRESH_KEY);
    this.token.set(null);
    this.refreshToken.set(null);
  }

  hasToken(): boolean {
    return !!this.token();
  }
}
