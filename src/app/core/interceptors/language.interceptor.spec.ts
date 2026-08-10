import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { environment } from '@environments/environment';
import { languageInterceptor } from './language.interceptor';

describe('languageInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach((): void => {
    TestBed.configureTestingModule({
      providers: [
        { provide: LOCALE_ID, useValue: 'uk' },
        provideHttpClient(withInterceptors([languageInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach((): void => {
    httpMock.verify();
  });

  it('should send the active UI locale to the Pulse API', (): void => {
    const url = `${environment.apiBaseUrl}/auth/register`;

    http.post(url, {}).subscribe();

    const request = httpMock.expectOne(url);
    expect(request.request.headers.get('Accept-Language')).toBe('uk');
    request.flush({});
  });

  it('should not expose the UI locale to external services', (): void => {
    const url = 'https://example.com/content';

    http.get(url).subscribe();

    const request = httpMock.expectOne(url);
    expect(request.request.headers.has('Accept-Language')).toBe(false);
    request.flush({});
  });
});
