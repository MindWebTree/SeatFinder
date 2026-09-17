import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiOk, AuthResponseData, RefreshTokenResponse, RegisterRequest, SendOtpRequest, VerifyOtpRequest } from '../models/auth.models';
import { TokenStorageService } from './token-storage.service';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly base = `${environment.apiUrl}/api/auth`;

  register(request: RegisterRequest): Observable<ApiOk> {
    return this.http.post<ApiOk>(`${this.base}/register`, request);
  }

  sendOtp(request: SendOtpRequest): Observable<ApiOk> {
    return this.http.post<ApiOk>(`${this.base}/login`, request);
  }

  verifyOtp(request: VerifyOtpRequest): Observable<AuthResponseData> {
    return this.http.post<ApiResponse<AuthResponseData>>(`${this.base}/login/verify-otp`, request).pipe(
      map((res) => res.data),
      tap((data) => this.tokenStorage.setToken(data.accessToken, data.refreshToken))
    );
  }

  /**
   * Calls POST /api/auth/refresh-token with the stored refresh token.
   * On success, updates both tokens in storage and returns the new access token.
   * On failure, clears storage (forces re-login).
   */
  refreshAccessToken(): Observable<string> {
    const refreshToken = this.tokenStorage.refreshToken();
    if (!refreshToken) {
      this.tokenStorage.clearToken();
      return throwError(() => new Error('No refresh token available'));
    }
    return this.http
      .post<ApiResponse<RefreshTokenResponse>>(`${this.base}/refresh-token`, { refreshToken })
      .pipe(
        map((res) => res.data),
        tap((data) => this.tokenStorage.setToken(data.accessToken, data.refreshToken)),
        map((data) => data.accessToken)
      );
  }

  isLoggedIn(): boolean {
    return this.tokenStorage.hasToken();
  }

  /** Decodes the JWT payload and returns the user's full name, or null if not logged in. */
  getLoggedInName(): string | null {
    const token = this.tokenStorage.token();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // JWT uses "name" claim for display name; fall back to "sub" (userId) if missing.
      return payload['name'] ?? payload['fullName'] ?? payload['sub'] ?? null;
    } catch {
      return null;
    }
  }

  logout(): void {
    this.tokenStorage.clearToken();
  }
}
