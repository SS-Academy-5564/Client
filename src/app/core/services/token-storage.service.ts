import { computed, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TokenStorageService {
  // TODO: [Tech Debt] Storing JWTs in-memory reduces risk but still leaves them accessible to script injection.
  // In the future, migrate to HttpOnly, Secure cookie-based authentication. This will require backend API changes.
  private readonly token = signal<string | null>(null);
  private readonly expiry = signal<string | null>(null);

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
  }

  getToken(): string | null {
    if (!this.isAuthenticated()) {
      this.clearToken();
      return null;
    }
    return this.token();
  }

  clearToken(): void {
    this.token.set(null);
    this.expiry.set(null);
  }
}
