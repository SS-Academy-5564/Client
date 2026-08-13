import { environment } from '@/environments/environment';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, map, Observable, tap, throwError } from 'rxjs';
import { ApiError, ApiResponse } from '@core/models/api-response';
import {
  CreateMonitorRequest,
  MonitorDetail,
  MonitorModel,
  MonitorStatus,
  UpdateMonitorRequest,
} from '@core/models/monitor-model';

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
  private readonly defaultCheckErrorMessage = $localize`
    :@@monitorService.defaultCheckError:
    Unable to start the check right now.
  `;
  getMonitors(
    pageNumber = 1,
    pageSize = 10,
    status: MonitorStatus | null = null,
    searchString: string | null = null,
  ): Observable<MonitorPage> {
    this.isLoading.set(true);
    this.clearError();

    let params = new HttpParams().set('pageNumber', pageNumber).set('pageSize', pageSize);

    if (status !== null) {
      params = params.set('status', status);
    }

    if (searchString) {
      params = params.set('searchString', searchString);
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

  triggerMonitorCheck(monitorId: string): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.monitorBaseEndpoint}/${monitorId}/run-now`, {}).pipe(
      map((response) => {
        if (!response.success) {
          throw new Error(this.extractErrorMessageFromErrors(response.errors));
        }
      }),
      catchError((err: unknown) => {
        if (err instanceof HttpErrorResponse) {
          return throwError(() => new Error(this.extractErrorMessage(err)));
        }
        return throwError(() => err);
      }),
    );
  }

  /**
   * Creates a new monitor.
   * @param request - The monitor creation payload.
   * @returns The newly created monitor in list-projection shape.
   * @throws Error When the API response is successful but contains no data.
   */
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

  /**
   * Fetches the full detail for a single monitor.
   * @param id - The monitor GUID.
   * @returns The full {@link MonitorDetail} record.
   * @throws Error When the API response is successful but contains no data.
   */
  getMonitorById(id: string): Observable<MonitorDetail> {
    return this.http.get<ApiResponse<MonitorDetail>>(`${this.monitorBaseEndpoint}/${id}`).pipe(
      map((response) => {
        if (!response.data) {
          throw new Error('Monitor detail returned no data');
        }
        return response.data;
      }),
    );
  }

  /**
   * Updates an existing monitor.
   * @param id - The monitor GUID.
   * @param request - The update payload.
   * @returns The updated monitor in list-projection shape.
   * @throws Error When the API response is successful but contains no data.
   */
  updateMonitor(id: string, request: UpdateMonitorRequest): Observable<MonitorModel> {
    return this.http.put<ApiResponse<MonitorModel>>(`${this.monitorBaseEndpoint}/${id}`, request).pipe(
      map((response) => {
        if (!response.data) {
          throw new Error('Monitor update returned no data');
        }
        return response.data;
      }),
    );
  }

  /**
   * Updates only the status of an existing monitor.
   * @param id - The monitor GUID.
   * @param status - The new writeable status.
   * @param currentMonitor - The monitor currently displayed in the UI; used as a fallback when the backend does not return a payload.
   * @returns The updated monitor in list-projection shape.
   * @throws Error When the API response is successful but contains no data and no fallback monitor is available.
   */
  updateMonitorStatus(
    id: string,
    status: MonitorStatus.Enabled | MonitorStatus.Disabled,
    currentMonitor?: MonitorModel,
  ): Observable<MonitorModel> {
    return this.http.patch<ApiResponse<MonitorModel>>(`${this.monitorBaseEndpoint}/${id}/status`, { status }).pipe(
      map((response) => {
        if (response.data) {
          return response.data;
        }

        if (currentMonitor) {
          return { ...currentMonitor, status };
        }

        throw new Error($localize`:@@monitorStatusUpdateNoData:Monitor status update returned no data`);
      }),
    );
  }

  clearError(): void {
    this.error.set(null);
  }

  private extractErrorMessage(err: HttpErrorResponse): string {
    const body = err.error as ApiResponse<unknown> | null;
    if (body?.errors?.length) {
      return this.extractErrorMessageFromErrors(body.errors);
    }

    if (typeof err.message === 'string' && err.message.trim().length > 0) {
      return err.message;
    }

    return this.defaultCheckErrorMessage;
  }

  private extractErrorMessageFromErrors(errors: ApiError[]): string {
    return errors[0]?.message ?? this.defaultCheckErrorMessage;
  }
}
