import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { catchError, finalize, of } from 'rxjs';
import { Member, MembersService } from '@core/services/members.service';

const failedToLoadMembersMessage = $localize`:@@membersErrorFailedToLoad:Failed to load members`;

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

  private readonly membersService = inject(MembersService);

  constructor() {
    this.loadMembers();
  }

  private loadMembers(): void {
    this.hasError.set(false);
    this.errorMessage.set(failedToLoadMembersMessage);

    this.membersService
      .getMembers()
      .pipe(
        catchError(() => {
          this.hasError.set(true);
          this.errorMessage.set(failedToLoadMembersMessage);

          return of({ members: [] as Member[], totalCount: 0 });
        }),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe(({ members, totalCount }) => {
        this.members.set(members);
        this.totalCount.set(totalCount);
      });
  }

  protected getInitials(fullName: string): string {
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

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected handleInviteMember(): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected handleEditMemberRole(): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected handleRemoveMember(): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected handleResendInvitation(): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected handleCancelInvitation(): void {}
}
