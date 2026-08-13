import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '@environments/environment';
import { CreateWidgetRequest, CreateWidgetResult } from '@core/models/widget.model';
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

    it('should GET widgets and map chart types with numeric values and 1-based labels', (): void => {
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
            type: 'bar-chart',
            title: 'Requests',
            metric: 'requests',
            timeRange: '2026-08-12T10:00:00.000Z',
            settings: null,
            value: [500, 750],
          },
        ],
        pagination: null,
        success: true,
        errors: [],
      };

      service.getWidgets(tabId).subscribe((response): void => {
        expect(response.data).toHaveLength(2);

        const lineChart = response.data[0];
        expect(lineChart.chartData).toEqual({
          labels: ['1', '2', '3'],
          values: [120.5, 95.2, 140.0],
        });
        expect(lineChart.value).toBeUndefined();

        const barChart = response.data[1];
        expect(barChart.chartData).toEqual({
          labels: ['1', '2'],
          values: [500, 750],
        });
      });

      const req = httpTesting.expectOne(`${environment.apiBaseUrl}/dashboard/${tabId}/widgets`);
      expect(req.request.method).toBe('GET');
      req.flush(rawApiResponse);
    });

    it('should map stat-card with first value from array or fallback to --', (): void => {
      const rawApiResponse = {
        data: [
          {
            id: 'widget-stat-1',
            dashboardTabId: tabId,
            monitorId: 'mon-1',
            type: 'stat-card',
            title: 'Availability',
            metric: 'availability',
            timeRange: '2026-08-12T10:00:00.000Z',
            settings: null,
            value: [99.95],
          },
          {
            id: 'widget-stat-2',
            dashboardTabId: tabId,
            monitorId: 'mon-2',
            type: 'stat-card',
            title: 'Errors',
            metric: 'errors',
            timeRange: '2026-08-12T10:00:00.000Z',
            settings: null,
            value: [],
          },
        ],
        pagination: null,
        success: true,
        errors: [],
      };

      service.getWidgets(tabId).subscribe((response): void => {
        expect(response.data[0].value).toBe(99.95);
        expect(response.data[0].chartData).toBeUndefined();

        expect(response.data[1].value).toBe('--');
      });

      const req = httpTesting.expectOne(`${environment.apiBaseUrl}/dashboard/${tabId}/widgets`);
      req.flush(rawApiResponse);
    });

    it('should map horizontal-bar-chart and donut-chart types properly', (): void => {
      const rawApiResponse = {
        data: [
          {
            id: 'widget-donut',
            dashboardTabId: tabId,
            monitorId: 'mon-1',
            type: 'donut-chart',
            metric: 'requests',
            value: [100, 200, 300],
          },
          {
            id: 'widget-hbar',
            dashboardTabId: tabId,
            monitorId: 'mon-2',
            type: 'horizontal-bar-chart',
            metric: 'requests',
            value: [450],
          },
        ],
        pagination: null,
        success: true,
        errors: [],
      };

      service.getWidgets(tabId).subscribe((response): void => {
        expect(response.data[0].chartData).toEqual({
          labels: ['1', '2', '3'],
          values: [100, 200, 300],
        });
        expect(response.data[1].chartData).toEqual({
          labels: ['1'],
          values: [450],
        });
      });

      const req = httpTesting.expectOne(`${environment.apiBaseUrl}/dashboard/${tabId}/widgets`);
      req.flush(rawApiResponse);
    });
  });
});
