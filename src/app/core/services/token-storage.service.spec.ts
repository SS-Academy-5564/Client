import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TokenStorageService } from './token-storage.service';

const createJwt = (payload: Record<string, unknown>): string => {
  const header = { alg: 'HS256', typ: 'JWT' };

  const encode = (value: Record<string, unknown>): string => {
    const json = JSON.stringify(value);
    return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };

  return `${encode(header)}.${encode(payload)}.signature`;
};

describe('TokenStorageService', () => {
  let service: TokenStorageService;
  let getItemSpy: ReturnType<typeof vi.spyOn>;
  let setItemSpy: ReturnType<typeof vi.spyOn>;
  let removeItemSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('token', 'persisted-local-token');
    sessionStorage.setItem('token', 'persisted-session-token');

    getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
    setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');

    TestBed.configureTestingModule({
      providers: [TokenStorageService],
    });

    service = TestBed.inject(TokenStorageService);
  });

  afterEach(() => {
    getItemSpy.mockRestore();
    setItemSpy.mockRestore();
    removeItemSpy.mockRestore();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with null token', () => {
    expect(service.getToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should never read or write access tokens in browser storage', () => {
    service.setToken('memory-only-token');
    expect(service.getToken()).toBe('memory-only-token');

    service.clearToken();

    expect(getItemSpy).not.toHaveBeenCalled();
    expect(setItemSpy).not.toHaveBeenCalled();
    expect(removeItemSpy).not.toHaveBeenCalled();
    expect(localStorage.getItem('token')).toBe('persisted-local-token');
    expect(sessionStorage.getItem('token')).toBe('persisted-session-token');
  });

  it('should set and retrieve token', () => {
    service.setToken('test-token');
    expect(service.getToken()).toBe('test-token');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('should handle token expiration correctly', () => {
    const futureDate = new Date(Date.now() + 60000).toISOString();
    service.setToken('test-token', futureDate);
    expect(service.getToken()).toBe('test-token');
    expect(service.isAuthenticated()).toBe(true);

    const pastDate = new Date(Date.now() - 60000).toISOString();
    service.setToken('expired-token', pastDate);
    expect(service.getToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should derive expiration from the JWT when the API omits expiresAt', () => {
    vi.useFakeTimers();

    try {
      const expiresAtSeconds = Math.floor((Date.now() + 10_000) / 1_000);
      service.setToken(createJwt({ exp: expiresAtSeconds }));

      expect(service.isAuthenticated()).toBe(true);

      vi.advanceTimersByTime(11_000);

      expect(service.getToken()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('should automatically clear token when expiration timer fires', () => {
    vi.useFakeTimers();

    try {
      const expiryDelay = 10_000;
      const expiresAt = new Date(Date.now() + expiryDelay).toISOString();

      service.setToken('expiring-token', expiresAt);

      expect(service.getToken()).toBe('expiring-token');
      expect(service.isAuthenticated()).toBe(true);

      vi.advanceTimersByTime(expiryDelay + 1);

      expect(service.getToken()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('should keep token valid if expiry exceeds maximum signed 32-bit integer', () => {
    vi.useFakeTimers();

    try {
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const expiresAt = new Date(Date.now() + thirtyDaysMs).toISOString();

      service.setToken('long-lived-token', expiresAt);

      vi.advanceTimersByTime(24 * 60 * 60 * 1000);

      expect(service.getToken()).toBe('long-lived-token');
      expect(service.isAuthenticated()).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('should clear token', () => {
    service.setToken('test-token');
    service.clearToken();
    expect(service.getToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should expose initials from JWT given and family name', () => {
    const token = createJwt({ given_name: 'John', family_name: 'Doe' });

    service.setToken(token);

    expect(service.userInitials()).toBe('JD');
  });

  it('should expose initials from JWT full name when first/last are missing', () => {
    const token = createJwt({ name: 'Jane Smith' });

    service.setToken(token);

    expect(service.userInitials()).toBe('JS');
  });

  it('should expose initials from JWT email when only email is available', () => {
    const token = createJwt({ email: 'test@example.com' });

    service.setToken(token);

    expect(service.userInitials()).toBe('T');
  });

  it('should expose organization from JWT', () => {
    const token = createJwt({ organization: 'SoftServe' });

    service.setToken(token);

    expect(service.organizationName()).toBe('SoftServe');
  });
});
