import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { environment } from '@/environments/environment';
import { CreateOrganizationData } from '@core/models/create-organization-response';
import { ApiResponse } from '@core/models/api-response';
import { DefaultOrganizationResponse } from '@core/models/default-organization-response';

@Injectable({
  providedIn: 'root',
})
export class OrganizationService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/organizations`;
  private defaultOrganizationId$?: Observable<string>;

  createOrganization(name: string): Observable<ApiResponse<CreateOrganizationData>> {
    return this.http.post<ApiResponse<CreateOrganizationData>>(this.apiUrl, { name });
  }

  getMyOrganization(): Observable<ApiResponse<{ organizationId: string }>> {
    return this.http.get<ApiResponse<{ organizationId: string }>>(`${this.apiUrl}/my`);
  }

  getDefaultOrganization(): Observable<ApiResponse<DefaultOrganizationResponse>> {
    return this.http.get<ApiResponse<DefaultOrganizationResponse>>(`${this.apiUrl}/default`);
  }

  getDefaultOrganizationId(): Observable<string> {
    if (!this.defaultOrganizationId$) {
      this.defaultOrganizationId$ = this.getDefaultOrganization().pipe(
        map((response): string => response.data.defaultOrganizationId),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }
    return this.defaultOrganizationId$;
  }
}
