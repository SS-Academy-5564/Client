import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';
import { CreateOrganizationData } from '../models/create-organization-response';
import { ApiResponse } from '../models/api-response';
import { DefaultOrganizationResponse } from '../models/default-organization-response';

@Injectable({
  providedIn: 'root',
})
export class OrganizationService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/organizations`;

  createOrganization(name: string): Observable<ApiResponse<CreateOrganizationData>> {
    return this.http.post<ApiResponse<CreateOrganizationData>>(this.apiUrl, { name });
  }

  getMyOrganization(): Observable<ApiResponse<{ organizationId: string }>> {
    return this.http.get<ApiResponse<{ organizationId: string }>>(`${this.apiUrl}/my`);
  }

  getDefaultOrganization(): Observable<ApiResponse<DefaultOrganizationResponse>> {
    return this.http.get<ApiResponse<DefaultOrganizationResponse>>(`${this.apiUrl}/default`);
  }
}
