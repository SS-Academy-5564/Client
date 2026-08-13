import { Routes } from '@angular/router';
import { loggedOutOnlyGuard } from './core/guards/logged-out-only-guard';
import { authGuard } from '@core/guards/auth.guard';
import { noOrganizationGuard } from '@core/guards/no-organization.guard';
import { authenticatedGuard } from './core/guards/authenticated-guard';
import { organizationGuard } from './core/guards/organization.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authenticatedGuard, organizationGuard],
    loadComponent: () => import('./layout/layout/layout').then((m) => m.LayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'overview',
      },
      {
        path: 'overview',
        loadComponent: () => import('./features/overview/overview.component').then((m) => m.OverviewComponent),
      },
      {
        path: 'monitors',
        canActivate: [],
        loadComponent: () => import('./features/monitor/monitor.component').then((m) => m.MonitorComponent),
      },
      {
        path: 'members',
        loadComponent: () => import('./features/members/members.component').then((m) => m.MembersComponent),
      },
    ],
  },
  {
    path: 'register',
    canActivate: [loggedOutOnlyGuard],
    loadComponent: () => import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'login',
    canActivate: [loggedOutOnlyGuard],
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'check-email',
    canActivate: [loggedOutOnlyGuard],
    loadComponent: () => import('./features/auth/check-email/check-email.component').then((m) => m.CheckEmailComponent),
  },
  {
    path: 'verify-email',
    canActivate: [loggedOutOnlyGuard],
    loadComponent: () =>
      import('./features/auth/verify-email/verify-email.component').then((m) => m.VerifyEmailComponent),
  },
  {
    path: 'create-organization',
    canActivate: [authGuard, noOrganizationGuard],
    loadComponent: () =>
      import('./features/create-organization/create-organization.component').then((m) => m.CreateOrganizationComponent),
  },
  {
    path: 'forgot-password',
    canActivate: [loggedOutOnlyGuard],
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent),
  },
  {
    path: 'verify-code',
    canActivate: [loggedOutOnlyGuard],
    loadComponent: () => import('./features/auth/verify-code/verify-code.component').then((m) => m.VerifyCodeComponent),
  },
  {
    path: 'reset-password',
    canActivate: [loggedOutOnlyGuard],
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password.component').then((m) => m.ResetPasswordComponent),
  },
  {
    path: 'reset-success',
    canActivate: [loggedOutOnlyGuard],
    loadComponent: () =>
      import('./features/auth/reset-success/reset-success.component').then((m) => m.ResetSuccessComponent),
  },
  {
    path: 'error/:code',
    loadComponent: () => import('./features/error/error-page.component').then((m) => m.ErrorPageComponent),
  },
  {
    path: '**',
    data: { code: '404' },
    loadComponent: () => import('./features/error/error-page.component').then((m) => m.ErrorPageComponent),
  },
];
