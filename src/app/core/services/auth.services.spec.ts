import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: any;

  beforeEach(() => {
    httpMock = {
      post: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [AuthService, { provide: HttpClient, useValue: httpMock }],
    });

    service = TestBed.inject(AuthService);
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

  afterEach(() => {
    localStorage.clear();
  });

  it('should call http.post on login and store token on success', () => {
    const payload = {
      email: 'test@test.com',
      password: 'password123',
    };
    const responseMock = {
      success: true,
      data: { accessToken: 'mock-token', expiresAt: '2026-06-24T16:01:54Z' },
      errors: [],
    };

    httpMock.post.mockReturnValue(of(responseMock));

    service.login(payload).subscribe();

    expect(httpMock.post).toHaveBeenCalledWith(expect.stringContaining('/auth/login'), payload);
    expect(localStorage.getItem('token')).toBe('mock-token');
  });

  it('should remove token from localStorage on logout', () => {
    localStorage.setItem('token', 'mock-token');
    service.logout();
    expect(localStorage.getItem('token')).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should update isAuthenticated state on login and logout', () => {
    expect(service.isAuthenticated()).toBe(false);

    const payload = { email: 'test@test.com', password: 'password' };
    const responseMock = {
      success: true,
      data: { accessToken: 'mock-token' },
    };
    httpMock.post.mockReturnValue(of(responseMock));
    service.login(payload).subscribe();

    expect(service.isAuthenticated()).toBe(true);

    service.logout();
    expect(service.isAuthenticated()).toBe(false);
  });
});
