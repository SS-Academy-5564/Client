import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { CreateWidgetRequest, CreateWidgetResult, Widget } from '@core/models/widget.model';
import { ApiResponse } from '@core/models/api-response';
import { environment } from '@/environments/environment';

/** Raw shape returned by the server — value is an array of decimal/metric numbers. */
type WidgetApiDto = Omit<Widget, 'value' | 'chartData'> & {
  value: number[];
};

const CHART_TYPES = new Set(['line-chart', 'bar-chart', 'horizontal-bar-chart', 'donut-chart']);

function mapWidget(dto: WidgetApiDto): Widget {
  const { value, ...rest } = dto;
  const raw = value ?? [];

  if (CHART_TYPES.has(dto.type)) {
    return {
      ...rest,
      chartData: {
        labels: raw.map((_, i) => String(i + 1)),
        values: raw,
      },
    };
  }

  // stat-card: single aggregate value
  return {
    ...rest,
    value: raw.length > 0 ? raw[0] : '--',
  };
}

@Injectable({
  providedIn: 'root',
})
export class WidgetService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/dashboard`;

  /**
   * Creates a new dashboard widget.
   * @param request The widget creation request payload.
   * @returns An observable containing the result with the newly created widget ID.
   */
  createWidget(request: CreateWidgetRequest): Observable<CreateWidgetResult> {
    return this.http.post<CreateWidgetResult>(`${this.apiUrl}/widgets`, request);
  }

  /**
   * Retrieves all dashboard widgets for the given dashboard tab.
   * @param dashboardTabId The unique identifier of the dashboard tab.
   * @returns An observable with the API response containing mapped widget data.
   */
  getWidgets(dashboardTabId: string): Observable<ApiResponse<Widget[]>> {
    return this.http
      .get<ApiResponse<WidgetApiDto[]>>(`${this.apiUrl}/${dashboardTabId}/widgets`)
      .pipe(map((res) => ({ ...res, data: res.data.map(mapWidget) })));
  }
}
