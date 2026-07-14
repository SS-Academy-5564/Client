import { environment } from '@/environments/environment';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, map, Observable, tap, throwError } from 'rxjs';
import { ApiResponse } from '../models/login-model';
import { MonitorModel } from '../models/monitor-model';

@Injectable({ providedIn: 'root' })
export class MonitorService {
  private readonly http = inject(HttpClient);
  private readonly monitorBaseEndpoint = `${environment.apiBaseUrl}/monitors`;

  readonly isLoading = signal<boolean>(false);
  readonly errors = signal<string | null>(null);

  getMonitors(): Observable<MonitorModel[]> {
    this.isLoading.set(true);
    this.clearErrors();

    return this.http.get<ApiResponse<MonitorModel[]>>(this.monitorBaseEndpoint).pipe(
      map((response) => response.data ?? []),
      tap(this.clearErrors),
      catchError((err) => {
        this.errors.set('Failed to load monitors');
        return throwError(() => err);
      }),
      finalize(() => this.isLoading.set(false)),
    );
  }

  clearErrors(): void {
    this.errors.set(null);
  }
}
