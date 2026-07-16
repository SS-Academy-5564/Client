import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { catchError, finalize, map, of } from 'rxjs';

import { environment } from '@environments/environment';
import { ApiResponse } from '@core/models/login-model';

const failedToLoadMembersMessage = $localize`:@@membersErrorFailedToLoad:Failed to load members`;

type Member = {
  userId: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
};

type PendingInvitation = {
  email: string;
  role: string;
  invited: string;
};

const MOCK_PENDING_INVITATIONS: PendingInvitation[] = [
  {
    email: 'alex@acme.com',
    role: 'Viewer',
    invited: '2 days ago',
  },
  {
    email: 'recruit@partner.io',
    role: 'User',
    invited: '1 week ago',
  },
];

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatMenuModule, MatProgressSpinnerModule],
  templateUrl: './members.component.html',
  styleUrl: './members.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MembersComponent {
  protected readonly isLoading = signal(true);
  protected readonly hasError = signal(false);

  protected readonly members = signal<Member[]>([]);
  protected readonly pendingInvitations = signal<PendingInvitation[]>(MOCK_PENDING_INVITATIONS);

  protected readonly totalCount = signal(0);

  protected readonly totalMembers = computed(() => this.totalCount());
  protected readonly totalPending = computed(() => this.pendingInvitations().length);

  protected readonly selectedMember = signal<Member | null>(null);
  protected readonly selectedInvitation = signal<PendingInvitation | null>(null);

  protected readonly errorMessage = signal(failedToLoadMembersMessage);

  private readonly http = inject(HttpClient);

  constructor() {
    this.loadMembers();
  }

  private loadMembers(): void {
    this.hasError.set(false);
    this.errorMessage.set(failedToLoadMembersMessage);

    this.http
      .get<ApiResponse<{ totalCount: number; members: Member[] }>>(`${environment.apiBaseUrl}/members`)
      .pipe(
        map((response) => {
          if (response?.success && Array.isArray(response.data?.members)) {
            this.totalCount.set(response.data.totalCount ?? 0);
            return response.data.members;
          }

          this.totalCount.set(0);
          this.hasError.set(true);
          this.errorMessage.set(failedToLoadMembersMessage);

          return [];
        }),
        catchError(() => {
          this.totalCount.set(0);
          this.hasError.set(true);
          this.errorMessage.set(failedToLoadMembersMessage);

          return of([]);
        }),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe((members) => {
        this.members.set(members);
      });
  }

  protected initials(fullName: string): string {
    return fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  protected formatJoinedDate(joinedAt: string): string {
    const date = new Date(joinedAt);

    if (Number.isNaN(date.getTime())) {
      return joinedAt;
    }

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  protected roleBadgeClass(role: string): Record<string, boolean> {
    const normalizedRole = role.trim().toLowerCase();

    return {
      'role-badge--user': normalizedRole === 'user',
      'role-badge--viewer': normalizedRole === 'viewer',
      'role-badge--default': normalizedRole !== 'user' && normalizedRole !== 'viewer',
    };
  }

  protected selectMember(member: Member): void {
    this.selectedMember.set(member);
  }

  protected selectInvitation(invitation: PendingInvitation): void {
    this.selectedInvitation.set(invitation);
  }

  protected handleInviteMember(): void {}

  protected handleEditMemberRole(): void {}

  protected handleRemoveMember(): void {}

  protected handleResendInvitation(): void {}

  protected handleCancelInvitation(): void {}
}
