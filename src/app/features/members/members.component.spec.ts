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
    const request = httpTestingController.expectOne(membersUrl);

    expect(request.request.method).toBe('GET');

    request.flush(body as never);
    fixture.detectChanges();
  };

  const flushOk = (totalCount: number, members: Member[]): void => {
    flushMembers({
      success: true,
      data: {
        totalCount,
        members,
      },
      pagination: null,
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

    const request = httpTestingController.expectOne(membersUrl);

    expect(request.request.method).toBe('GET');

    request.flush({
      success: true,
      data: {
        totalCount: 0,
        members: [],
      },
      pagination: null,
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

    const request = httpTestingController.expectOne(membersUrl);

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
      data: {
        totalCount: 0,
        members: null,
      },
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
      data: {
        members: [],
      },
      pagination: null,
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
});
