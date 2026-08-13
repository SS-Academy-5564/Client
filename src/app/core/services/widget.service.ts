import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { CreateWidgetRequest, CreateWidgetResult, Widget } from '@core/models/widget.model';
import { ApiResponse } from '@core/models/api-response';
import { environment } from '@/environments/environment';

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
   * @returns An observable with the API response containing widget data.
   */
  getWidgets(dashboardTabId: string): Observable<ApiResponse<Widget[]>> {
    return this.http.get<ApiResponse<Widget[]>>(`${this.apiUrl}/${dashboardTabId}/widgets`);
  }
}
