import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '@environments/environment';
import { CreateMonitorRequest, MonitorModel, MonitorStatus } from '../models/monitor-model';
import { MonitorService } from './monitor.service';

describe('MonitorService', () => {
  let service: MonitorService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MonitorService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(MonitorService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should return monitors with pagination metadata', (): void => {
    const monitors: MonitorModel[] = [
      {
        id: 'b47c433e-f36b-1410-8416-00a08332bbd7',
        name: 'Billing Service API',
        url: 'https://api.pulse.dev/billing/v1/health',
        currentValue: '99.98%',
        lastCheckedAt: '2026-07-13T10:11:04.5066667+00:00',
        status: MonitorStatus.Enabled,
        interval: 60,
        organizationId: 'org-1',
      },
    ];

    service.getMonitors(2, 10, MonitorStatus.Enabled).subscribe((result): void => {
      expect(result).toEqual({
        items: monitors,
        pageNumber: 2,
        pageSize: 10,
        totalCount: 21,
        totalPages: 3,
      });
    });

    const request = httpTesting.expectOne(
      `${environment.apiBaseUrl}/monitors?pageNumber=2&pageSize=10&status=${MonitorStatus.Enabled}`,
    );
    request.flush({
      data: monitors,
      pagination: { pageNumber: 2, pageSize: 10, totalCount: 21, totalPages: 3 },
      success: true,
      errors: [],
    });

    expect(service.isLoading()).toBe(false);
    expect(service.error()).toBeNull();
  });

  it('should pass searchString query param when provided', (): void => {
    service.getMonitors(1, 10, null, 'billing').subscribe();

    const request = httpTesting.expectOne(
      `${environment.apiBaseUrl}/monitors?pageNumber=1&pageSize=10&searchString=billing`,
    );
    expect(request.request.method).toBe('GET');
    request.flush({
      data: [],
      pagination: { pageNumber: 1, pageSize: 10, totalCount: 0, totalPages: 0 },
      success: true,
      errors: [],
    });
  });

  it('should POST the request and return the created monitor', (): void => {
    const request: CreateMonitorRequest = {
      name: 'EUR/USD Rate',
      url: 'https://api.example.com/data',
      httpMethod: 'GET',
      resultPath: 'data.usd.rate',
      pollingIntervalSeconds: 300,
      pollingTimeoutSeconds: 10,
    };
    const created: MonitorModel = {
      id: 'new-monitor-id',
      name: 'EUR/USD Rate',
      url: 'https://api.example.com/data',
      currentValue: null,
      lastCheckedAt: null,
      status: MonitorStatus.Enabled,
      interval: 300,
      organizationId: 'org-1',
    };

    let result: MonitorModel | undefined;
    service.createMonitor(request).subscribe((monitor): void => {
      result = monitor;
    });

    const httpRequest = httpTesting.expectOne(`${environment.apiBaseUrl}/monitors`);
    expect(httpRequest.request.method).toBe('POST');
    expect(httpRequest.request.body).toEqual(request);
    httpRequest.flush({ data: created, pagination: null, success: true, errors: [] });

    expect(result).toEqual(created);
  });

  it('should POST to run-now and complete when the request succeeds', () => {
    let completed = false;

    service.triggerMonitorCheck('monitor-1').subscribe({
      next: () => {
        completed = true;
      },
    });

    const httpRequest = httpTesting.expectOne(`${environment.apiBaseUrl}/monitors/monitor-1/run-now`);
    expect(httpRequest.request.method).toBe('POST');
    expect(httpRequest.request.body).toEqual({});
    httpRequest.flush({ data: null, pagination: null, success: true, errors: [] });

    expect(completed).toBe(true);
  });

  it('should surface API error messages from run-now failures', () => {
    let errorMessage = '';

    service.triggerMonitorCheck('monitor-1').subscribe({
      error: (err: Error) => {
        errorMessage = err.message;
      },
    });

    const httpRequest = httpTesting.expectOne(`${environment.apiBaseUrl}/monitors/monitor-1/run-now`);
    httpRequest.flush(
      {
        data: null,
        pagination: null,
        success: false,
        errors: [
          {
            code: 'RateLimited',
            message: 'Manual check was already triggered recently. Please wait before trying again.',
          },
        ],
      },
      { status: 429, statusText: 'Too Many Requests' },
    );

    expect(errorMessage).toBe('Manual check was already triggered recently. Please wait before trying again.');
  });
});
