import { HttpClient } from '@angular/common/http';
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

export type MembersResponseData = {
  totalCount: number;
  members: Member[];
};

@Injectable({
  providedIn: 'root',
})
export class MembersService {
  private readonly http = inject(HttpClient);
  private readonly membersApiUrl = `${environment.apiBaseUrl}/members`;

  getMembers(): Observable<MembersResponseData> {
    return this.http.get<ApiResponse<MembersResponseData>>(this.membersApiUrl).pipe(
      map((response) => {
        if (!response?.success || !Array.isArray(response.data?.members)) {
          throw new Error('Invalid members response');
        }

        return {
          members: response.data.members,
          totalCount: response.data.totalCount ?? 0,
        };
      }),
    );
  }
}
