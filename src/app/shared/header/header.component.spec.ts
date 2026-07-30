import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ROUTES } from '@core/constants/route.constants';
import { AuthService } from '@core/services/auth.service';
import { HeaderComponent } from './header.component';

type AuthServiceMock = {
  isAuthenticated: WritableSignal<boolean>;
  displayName: WritableSignal<string | null>;
  userInitials: WritableSignal<string | null>;
  logout: ReturnType<typeof vi.fn>;
};

describe('HeaderComponent', () => {
  let authServiceMock: AuthServiceMock;
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let router: Router;

  beforeEach(async () => {
    authServiceMock = {
      isAuthenticated: signal(false),
      displayName: signal<string | null>(null),
      userInitials: signal<string | null>(null),
      logout: vi.fn().mockReturnValue(of(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        provideRouter([{ path: 'login', component: HeaderComponent }]),
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

  it('should hide user actions while unauthenticated', () => {
    authServiceMock.isAuthenticated.set(false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.header-user-actions')).toBeNull();
  });

  it('should show current-user initials and name while authenticated', () => {
    authServiceMock.isAuthenticated.set(true);
    authServiceMock.userInitials.set('JD');
    authServiceMock.displayName.set('Jane Doe');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.user-avatar')?.textContent?.trim()).toBe('JD');
    expect(compiled.querySelector('.user-name')?.textContent?.trim()).toBe('Jane Doe');
  });

  it('should show safe fallback values when current-user data is unavailable', () => {
    authServiceMock.isAuthenticated.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.user-avatar')?.textContent?.trim()).toBe('U');
    expect(compiled.querySelector('.user-name')?.textContent?.trim()).toBe('User');
  });

  it('should call backend logout and navigate to login', () => {
    component.onLogout();

    expect(authServiceMock.logout).toHaveBeenCalledOnce();
    expect(router.navigate).toHaveBeenCalledWith([ROUTES.LOGIN]);
  });

  it('should navigate to login even when backend logout fails', () => {
    authServiceMock.logout.mockReturnValue(throwError(() => new Error('Network failure')));

    component.onLogout();

    expect(router.navigate).toHaveBeenCalledWith([ROUTES.LOGIN]);
  });
});
