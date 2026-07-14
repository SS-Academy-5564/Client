import { Routes } from '@angular/router';
import { loggedOutOnlyGuard } from './core/guards/logged-out-only-guard';
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
      {
        path: 'monitors',
        canActivate: [authenticatedGuard],
        loadComponent: () => import('./features/monitor/monitor.component').then((m) => m.MonitorComponent),
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
];
