import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '@environments/environment';
import { CreateWidgetRequest, CreateWidgetResult, Widget } from '@core/models/widget.model';
import { WidgetService } from './widget.service';

describe('WidgetService', (): void => {
  let service: WidgetService;
  let httpTesting: HttpTestingController;

  beforeEach((): void => {
    TestBed.configureTestingModule({
      providers: [WidgetService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(WidgetService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach((): void => {
    httpTesting.verify();
  });

  it('should be created', (): void => {
    expect(service).toBeTruthy();
  });

  describe('createWidget', (): void => {
    it('should POST request to /dashboard/widgets and return result', (): void => {
      const request: CreateWidgetRequest = {
        dashboardTabId: 'tab-1',
        monitorId: 'mon-1',
        type: 'line-chart',
        title: 'Response Time',
        subtitle: 'Last 24h',
        metric: 'responseTime',
        timeRange: '2026-08-12T10:00:00.000Z',
        settings: null,
      };

      const mockResult: CreateWidgetResult = {
        widgetId: 'new-widget-123',
      };

      let result: CreateWidgetResult | undefined;
      service.createWidget(request).subscribe((res): void => {
        result = res;
      });

      const httpRequest = httpTesting.expectOne(`${environment.apiBaseUrl}/dashboard/widgets`);
      expect(httpRequest.request.method).toBe('POST');
      expect(httpRequest.request.body).toEqual(request);
      httpRequest.flush(mockResult);

      expect(result).toEqual(mockResult);
    });
  });

  describe('getWidgets', (): void => {
    const tabId = '00000000-0000-0000-0000-000000000001';

    it('should GET widgets and return them as-is from the API', (): void => {
      const rawApiResponse = {
        data: [
          {
            id: 'widget-1',
            dashboardTabId: tabId,
            monitorId: 'mon-1',
            type: 'line-chart',
            title: 'Latency',
            metric: 'responseTime',
            timeRange: '2026-08-12T10:00:00.000Z',
            settings: null,
            value: [120.5, 95.2, 140.0],
          },
          {
            id: 'widget-2',
            dashboardTabId: tabId,
            monitorId: 'mon-2',
            type: 'stat-card',
            title: 'Availability',
            metric: 'availability',
            timeRange: '2026-08-12T10:00:00.000Z',
            settings: null,
            value: [99.95],
          },
        ],
        pagination: null,
        success: true,
        errors: [],
      };

      let result: Widget[] | undefined;
      service.getWidgets(tabId).subscribe((response): void => {
        result = response.data;
      });

      const req = httpTesting.expectOne(`${environment.apiBaseUrl}/dashboard/${tabId}/widgets`);
      expect(req.request.method).toBe('GET');
      req.flush(rawApiResponse);

      expect(result).toHaveLength(2);
      expect(result![0].value).toEqual([120.5, 95.2, 140.0]);
      expect(result![1].value).toEqual([99.95]);
    });
  });
});
