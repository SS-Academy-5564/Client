import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { catchError, finalize, of, Subscription } from 'rxjs';
import { Member, MembersService } from '@core/services/members.service';
import { PaginationComponent } from '@shared/ui/pagination/pagination.component';

const failedToLoadMembersMessage = $localize`:@@membersErrorFailedToLoad:Failed to load members`;

type PendingInvitation = {
  email: string;
  role: string;
  invited: string;
};

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatMenuModule, MatProgressSpinnerModule, PaginationComponent],
  templateUrl: './members.component.html',
  styleUrl: './members.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MembersComponent {
  protected readonly isLoading = signal(true);
  protected readonly hasError = signal(false);

  protected readonly members = signal<Member[]>([]);
  protected readonly pendingInvitations = signal<PendingInvitation[]>([]);

  /** The total number of members across all pages. */
  protected readonly totalCount = signal(0);
  /** The current active page number (1-indexed). */
  protected readonly pageNumber = signal(1);
  /** The number of members displayed per page. */
  protected readonly pageSize = signal(10);
  /** The total number of available pages. */
  protected readonly totalPages = signal(0);

  protected readonly totalMembers = computed(() => this.totalCount());
  protected readonly totalPending = computed(() => this.pendingInvitations().length);

  protected readonly selectedMember = signal<Member | null>(null);
  protected readonly selectedInvitation = signal<PendingInvitation | null>(null);

  protected readonly errorMessage = signal(failedToLoadMembersMessage);

  /** Creates a reactive members loader tied to the current pagination state. */
  constructor() {
    const membersService = inject(MembersService);

    effect((onCleanup) => {
      const subscription = this.loadMembers(membersService, this.pageNumber(), this.pageSize());
      onCleanup(() => {
        subscription.unsubscribe();
      });
    });
  }

  private loadMembers(membersService: MembersService, pageNumber: number, pageSize: number): Subscription {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.errorMessage.set(failedToLoadMembersMessage);

    return membersService
      .getMembers(pageNumber, pageSize)
      .pipe(
        catchError(() => {
          this.hasError.set(true);
          this.errorMessage.set(failedToLoadMembersMessage);

          return of({ members: [] as Member[], totalCount: 0, pageNumber: 1, pageSize: 10, totalPages: 0 });
        }),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe(({ members, totalCount, totalPages }) => {
        this.members.set(members);
        this.totalCount.set(totalCount);
        this.totalPages.set(totalPages);
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

  /**
   * Builds the localized accessible label for a role cell.
   *
   * @param role Member or invitation role.
   * @returns The localized role label.
   */
  protected getRoleAriaLabel(role: string): string {
    return $localize`:@@membersRoleCellAriaLabel:Role: ${role}:ROLE:`;
  }

  /**
   * Builds the localized accessible label for a member join date.
   *
   * @param joinedAt Member join date.
   * @returns The localized join-date label.
   */
  protected getJoinedAriaLabel(joinedAt: string): string {
    const joinedDate = this.formatJoinedDate(joinedAt);
    return $localize`:@@membersJoinedCellAriaLabel:Joined: ${joinedDate}:JOINED_DATE:`;
  }

  /**
   * Builds the localized accessible label for a row actions button.
   *
   * @param subject Member name or invitation email.
   * @returns The localized actions label.
   */
  protected getActionsAriaLabel(subject: string): string {
    return $localize`:@@membersActionsCellAriaLabel:Actions for ${subject}:SUBJECT:`;
  }

  protected selectMember(member: Member): void {
    this.selectedMember.set(member);
  }

  protected selectInvitation(invitation: PendingInvitation): void {
    this.selectedInvitation.set(invitation);
  }

  /**
   * Handles user requests to change the active page.
   *
   * @param pageNumber The new page number to navigate to.
   */
  protected onPageChange(pageNumber: number): void {
    if (pageNumber < 1 || pageNumber > this.totalPages() || pageNumber === this.pageNumber()) {
      return;
    }

    this.pageNumber.set(pageNumber);
  }

  /**
   * Handles user requests to change the number of items per page.
   * Resets the active page back to 1.
   *
   * @param pageSize The new page size selected by the user.
   */
  protected onPageSizeChange(pageSize: number): void {
    if (pageSize === this.pageSize()) {
      return;
    }

    this.pageSize.set(pageSize);
    this.pageNumber.set(1);
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
