import { Routes } from '@angular/router';
import { loggedOutOnlyGuard } from './core/guards/logged-out-only-guard';
import { authGuard } from '@core/guards/auth.guard';
import { noOrganizationGuard } from '@core/guards/no-organization.guard';
import { authenticatedGuard } from './core/guards/authenticated-guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authenticatedGuard],
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
    path: 'create-organization',
    canActivate: [authGuard, noOrganizationGuard],
    loadComponent: () =>
      import('./features/create-organization/create-organization.component').then((m) => m.CreateOrganizationComponent),
  },
];
