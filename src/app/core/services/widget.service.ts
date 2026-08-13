import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiResponse } from '@core/models/api-response';
import { CreateWidgetRequest, CreateWidgetResult, UpdateWidgetRequest, Widget } from '@core/models/widget.model';
import { environment } from '@/environments/environment';

/**
 * Communicates with the dashboard widget endpoints.
 */
@Injectable({
  providedIn: 'root',
})
export class WidgetService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/dashboard`;

  /**
   * Creates a new dashboard widget.
   *
   * @param request The widget configuration to create.
   * @returns The identifier of the created widget.
   */
  createWidget(request: CreateWidgetRequest): Observable<CreateWidgetResult> {
    return this.http.post<CreateWidgetResult>(`${this.apiUrl}/widgets`, request);
  }

  /**
   * Updates the configuration of an existing widget.
   *
   * @param request The updated widget configuration.
   * @returns An observable that completes when the update finishes.
   */
  updateWidget(request: UpdateWidgetRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/widgets/${request.widgetId}`, request);
  }

  /**
   * Loads the widgets of a dashboard tab.
   *
   * @param dashboardTabId The identifier of the dashboard tab.
   * @returns The backend response containing the tab's widgets.
   */
  getWidgets(dashboardTabId: string): Observable<ApiResponse<Widget[]>> {
    return this.http.get<ApiResponse<Widget[]>>(`${this.apiUrl}/${dashboardTabId}/widgets`);
  }
}
