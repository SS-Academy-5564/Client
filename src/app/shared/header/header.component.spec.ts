import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';

import { HeaderComponent } from './header.component';
import { TokenStorageService } from '@core/services/token-storage.service';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tokenStorageMock: any;
  let router: Router;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let isAuthenticatedSignal: any;

  beforeEach(async () => {
    isAuthenticatedSignal = signal(false);
    tokenStorageMock = {
      isAuthenticated: isAuthenticatedSignal,
      clearToken: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        { provide: TokenStorageService, useValue: tokenStorageMock },
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

  it('should show register button when not logged in', () => {
    isAuthenticatedSignal.set(false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    console.log('COMPILED HTML:', compiled.innerHTML);
    const buttons = compiled.querySelectorAll('app-button');
    expect(buttons.length).toBe(1);
    expect(buttons[0].getAttribute('label')).toBe('Register');
  });

  it('should show logout button when logged in', () => {
    isAuthenticatedSignal.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('app-button');
    expect(buttons.length).toBe(1);
    expect(buttons[0].getAttribute('label')).toBe('Log out');
  });

  it('should call tokenStorage.clearToken and navigate on logout click', () => {
    isAuthenticatedSignal.set(true);
    fixture.detectChanges();

    component.onLogout();
    expect(tokenStorageMock.clearToken).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should show log in button when not logged in and on register page', () => {
    isAuthenticatedSignal.set(false);
    component.currentUrl.set('/register');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('app-button');
    expect(buttons.length).toBe(1);
    expect(buttons[0].getAttribute('label')).toBe('Log in');
  });
});
