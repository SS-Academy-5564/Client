import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { LogoComponent } from '@shared/ui/logo/logo.component';
import { TokenStorageService } from '@core/services/token-storage.service';
import { OrganizationService } from '@core/services/organization.service';
import { ToastService } from '@core/services/toast.service';
import { ROUTES } from '@core/constants/route.constants';

@Component({
  selector: 'app-create-organization',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    ButtonComponent,
    LogoComponent,
  ],
  templateUrl: './create-organization.component.html',
  styleUrl: './create-organization.component.scss',
})
export class CreateOrganizationComponent {
  private readonly fb = inject(FormBuilder);
  private orgService = inject(OrganizationService);
  private tokenStorage = inject(TokenStorageService);
  private router = inject(Router);
  private readonly toastService = inject(ToastService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.group({
    organizationName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const name = this.form.get('organizationName')?.value;
    if (!name) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.orgService.createOrganization(name).subscribe({
      next: (res) => {
        this.loading.set(false);

        this.tokenStorage.setToken(res.data.accessToken);
        this.toastService.success($localize`:@@newOrganization.success:Organization created successfully.`);

        this.router.navigate([ROUTES.OVERVIEW]);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Failed to create organization');
      },
    });
  }
}
