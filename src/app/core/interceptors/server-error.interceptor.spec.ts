import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { serverErrorInterceptor } from './server-error.interceptor';

describe('serverErrorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let navigateByUrl: ReturnType<typeof vi.fn>;

  const TEST_URL = '/api/test';

  beforeEach(() => {
    navigateByUrl = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([serverErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigateByUrl } },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  function expectError(status: number): Promise<HttpErrorResponse> {
    return new Promise((resolve) => {
      http.get(TEST_URL).subscribe({
        error: (err: HttpErrorResponse) => resolve(err),
      });
      httpMock.expectOne(TEST_URL).flush('', { status, statusText: 'X' });
    });
  }

  it('redirects to /error/500 on a server error', async () => {
    await expectError(500);
    expect(navigateByUrl).toHaveBeenCalledWith('/error/500');
  });

  it('preserves the real status code for other 5xx (503 -> /error/503, not 500)', async () => {
    await expectError(503);
    expect(navigateByUrl).toHaveBeenCalledWith('/error/503');
  });

  it('redirects to /error/offline on a network failure (status 0)', async () => {
    await new Promise<void>((resolve) => {
      http.get(TEST_URL).subscribe({
        error: () => resolve(),
      });
      httpMock.expectOne(TEST_URL).error(new ProgressEvent('error'));
    });
    expect(navigateByUrl).toHaveBeenCalledWith('/error/offline');
  });

  it.each([400, 401, 403, 409, 429])('does not redirect on %i (inline stays inline)', async (status) => {
    await expectError(status);
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('re-throws the error so component handlers still run', async () => {
    const err = await expectError(500);
    expect(err).toBeInstanceOf(HttpErrorResponse);
    expect(err.status).toBe(500);
  });

  afterEach(() => {
    httpMock.verify();
  });
});
