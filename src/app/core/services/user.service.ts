import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';
import { ApiResponse } from '../models/api-response';
import { CurrentUser } from '../models/user.model';
import { Organization } from '../models/organization.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/users`;

  getMe(): Observable<ApiResponse<CurrentUser>> {
    return this.http.get<ApiResponse<CurrentUser>>(`${this.apiUrl}/me`);
  }

  getMyOrganizations(): Observable<ApiResponse<Organization[]>> {
    return this.http.get<ApiResponse<Organization[]>>(`${this.apiUrl}/me/organizations`);
  }
}
