import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { TokenStorageService } from './token-storage.service';

describe('TokenStorageService', () => {
  let service: TokenStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TokenStorageService],
    });

    service = TestBed.inject(TokenStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with null token', () => {
    expect(service.getToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
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

  it('should automatically clear token when expiration timer fires', () => {
    vi.useFakeTimers();
    const expiryDelay = 10000;
    const expiresAt = new Date(Date.now() + expiryDelay).toISOString();

    service.setToken('expiring-token', expiresAt);
    expect(service.getToken()).toBe('expiring-token');
    expect(service.isAuthenticated()).toBe(true);

    vi.advanceTimersByTime(expiryDelay + 1000);

    expect(service.getToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);

    vi.useRealTimers();
  });

  it('should clear token', () => {
    service.setToken('test-token');
    service.clearToken();
    expect(service.getToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });
});
