import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
    import('./features/home/home.component')
      .then(m => m.HomeComponent)
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component')
        .then(m => m.RegisterComponent)
  },
   {
    path: 'create-organization',
    loadComponent: () =>
      import('./features/create-organization/create-organization.component')
        .then(m => m.CreateOrganizationComponent)
  },
  
];
