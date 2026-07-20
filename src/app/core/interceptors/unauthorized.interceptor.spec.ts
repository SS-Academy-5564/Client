import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TokenStorageService } from '@core/services/token-storage.service';
import { unauthorizedInterceptor } from './unauthorized.interceptor';

describe('unauthorizedInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let navigate: ReturnType<typeof vi.fn>;
  let clearToken: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    navigate = vi.fn();
    clearToken = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([unauthorizedInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigate } },
        { provide: TokenStorageService, useValue: { clearToken } },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('clears the session and navigates to login on 401', async () => {
    const error = await triggerError(401);

    expect(clearToken).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith(['/login']);
    expect(error.status).toBe(401);
  });

  it.each([400, 403, 404, 500])('does not clear the session on %i', async (status) => {
    await triggerError(status);

    expect(clearToken).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  function triggerError(status: number): Promise<HttpErrorResponse> {
    return new Promise((resolve) => {
      http.get('/api/test').subscribe({
        error: (error: HttpErrorResponse) => resolve(error),
      });
      httpMock.expectOne('/api/test').flush('', { status, statusText: 'Error' });
    });
  }
});
