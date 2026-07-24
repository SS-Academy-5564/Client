import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LogoComponent } from '../ui/logo/logo.component';
import { DestroyRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TokenStorageService } from '@core/services/token-storage.service';
import { MatIcon } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '@core/services/auth.service';
import { ROUTES } from '@core/constants/route.constants';

@Component({
  selector: 'app-header',
  imports: [RouterLink, LogoComponent, MatIcon, MatMenuModule, MatButtonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  protected readonly tokenStorage = inject(TokenStorageService);
  protected readonly authService = inject(AuthService);
  protected readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly userDisplayName = computed(() => this.authService.displayName() || 'User');
  readonly userDisplayInitials = computed(() => {
    const initials = this.authService.userInitials();

    if (initials) {
      return initials;
    }

    return this.userDisplayName().charAt(0).toUpperCase() || 'U';
  });

  constructor() {
    if (this.tokenStorage.isAuthenticated() && !this.authService.currentUser()) {
      this.authService.loadCurrentUser().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    }
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate([ROUTES.LOGIN]);
  }
}
