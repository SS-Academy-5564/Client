import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LogoComponent } from '../ui/logo/logo.component';
import { DestroyRef, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { TokenStorageService } from '@core/services/token-storage.service';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, LogoComponent, MatIcon, MatMenuModule, MatButtonModule, MatTooltipModule, MatIconModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  protected readonly tokenStorage = inject(TokenStorageService);
  protected readonly authService = inject(AuthService);
  protected readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly currentUrl = signal(this.router.url);
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

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.currentUrl.set(event.urlAfterRedirects || event.url);
      });
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
