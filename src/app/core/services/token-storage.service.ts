import { computed, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TokenStorageService {
  // TODO: [Tech Debt] Storing JWTs in-memory reduces risk but still leaves them accessible to script injection.
  // In the future, migrate to HttpOnly, Secure cookie-based authentication. This will require backend API changes.
  private readonly token = signal<string | null>(null);

  readonly isAuthenticated = computed(() => !!this.token());

  setToken(token: string | null): void {
    this.token.set(token);
  }

  getToken(): string | null {
    return this.token();
  }

  clearToken(): void {
    this.token.set(null);
  }
}
