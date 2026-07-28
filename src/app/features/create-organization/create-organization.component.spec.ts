import { TestBed } from '@angular/core/testing';
import { CreateOrganizationComponent } from './create-organization.component';
import { OrganizationService } from '@core/services/organization.service';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { TokenStorageService } from '@core/services/token-storage.service';
import { ToastService } from '@core/services/toast.service';
import { ROUTES } from '@core/constants/route.constants';

describe('CreateOrganizationComponent', () => {
  let component: CreateOrganizationComponent;

  const orgServiceMock = {
    createOrganization: vi.fn(),
  };

  const tokenStorageMock = {
    setToken: vi.fn(),
  };

  const routerMock = {
    navigate: vi.fn(),
  };

  const toastServiceMock = {
    success: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateOrganizationComponent],
      providers: [
        { provide: OrganizationService, useValue: orgServiceMock },
        { provide: TokenStorageService, useValue: tokenStorageMock },
        { provide: Router, useValue: routerMock },
        { provide: ToastService, useValue: toastServiceMock },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(CreateOrganizationComponent);
    component = fixture.componentInstance;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be invalid if name is shorter than 3 chars', () => {
    component.form.setValue({ organizationName: 'ab' });

    expect(component.form.valid).toBe(false);
  });

  it('should be invalid if name is longer than 50 chars', () => {
    const longName = 'a'.repeat(51);
    component.form.setValue({ organizationName: longName });

    expect(component.form.valid).toBe(false);
  });

  it('should be valid for correct name', () => {
    component.form.setValue({ organizationName: 'Valid Org Name' });

    expect(component.form.valid).toBe(true);
  });

  it('should call service, set token and navigate on success', () => {
    const mockResponse = {
      data: {
        organizationId: '123',
        accessToken: 'token123',
      },
    };

    orgServiceMock.createOrganization.mockReturnValue(of(mockResponse));

    component.form.setValue({ organizationName: 'Valid Org' });

    component.onSubmit();

    expect(orgServiceMock.createOrganization).toHaveBeenCalledWith('Valid Org');
    expect(tokenStorageMock.setToken).toHaveBeenCalledWith('token123');
    expect(toastServiceMock.success).toHaveBeenCalledWith('Organization created successfully.');
    expect(routerMock.navigate).toHaveBeenCalledWith([ROUTES.OVERVIEW]);
  });

  it('should set error message on failure', () => {
    orgServiceMock.createOrganization.mockReturnValue(throwError(() => new Error('API error')));

    component.form.setValue({ organizationName: 'Valid Org' });

    component.onSubmit();

    expect(component.error()).toBe('Failed to create organization');
    expect(component.loading()).toBe(false);
  });
});
