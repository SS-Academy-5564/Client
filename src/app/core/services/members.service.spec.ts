import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '@environments/environment';
import { MembersService } from './members.service';

describe('MembersService', () => {
  let service: MembersService;
  let httpTestingController: HttpTestingController;
  const apiBaseUrl = `${environment.apiBaseUrl}/members`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MembersService],
    });

    service = TestBed.inject(MembersService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get members with default pagination', () => {
    service.getMembers().subscribe((result) => {
      expect(result.members.length).toBe(1);
      expect(result.pageNumber).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.totalCount).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    const req = httpTestingController.expectOne(`${apiBaseUrl}?pageNumber=1&pageSize=10`);
    expect(req.request.method).toEqual('GET');
    req.flush({
      success: true,
      data: [{ userId: '1', name: 'John Doe', email: 'john@example.com', role: 'Admin', joinedAt: '2023-01-01' }],
      pagination: {
        pageNumber: 1,
        pageSize: 10,
        totalCount: 10,
        totalPages: 1,
      },
      errors: [],
    });
  });

  it('should get members with custom pagination', () => {
    service.getMembers(2, 20).subscribe((result) => {
      expect(result.pageNumber).toBe(2);
      expect(result.pageSize).toBe(20);
    });

    const req = httpTestingController.expectOne(`${apiBaseUrl}?pageNumber=2&pageSize=20`);
    expect(req.request.method).toEqual('GET');
    req.flush({
      success: true,
      data: [],
      pagination: {
        pageNumber: 2,
        pageSize: 20,
        totalCount: 0,
        totalPages: 0,
      },
      errors: [],
    });
  });

  it('should throw an error for invalid response format', () => {
    service.getMembers().subscribe({
      next: () => {
        throw new Error('Expected error, but got success');
      },
      error: (err) => {
        expect(err.message).toBe('Invalid members response');
      },
    });

    const req = httpTestingController.expectOne(`${apiBaseUrl}?pageNumber=1&pageSize=10`);
    req.flush({
      success: true,
      data: {}, // Not an array
      pagination: null,
      errors: [],
    });
  });
});
