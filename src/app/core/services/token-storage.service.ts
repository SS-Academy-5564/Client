import { computed, Injectable, signal } from '@angular/core';

type TokenUser = {
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  email: string | null;
  organization: string | null;
  organizationId: string | null;
  role: string | null;
  subject: string | null;
};

const MAX_TIMEOUT_DELAY = 2_147_483_647;

/**
 * Keeps the current access token and its decoded claims only in application memory.
 */
@Injectable({
  providedIn: 'root',
})
export class TokenStorageService {
  private readonly token = signal<string | null>(null);
  private readonly expiry = signal<string | null>(null);
  private readonly decodedUser = signal<TokenUser | null>(null);
  private expiryTimeoutId: ReturnType<typeof setTimeout> | null = null;

  /** Organization identifier decoded from the current access token. */
  readonly organizationId = computed(() => this.decodedUser()?.organizationId ?? null);

  /** Whether a non-expired access token is currently held in memory. */
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

  /** User claims decoded from the current access token. */
  readonly user = computed(() => this.decodedUser());

  /** Best available display name decoded from the current access token. */
  readonly displayName = computed(() => {
    const user = this.decodedUser();

    if (!user) {
      return null;
    }

    const nameFromParts = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    return user.fullName || nameFromParts || user.email || user.role || 'User';
  });

  /** Best available initials decoded from the current access token. */
  readonly userInitials = computed(() => {
    const user = this.decodedUser();

    if (!user) {
      return null;
    }

    return this.buildUserInitials(user);
  });

  /** Organization name decoded from the current access token. */
  readonly organizationName = computed(() => this.decodedUser()?.organization ?? null);

  /**
   * Replaces the in-memory access token and schedules its expiry.
   *
   * @param token Access token to retain for the current application lifetime.
   * @param expiresAt Optional ISO timestamp supplied by the API.
   */
  setToken(token: string | null, expiresAt?: string | null): void {
    this.cancelExpiryTimer();

    if (!token) {
      this.clearToken();
      return;
    }

    const resolvedExpiry = this.resolveExpiry(token, expiresAt);
    if (resolvedExpiry && new Date(resolvedExpiry).getTime() <= Date.now()) {
      this.clearToken();
      return;
    }

    this.token.set(token);
    this.expiry.set(resolvedExpiry);
    this.decodedUser.set(this.extractUserFromToken(token));

    if (resolvedExpiry) {
      this.scheduleExpiry(resolvedExpiry);
    }
  }

  /**
   * Returns the current access token when it has not expired.
   *
   * @returns The in-memory access token, or `null` when absent or expired.
   */
  getToken(): string | null {
    const expiry = this.expiry();

    if (expiry && new Date(expiry).getTime() <= Date.now()) {
      this.clearToken();
      return null;
    }

    return this.token();
  }

  /**
   * Removes the access token and all decoded claims from application memory.
   */
  clearToken(): void {
    this.cancelExpiryTimer();
    this.token.set(null);
    this.expiry.set(null);
    this.decodedUser.set(null);
  }

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

  private cancelExpiryTimer(): void {
    if (this.expiryTimeoutId) {
      clearTimeout(this.expiryTimeoutId);
      this.expiryTimeoutId = null;
    }
  }

  private scheduleExpiry(expiresAt: string): void {
    const delay = new Date(expiresAt).getTime() - Date.now();
    if (delay <= 0) {
      this.clearToken();
      return;
    }

    this.expiryTimeoutId = setTimeout(
      () => {
        if (delay > MAX_TIMEOUT_DELAY) {
          this.scheduleExpiry(expiresAt);
          return;
        }

        this.clearToken();
      },
      Math.min(delay, MAX_TIMEOUT_DELAY),
    );
  }

  private resolveExpiry(token: string, expiresAt?: string | null): string | null {
    if (expiresAt && Number.isFinite(new Date(expiresAt).getTime())) {
      return expiresAt;
    }

    const payload = this.decodeJwtPayload(token);
    const expiryClaim = payload?.['exp'];
    return typeof expiryClaim === 'number' && Number.isFinite(expiryClaim)
      ? new Date(expiryClaim * 1_000).toISOString()
      : null;
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
    const organizationId = this.readStringClaim(payload, [
      'organization_id',
      'organizationId',
      'org_id',
      'orgId',
      'company_id',
      'companyId',
      'tenant_id',
      'tenantId',
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
      organizationId,
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
