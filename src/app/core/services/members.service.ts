import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiResponse } from '@core/models/api-response';

/**
 * Represents a single member with their role and join date.
 */
export type Member = {
  userId: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
};

/**
 * Represents a paginated list of members.
 */
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
/**
 * Service for managing and retrieving members.
 */
export class MembersService {
  private readonly http = inject(HttpClient);
  private readonly membersApiUrl = `${environment.apiBaseUrl}/members`;

  /**
   * Retrieves a paginated list of members.
   *
   * @param pageNumber The page number to retrieve, defaults to 1.
   * @param pageSize The number of members per page, defaults to 10.
   * @returns An observable that emits a MemberPage containing the paginated members.
   * @throws {Error} Throws an error if the API response is invalid or missing pagination data.
   */
  getMembers(pageNumber = 1, pageSize = 10): Observable<MemberPage> {
    const params = new HttpParams().set('pageNumber', pageNumber).set('pageSize', pageSize);

    return this.http.get<ApiResponse<Member[]>>(this.membersApiUrl, { params }).pipe(
      map((response) => {
        if (!this.isValidMembersResponse(response)) {
          throw new Error('Invalid members response');
        }

        const pag = response.pagination!;
        return {
          members: response.data,
          pageNumber: pag.pageNumber,
          pageSize: pag.pageSize,
          totalCount: pag.totalCount,
          totalPages: pag.totalPages,
        };
      }),
    );
  }

  private isValidMembersResponse(response: ApiResponse<Member[]>): boolean {
    const pag = response?.pagination;
    return (
      response?.success &&
      Array.isArray(response.data) &&
      !!pag &&
      typeof pag.pageNumber === 'number' &&
      typeof pag.pageSize === 'number' &&
      typeof pag.totalCount === 'number' &&
      typeof pag.totalPages === 'number'
    );
  }
}
