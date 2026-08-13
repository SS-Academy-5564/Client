import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { CreateWidgetRequest } from '@/app/core/models/widget.model';
import { CreateWidgetResult } from '@/app/core/models/widget.model';
import { Widget } from '@/app/core/models/widget.model';
import { environment } from '@/environments/environment';
import { ApiResponse } from '@/app/core/models/api-response';

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

  createWidget(request: CreateWidgetRequest): Observable<CreateWidgetResult> {
    return this.http.post<CreateWidgetResult>(`${this.apiUrl}/widgets`, request);
  }

  getWidgets(dashboardTabId: string): Observable<ApiResponse<Widget[]>> {
    return this.http
      .get<ApiResponse<WidgetApiDto[]>>(`${this.apiUrl}/${dashboardTabId}/widgets`)
      .pipe(map((res) => ({ ...res, data: res.data.map(mapWidget) })));
  }
}
