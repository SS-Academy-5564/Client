import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { CreateWidgetRequest } from '@/app/core/models/widget.model';
import { CreateWidgetResult } from '@/app/core/models/widget.model';
import { UpdateWidgetRequest } from '@/app/core/models/widget.model';
import { Widget } from '@/app/core/models/widget.model';
import { environment } from '@/environments/environment';
import { ApiResponse } from '@/app/core/models/api-response';

@Injectable({
  providedIn: 'root',
})
export class WidgetService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/dashboard`;

  createWidget(request: CreateWidgetRequest): Observable<CreateWidgetResult> {
    return this.http.post<CreateWidgetResult>(`${this.apiUrl}/widgets`, request);
  }

  updateWidget(request: UpdateWidgetRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/widgets/${request.widgetId}`, request);
  }

  getWidgets(dashboardTabId: string): Observable<ApiResponse<Widget[]>> {
    return this.http.get<ApiResponse<Widget[]>>(`${this.apiUrl}/${dashboardTabId}/widgets`);
  }
}
