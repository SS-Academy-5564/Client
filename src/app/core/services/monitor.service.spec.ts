import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '@environments/environment';
import { MonitorModel, MonitorStatus } from '../models/monitor-model';
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

  it('should return monitors from the response data', () => {
    const monitors: MonitorModel[] = [
      {
        id: 'b47c433e-f36b-1410-8416-00a08332bbd7',
        name: 'Billing Service API',
        url: 'https://api.pulse.dev/billing/v1/health',
        currentValue: '99.98%',
        lastCheckedAt: '2026-07-13T10:11:04.5066667+00:00',
        status: MonitorStatus.Enabled,
        interval: 60,
      },
    ];

    service.getMonitors().subscribe((result) => {
      expect(result).toEqual(monitors);
    });

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/monitors`);
    request.flush({ data: monitors, pagination: null, success: true, errors: [] });

    expect(service.isLoading()).toBe(false);
    expect(service.errors()).toBeNull();
  });
});
