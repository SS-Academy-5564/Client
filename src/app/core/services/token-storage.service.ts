import { computed, Injectable, signal } from '@angular/core';

type TokenUser = {
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  email: string | null;
  organization: string | null;
  role: string | null;
  subject: string | null;
};

@Injectable({
  providedIn: 'root',
})
export class TokenStorageService {
  // TODO: [Tech Debt] Storing JWTs in-memory reduces risk but still leaves them accessible to script injection.
  // In the future, migrate to HttpOnly, Secure cookie-based authentication. This will require backend API changes.
  private readonly token = signal<string | null>(null);
  private readonly expiry = signal<string | null>(null);
  private readonly decodedUser = signal<TokenUser | null>(null);

  private expiryTimeoutId: ReturnType<typeof setTimeout> | null = null;

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

  readonly user = computed(() => this.decodedUser());

  readonly displayName = computed(() => {
    const user = this.decodedUser();

    if (!user) {
      return null;
    }

    const nameFromParts = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    return user.fullName || nameFromParts || user.email || user.role || 'User';
  });

  readonly userInitials = computed(() => {
    const user = this.decodedUser();

    if (!user) {
      return null;
    }

    return this.buildUserInitials(user);
  });

  private buildUserInitials(user: TokenUser): string | null {
    const initials =
      this.getNameInitials(user) ||
      this.getWordInitials(user.fullName) ||
      this.getFirstCharacter(user.email) ||
      this.getWordInitials(this.displayName()) ||
      this.getFirstCharacter(user.role);

    return initials?.toUpperCase() || null;
  }

  private getNameInitials(user: TokenUser): string {
    return this.getFirstCharacter(user.firstName) + this.getFirstCharacter(user.lastName);
  }

  private getFirstCharacter(value: string | null): string {
    return value?.trim().charAt(0) ?? '';
  }

  private getWordInitials(value: string | null): string {
    return (
      value
        ?.trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0))
        .join('') ?? ''
    );
  }

  readonly organizationName = computed(() => this.decodedUser()?.organization ?? null);

  setToken(token: string | null, expiresAt?: string | null): void {
    this.token.set(token);
    this.expiry.set(expiresAt || null);
    this.decodedUser.set(token ? this.extractUserFromToken(token) : null);

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
    if (!this.isAuthenticated()) {
      this.clearToken();
      return null;
    }
    return this.token();
  }

  clearToken(): void {
    this.token.set(null);
    this.expiry.set(null);
    this.decodedUser.set(null);
    if (this.expiryTimeoutId) {
      clearTimeout(this.expiryTimeoutId);
      this.expiryTimeoutId = null;
    }
  }

  private extractUserFromToken(token: string): TokenUser | null {
    const payload = this.decodeJwtPayload(token);

    if (!payload) {
      return null;
    }

    const firstName = this.readStringClaim(payload, ['given_name', 'givenName', 'firstName']);
    const lastName = this.readStringClaim(payload, ['family_name', 'familyName', 'lastName']);
    const fullName = this.readStringClaim(payload, ['name', 'fullName']);
    const email = this.readStringClaim(payload, ['email', 'upn', 'preferred_username']);
    const organization = this.readStringClaim(payload, [
      'organization',
      'organisation',
      'org',
      'company',
      'tenant',
      'tenant_name',
    ]);
    const role = this.readRoleClaim(payload, ['role', 'roles']);
    const subject = this.readStringClaim(payload, ['sub']);

    if (!firstName && !lastName && !fullName && !email && !organization && !role && !subject) {
      return null;
    }

    return {
      firstName,
      lastName,
      fullName,
      email,
      organization,
      role,
      subject,
    };
  }

  private decodeJwtPayload(token: string): Record<string, unknown> | null {
    const parts = token.split('.');

    if (parts.length !== 3) {
      return null;
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');

    try {
      const decoded = atob(padded);
      const bytes = Uint8Array.from(decoded, (char) => char.charCodeAt(0));
      const utf8Decoded = new TextDecoder().decode(bytes);
      const payload = JSON.parse(utf8Decoded);

      return typeof payload === 'object' && payload !== null && !Array.isArray(payload) ? payload : null;
    } catch {
      return null;
    }
  }

  private readStringClaim(payload: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const value = payload[key];

      if (typeof value === 'string' && value.trim()) {
        return value;
      }
    }

    return null;
  }

  private readRoleClaim(payload: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const value = payload[key];

      if (typeof value === 'string' && value.trim()) {
        return value;
      }

      if (Array.isArray(value)) {
        const firstString = value.find((item) => typeof item === 'string' && item.trim());
        if (typeof firstString === 'string') {
          return firstString;
        }
      }
    }

    return null;
  }
}
