import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { ButtonComponent } from '../ui/button/button.component';
import { LogoComponent } from '../ui/logo/logo.component';
import { TokenStorageService } from '@core/services/token-storage.service';

@Component({
  selector: 'app-header',
  imports: [RouterModule, MatToolbarModule, CommonModule, ButtonComponent, LogoComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  protected readonly tokenStorage = inject(TokenStorageService);
  protected readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly currentUrl = signal(this.router.url);

  constructor() {
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
    this.tokenStorage.clearToken();
    this.router.navigate(['/login']);
  }
}
