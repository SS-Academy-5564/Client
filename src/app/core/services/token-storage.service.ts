import { computed, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TokenStorageService {
  // TODO: [Tech Debt] Storing JWTs in-memory reduces risk but still leaves them accessible to script injection.
  // In the future, migrate to HttpOnly, Secure cookie-based authentication. This will require backend API changes.
  private readonly token = signal<string | null>(null);
  private readonly expiry = signal<string | null>(null);

  private expiryTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    const savedToken = localStorage.getItem('token');
    const savedExpiry = localStorage.getItem('token_expiry');

    if (savedToken) {
      this.token.set(savedToken);
    }

    if (savedExpiry) {
      this.expiry.set(savedExpiry);
    }
  }

  readonly isAuthenticated = computed(() => {
    const token = this.token();
    const expiry = this.expiry();
    if (!token) {
      return false;
    }
    if (!expiry) {
      return true;
    }
    return new Date() < new Date(expiry);
  });

  setToken(token: string | null, expiresAt?: string | null): void {
    this.token.set(token);
    this.expiry.set(expiresAt || null);

    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }

    if (expiresAt) {
      localStorage.setItem('token_expiry', expiresAt);
    } else {
      localStorage.removeItem('token_expiry');
    }

    if (this.expiryTimeoutId) {
      clearTimeout(this.expiryTimeoutId);
      this.expiryTimeoutId = null;
    }

    if (token && expiresAt) {
      const delay = new Date(expiresAt).getTime() - Date.now();
      if (delay > 0) {
        const MAX_TIMEOUT = 2147483647; // ~24.8 days max delay for 32-bit signed int
        if (delay <= MAX_TIMEOUT) {
          this.expiryTimeoutId = setTimeout(() => {
            this.clearToken();
          }, delay);
        }
      } else {
        this.clearToken();
      }
    }
  }

  getToken(): string | null {
    return this.token();
  }

  clearToken(): void {
    this.token.set(null);
    this.expiry.set(null);

    localStorage.removeItem('token');
    localStorage.removeItem('token_expiry');

    if (this.expiryTimeoutId) {
      clearTimeout(this.expiryTimeoutId);
      this.expiryTimeoutId = null;
    }
  }
}
