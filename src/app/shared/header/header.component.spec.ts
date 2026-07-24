import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { HeaderComponent } from './header.component';
import { TokenStorageService } from '@core/services/token-storage.service';
import { AuthService } from '@core/services/auth.service';
import { ROUTES } from '@core/constants/route.constants';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tokenStorageMock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let authServiceMock: any;
  let router: Router;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let isAuthenticatedSignal: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let userInitialsSignal: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let displayNameSignal: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let authUserInitialsSignal: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let currentUserSignal: any;

  beforeEach(async () => {
    isAuthenticatedSignal = signal(false);
    userInitialsSignal = signal<string | null>(null);
    displayNameSignal = signal<string | null>(null);
    authUserInitialsSignal = signal<string | null>(null);
    currentUserSignal = signal<unknown | null>(null);

    tokenStorageMock = {
      isAuthenticated: isAuthenticatedSignal,
      userInitials: userInitialsSignal,
      displayName: signal<string | null>(null),
    };

    authServiceMock = {
      currentUser: currentUserSignal,
      displayName: displayNameSignal,
      userInitials: authUserInitialsSignal,
      loadCurrentUser: vi.fn().mockReturnValue(of(null)),
      logout: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        { provide: TokenStorageService, useValue: tokenStorageMock },
        { provide: AuthService, useValue: authServiceMock },
        provideRouter([{ path: 'register', component: HeaderComponent }]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not show user actions when not logged in', () => {
    isAuthenticatedSignal.set(false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const userActions = compiled.querySelector('.header-user-actions');

    expect(userActions).toBeNull();
    expect(authServiceMock.loadCurrentUser).not.toHaveBeenCalled();
  });

  it('should load current user when authenticated and user is not loaded', () => {
    isAuthenticatedSignal.set(true);

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(authServiceMock.loadCurrentUser).toHaveBeenCalledTimes(1);
  });

  it('should show user initials and name from auth service when logged in', () => {
    isAuthenticatedSignal.set(true);
    authUserInitialsSignal.set('JD');
    displayNameSignal.set('Jane Doe');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const initials = compiled.querySelector('.user-avatar');
    const userName = compiled.querySelector('.user-name');

    expect(initials?.textContent?.trim()).toBe('JD');
    expect(userName?.textContent?.trim()).toBe('Jane Doe');
  });

  it('should call authService.logout and navigate on logout click', () => {
    isAuthenticatedSignal.set(true);
    fixture.detectChanges();

    component.onLogout();
    expect(authServiceMock.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith([ROUTES.LOGIN]);
  });

  it('should show default user values when backend me data is missing', () => {
    isAuthenticatedSignal.set(false);
    isAuthenticatedSignal.set(true);
    userInitialsSignal.set('TK');
    tokenStorageMock.displayName.set('Token User');

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const initials = compiled.querySelector('.user-avatar');
    const userName = compiled.querySelector('.user-name');

    expect(initials?.textContent?.trim()).toBe('U');
    expect(userName?.textContent?.trim()).toBe('User');
  });
});
