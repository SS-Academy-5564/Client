import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { LogoComponent } from '../ui/logo/logo.component';
import { AuthService } from '@core/services/auth.service';
import { ROUTES } from '@core/constants/route.constants';

/**
 * Displays the application identity and authenticated-user actions.
 */
@Component({
  selector: 'app-header',
  imports: [RouterLink, LogoComponent, MatIcon, MatMenuModule, MatButtonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  /** Authentication state and current-user data rendered by the header. */
  protected readonly authService = inject(AuthService);

  private readonly router = inject(Router);

  /** Display name shown in the user menu. */
  protected readonly userDisplayName = computed(() => this.authService.displayName() || 'User');

  /** Initials shown in the user avatar. */
  protected readonly userDisplayInitials = computed(() => {
    const initials = this.authService.userInitials();

    if (initials) {
      return initials;
    }

    return this.userDisplayName().charAt(0).toUpperCase() || 'U';
  });

  /**
   * Revokes the backend session, clears local state, and navigates to login even when logout fails.
   */
  onLogout(): void {
    this.authService
      .logout()
      .pipe(
        finalize(() => {
          void this.router.navigate([ROUTES.LOGIN]);
        }),
      )
      .subscribe({ error: (): void => undefined });
  }
}
