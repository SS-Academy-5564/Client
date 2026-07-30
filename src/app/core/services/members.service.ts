import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiResponse } from '@core/models/api-response';

export type Member = {
  userId: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
};

export type MemberPage = {
  members: Member[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

@Injectable({
  providedIn: 'root',
})
export class MembersService {
  private readonly http = inject(HttpClient);
  private readonly membersApiUrl = `${environment.apiBaseUrl}/members`;

  getMembers(pageNumber = 1, pageSize = 10): Observable<MemberPage> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    return this.http.get<ApiResponse<Member[]>>(this.membersApiUrl, { params }).pipe(
      map((response) => {
        if (!response?.success || !Array.isArray(response.data) || !response.pagination) {
          throw new Error('Invalid members response');
        }

        return {
          members: response.data,
          pageNumber: response.pagination.pageNumber,
          pageSize: response.pagination.pageSize,
          totalCount: response.pagination.totalCount,
          totalPages: response.pagination.totalPages,
        };
      }),
    );
  }
}
