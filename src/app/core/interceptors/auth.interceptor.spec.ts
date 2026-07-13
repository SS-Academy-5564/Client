import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { TokenStorageService } from '@core/services/token-storage.service';
import { environment } from '@environments/environment';

describe('authInterceptor', () => {
  let httpTesting: HttpTestingController;
  let tokenStorage: TokenStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
    });

    httpTesting = TestBed.inject(HttpTestingController);
    tokenStorage = TestBed.inject(TokenStorageService);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should add the bearer token to API requests', () => {
    tokenStorage.setToken('token123', new Date(Date.now() + 60_000).toISOString());

    TestBed.inject(HttpClient).get(`${environment.apiBaseUrl}/monitors`).subscribe();

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/monitors`);
    expect(request.request.headers.get('Authorization')).toBe('Bearer token123');
    request.flush([]);
  });

  it('should not add an authorization header when no token exists', () => {
    TestBed.inject(HttpClient).get(`${environment.apiBaseUrl}/monitors`).subscribe();

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/monitors`);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush([]);
  });
});
