import { Component, inject } from '@angular/core';
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
import { TokenStorageService } from '@/app/core/services/token-storage.service';
import { OrganizationService } from '@/app/core/services/organization.service';

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

  loading = false;
  error: string | null = null;

  readonly form = this.fb.group({
    organizationName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const name = this.form.get('organizationName')?.value;
    if (!name) return;

    this.loading = true;
    this.error = null;

    this.orgService.createOrganization(name).subscribe({
      next: (res) => {
        this.loading = false;

        this.tokenStorage.setToken(res.data.accessToken);

        this.router.navigate(['/overview']);
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to create organization';
      },
    });
  }
}
