import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '@environments/environment';
import { MembersComponent } from './members.component';

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

type MembersComponentTestApi = {
  getInitials(fullName: string): string;
  formatJoinedDate(joinedAt: string): string;
  roleBadgeClass(role: string): Record<string, boolean>;
  selectMember(member: Member): void;
  selectInvitation(invitation: PendingInvitation): void;
  handleInviteMember(): void;
  handleEditMemberRole(): void;
  handleRemoveMember(): void;
  handleResendInvitation(): void;
  handleCancelInvitation(): void;
  selectedMember: () => Member | null;
  selectedInvitation: () => PendingInvitation | null;
  onPageChange(pageNumber: number): void;
  onPageSizeChange(pageSize: number): void;
  pageNumber: () => number;
  pageSize: () => number;
};

const SAMPLE_MEMBER: Member = {
  userId: 'c1000000-0000-0000-0000-000000000001',
  name: 'John Doe',
  email: 'email@mail.com',
  role: 'User',
  joinedAt: '2026-07-04T15:39:23Z',
};

const SAMPLE_INVITATION: PendingInvitation = {
  email: 'alex@acme.com',
  role: 'Viewer',
  invited: '2 days ago',
};

describe('MembersComponent', () => {
  let fixture: ComponentFixture<MembersComponent>;
  let component: MembersComponent;
  let httpTestingController: HttpTestingController;

  const membersUrl = `${environment.apiBaseUrl}/members`;

  const api = (): MembersComponentTestApi => component as unknown as MembersComponentTestApi;

  const flushMembers = (body: unknown): void => {
    const requests = httpTestingController.match((req) => req.url.startsWith(membersUrl));
    expect(requests.length).toBe(1);
    const request = requests[0];

    expect(request.request.method).toBe('GET');

    request.flush(body as never);
    fixture.detectChanges();
  };

  const flushOk = (totalCount: number, members: Member[], pageNumber = 1, pageSize = 10): void => {
    flushMembers({
      success: true,
      data: members,
      pagination: {
        pageNumber,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize) || 1,
      },
      errors: [],
    });
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MembersComponent, NoopAnimationsModule, HttpClientTestingModule],
    }).compileComponents();

    httpTestingController = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(MembersComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should create', () => {
    fixture.detectChanges();

    flushOk(0, []);

    expect(component).toBeTruthy();
  });

  it('should display loading state initially', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Loading members');

    const requests = httpTestingController.match((req) => req.url.startsWith(membersUrl));
    expect(requests.length).toBe(1);
    const request = requests[0];

    expect(request.request.method).toBe('GET');

    request.flush({
      success: true,
      data: [],
      pagination: {
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
      },
      errors: [],
    });

    fixture.detectChanges();
  });

  it('should render member rows after loading', () => {
    fixture.detectChanges();

    flushOk(1, [SAMPLE_MEMBER]);

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('.member-row')).toHaveLength(1);
    expect(compiled.querySelector('.members-count')?.textContent?.trim()).toBe('1');
    expect(compiled.querySelector('.member-name')?.textContent).toContain('John Doe');
    expect(compiled.querySelector('.member-email')?.textContent).toContain('email@mail.com');
  });

  it('should render accessible role and joined labels for members', () => {
    fixture.detectChanges();

    flushOk(1, [SAMPLE_MEMBER]);

    const compiled = fixture.nativeElement as HTMLElement;
    const roleCell = compiled.querySelector('.member-row .col-role');
    const joinedCell = compiled.querySelector('.member-row .col-joined');

    expect(roleCell?.getAttribute('aria-label')).toBe('Role: User');
    expect(joinedCell?.getAttribute('aria-label')).toContain('Joined:');
  });

  it('should render empty pending invitations state when no invitations exist', () => {
    fixture.detectChanges();

    flushOk(0, []);

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('.pending-row')).toHaveLength(0);
    expect(compiled.textContent).toContain('No pending invitations');
  });

  it('should show error when loading members fails', () => {
    fixture.detectChanges();

    const requests = httpTestingController.match((req) => req.url.startsWith(membersUrl));
    expect(requests.length).toBe(1);
    const request = requests[0];

    request.flush('server error', {
      status: 500,
      statusText: 'Internal Server Error',
    });

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.error-state')?.textContent).toContain('Failed to load members');
  });

  it('should show error when response is malformed', () => {
    fixture.detectChanges();

    flushMembers({
      success: true,
      data: null,
      pagination: null,
      errors: [],
    });

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.error-state')?.textContent).toContain('Failed to load members');
    expect(compiled.querySelectorAll('.member-row')).toHaveLength(0);
  });

  it('should show error when success is false', () => {
    fixture.detectChanges();

    flushMembers({
      success: false,
      data: null,
      pagination: null,
      errors: ['not authorized'],
    });

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.error-state')?.textContent).toContain('Failed to load members');
  });

  it('should default totalCount to zero', () => {
    fixture.detectChanges();

    flushMembers({
      success: true,
      data: [],
      pagination: {
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
      },
      errors: [],
    });

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.members-count')?.textContent?.trim()).toBe('0');
  });

  it('should compute initials, format dates and return role classes', () => {
    fixture.detectChanges();

    flushOk(0, []);

    expect(api().getInitials('Jane Doe')).toBe('JD');
    expect(api().getInitials('  John   Smith  ')).toBe('JS');
    expect(api().getInitials('')).toBe('');
    expect(api().getInitials('   ')).toBe('');

    expect(api().formatJoinedDate('invalid-date')).toBe('invalid-date');

    expect(api().roleBadgeClass('User')).toEqual({
      'role-badge--user': true,
      'role-badge--viewer': false,
      'role-badge--default': false,
    });

    expect(api().roleBadgeClass('Viewer')).toEqual({
      'role-badge--user': false,
      'role-badge--viewer': true,
      'role-badge--default': false,
    });

    expect(api().roleBadgeClass('Admin')).toEqual({
      'role-badge--user': false,
      'role-badge--viewer': false,
      'role-badge--default': true,
    });
  });

  it('should select member and invitation', () => {
    fixture.detectChanges();

    flushOk(1, [SAMPLE_MEMBER]);

    api().selectMember(SAMPLE_MEMBER);
    api().selectInvitation(SAMPLE_INVITATION);

    expect(api().selectedMember()).toEqual(SAMPLE_MEMBER);
    expect(api().selectedInvitation()).toEqual(SAMPLE_INVITATION);
  });

  it('should execute action handlers without errors', () => {
    fixture.detectChanges();

    flushOk(0, []);

    expect(() => api().handleInviteMember()).not.toThrow();
    expect(() => api().handleEditMemberRole()).not.toThrow();
    expect(() => api().handleRemoveMember()).not.toThrow();
    expect(() => api().handleResendInvitation()).not.toThrow();
    expect(() => api().handleCancelInvitation()).not.toThrow();
  });

  it('should handle pagination changes', (): void => {
    fixture.detectChanges();
    flushOk(25, [SAMPLE_MEMBER], 1, 10);

    api().onPageChange(2);
    fixture.detectChanges();
    flushOk(25, [SAMPLE_MEMBER], 2, 10);
    expect(api().pageNumber()).toBe(2);

    api().onPageSizeChange(20);
    fixture.detectChanges();
    flushOk(25, [SAMPLE_MEMBER], 1, 20);
    expect(api().pageNumber()).toBe(1);
    expect(api().pageSize()).toBe(20);
  });
});
