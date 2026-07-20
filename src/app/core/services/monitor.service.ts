import { environment } from '@/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, map, Observable, tap, throwError } from 'rxjs';
import { ApiResponse } from '@core/models/api-response';
import { CreateMonitorRequest, MonitorModel, MonitorStatus } from '@core/models/monitor-model';

export type MonitorPage = {
  items: MonitorModel[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

@Injectable({ providedIn: 'root' })
export class MonitorService {
  private readonly http = inject(HttpClient);
  private readonly monitorBaseEndpoint = `${environment.apiBaseUrl}/monitors`;

  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  getMonitors(pageNumber = 1, pageSize = 10, status: MonitorStatus | null = null): Observable<MonitorPage> {
    this.isLoading.set(true);
    this.clearError();

    let params = new HttpParams().set('pageNumber', pageNumber).set('pageSize', pageSize);

    if (status !== null) {
      params = params.set('status', status);
    }

    return this.http.get<ApiResponse<MonitorModel[]>>(this.monitorBaseEndpoint, { params }).pipe(
      map((response) => {
        if (!Array.isArray(response.data) || !response.pagination) {
          throw new Error('Invalid paginated monitors response');
        }

        return {
          items: response.data,
          pageNumber: response.pagination.pageNumber,
          pageSize: response.pagination.pageSize,
          totalCount: response.pagination.totalCount,
          totalPages: response.pagination.totalPages,
        };
      }),
      tap(() => this.clearError()),
      catchError((err) => {
        this.error.set('Failed to load monitors');
        return throwError(() => err);
      }),
      finalize(() => this.isLoading.set(false)),
    );
  }

  createMonitor(request: CreateMonitorRequest): Observable<MonitorModel> {
    return this.http.post<ApiResponse<MonitorModel>>(this.monitorBaseEndpoint, request).pipe(
      map((response) => {
        if (!response.data) {
          throw new Error('Monitor creation returned no data');
        }
        return response.data;
      }),
    );
  }

  clearError(): void {
    this.error.set(null);
  }
}
