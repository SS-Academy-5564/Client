import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from './auth.service';
import { TokenStorageService } from './token-storage.service';

describe('AuthService', () => {
  let service: AuthService;
  let tokenStorage: TokenStorageService;
  let httpMock: { post: ReturnType<typeof vi.fn>; get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    httpMock = {
      post: vi.fn(),
      get: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [AuthService, TokenStorageService, { provide: HttpClient, useValue: httpMock }],
    });

    service = TestBed.inject(AuthService);
    tokenStorage = TestBed.inject(TokenStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call http.post on register', () => {
    const payload = {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'test@test.com',
      password: '123456',
      confirmPassword: '123456',
    };

    httpMock.post.mockReturnValue(of({}));

    service.register(payload).subscribe();

    expect(httpMock.post).toHaveBeenCalledWith(expect.stringContaining('/auth/register'), payload);
  });

  it('should set isLoading true then false after finalize', () => {
    httpMock.post.mockReturnValue(of({}));

    const payload = {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'test@test.com',
      password: '123456',
      confirmPassword: '123456',
    };

    service.register(payload).subscribe();

    expect(service.isLoading()).toBe(false);
  });

  it('should set error via setError', () => {
    service.setError('Something went wrong');

    expect(service.error()).toBe('Something went wrong');
  });

  it('should store token in memory on login success', () => {
    httpMock.get.mockReturnValue(
      of({
        success: true,
        data: {
          id: 'a2c8e4db-5efc-4f35-8ca4-8d5c9139e0c5',
          email: 'a@b.com',
          firstName: 'Jane',
          lastName: 'Doe',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
        errors: [],
      }),
    );

    httpMock.post.mockReturnValue(
      of({
        success: true,
        data: { accessToken: 'token123', expiresAt: new Date(Date.now() + 3600000).toISOString() },
        errors: [],
      }),
    );
    service.login({ email: 'a@b.com', password: '123' }).subscribe();

    expect(tokenStorage.getToken()).toBe('token123');
    expect(tokenStorage.isAuthenticated()).toBe(true);
    expect(httpMock.get).toHaveBeenCalledWith(
      expect.stringContaining('/users/me'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: expect.stringContaining('Bearer ') }),
      }),
    );
    expect(service.displayName()).toBe('Jane Doe');
    expect(service.userInitials()).toBe('JD');
  });

  it('should load current user and expose computed values', () => {
    tokenStorage.setToken('token123', new Date(Date.now() + 3600000).toISOString());
    httpMock.get.mockReturnValue(
      of({
        success: true,
        data: {
          id: 'a2c8e4db-5efc-4f35-8ca4-8d5c9139e0c5',
          email: 'jane@doe.com',
          firstName: 'Jane',
          lastName: 'Doe',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
        errors: [],
      }),
    );

    service.loadCurrentUser().subscribe();

    expect(service.currentUser()?.email).toBe('jane@doe.com');
    expect(service.displayName()).toBe('Jane Doe');
    expect(service.userInitials()).toBe('JD');
  });

  it('should clear token and current user on logout', () => {
    tokenStorage.setToken('token123', new Date(Date.now() + 3600000).toISOString());
    service.currentUser.set({
      id: 'a2c8e4db-5efc-4f35-8ca4-8d5c9139e0c5',
      email: 'jane@doe.com',
      firstName: 'Jane',
      lastName: 'Doe',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });

    service.logout();

    expect(tokenStorage.getToken()).toBeNull();
    expect(service.currentUser()).toBeNull();
  });
});
