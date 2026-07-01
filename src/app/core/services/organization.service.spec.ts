import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { describe, expect, it, beforeEach, afterEach} from 'vitest';
import { OrganizationService } from './organization.service';
import { environment } from '../../../environments/environment';

describe('OrganizationService', () => {
  let service: OrganizationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OrganizationService]
    });

    service = TestBed.inject(OrganizationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call createOrganization with correct URL and body', () => {
    const mockResponse = {
      data: {
        organizationId: '123',
        accessToken: 'token'
      },
      pagination: null,
      success: true,
      errors: []
    };

    const name = 'Test Org';

    service.createOrganization(name).subscribe(res => {
      expect(res.data.organizationId).toBe('123');
      expect(res.data.accessToken).toBe('token');
    });

    const req = httpMock.expectOne(
      `${environment.apiBaseUrl}/organizations`
    );

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name });

    req.flush(mockResponse);
  });
});