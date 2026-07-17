import { environment } from '@/environments/environment';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, map, Observable, tap, throwError } from 'rxjs';
import { ApiResponse } from '../models/login-model';
import { CreateMonitorRequest, MonitorModel } from '../models/monitor-model';

@Injectable({ providedIn: 'root' })
export class MonitorService {
  private readonly http = inject(HttpClient);
  private readonly monitorBaseEndpoint = `${environment.apiBaseUrl}/monitors`;

  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  getMonitors(): Observable<MonitorModel[]> {
    this.isLoading.set(true);
    this.clearError();

    return this.http.get<ApiResponse<MonitorModel[]>>(this.monitorBaseEndpoint).pipe(
      map((response) => response.data ?? []),
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
