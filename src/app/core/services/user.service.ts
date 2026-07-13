import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  getMe() {
    return this.http.get<ApiResponse<CurrentUser>>(`${this.apiUrl}/me`);
  }

  getMyOrganizations() {
    return this.http.get<ApiResponse<Organization[]>>(`${this.apiUrl}/me/organizations`);
  }
}
