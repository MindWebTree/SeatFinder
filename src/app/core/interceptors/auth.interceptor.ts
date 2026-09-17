import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { TokenStorageService } from '../services/token-storage.service';
import { AuthService } from '../services/auth.service';

/**
 * Attaches "Authorization: Bearer <token>" to every outgoing request.
 * On a 401 response, attempts a silent token refresh via POST /api/auth/refresh-token.
 * If the refresh succeeds the original request is retried with the new token.
 * If the refresh also fails the user is logged out and the error is propagated.
 */

// Module-level flag to prevent multiple simultaneous refresh calls.
let isRefreshing = false;
const refreshDone$ = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStorage = inject(TokenStorageService);
  const authService = inject(AuthService);

  const token = tokenStorage.token();

  // Attach token if available (skip refresh-token calls to avoid loops).
  const authReq = token && !req.url.includes('/refresh-token')
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' } })
    : req.clone({ setHeaders: { 'ngrok-skip-browser-warning': 'true' } });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Only handle 401s; ignore refresh-token endpoint itself to avoid loops.
      if (error.status !== 401 || req.url.includes('/refresh-token')) {
        return throwError(() => error);
      }

      if (isRefreshing) {
        // Queue up: wait for the in-progress refresh to complete then retry.
        return refreshDone$.pipe(
          filter((t): t is string => t !== null),
          take(1),
          switchMap((newToken) =>
            next(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}`, 'ngrok-skip-browser-warning': 'true' } }))
          )
        );
      }

      isRefreshing = true;
      refreshDone$.next(null);

      return authService.refreshAccessToken().pipe(
        switchMap((newToken) => {
          isRefreshing = false;
          refreshDone$.next(newToken);
          return next(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}`, 'ngrok-skip-browser-warning': 'true' } }));
        }),
        catchError((refreshError) => {
          isRefreshing = false;
          refreshDone$.next(null);
          // Refresh failed — log the user out.
          authService.logout();
          return throwError(() => refreshError);
        })
      );
    })
  );
};
