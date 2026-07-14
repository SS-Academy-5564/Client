import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';
import { ApiResponse } from '../models/api-response';
import { CurrentUser } from '../models/user.model';
import { environment } from '@/environments/environment';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiBaseUrl}/users`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService],
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should send GET request to /users/me', () => {
    const mockUser: CurrentUser = {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };

    const mockResponse: ApiResponse<CurrentUser> = {
      data: mockUser,
    } as ApiResponse<CurrentUser>;

    service.getMe().subscribe((response) => {
      expect(response).toEqual(mockResponse);
      expect(response.data.email).toBe(mockUser.email);
      expect(response.data.firstName).toBe(mockUser.firstName);
      expect(response.data.lastName).toBe(mockUser.lastName);
    });

    const req = httpMock.expectOne(`${apiUrl}/me`);
    expect(req.request.method).toBe('GET');

    req.flush(mockResponse);
  });

  it('should propagate error when request fails', () => {
    service.getMe().subscribe({
      next: () => {
        throw new Error('Expected request to fail');
      },
      error: (error) => {
        expect(error.status).toBe(401);
      },
    });

    const req = httpMock.expectOne(`${apiUrl}/me`);
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
  });
});
