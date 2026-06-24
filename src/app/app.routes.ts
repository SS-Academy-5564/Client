import { Routes } from '@angular/router';
import { loggedOutOnlyGuard } from './core/guards/logged-out-only-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
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
