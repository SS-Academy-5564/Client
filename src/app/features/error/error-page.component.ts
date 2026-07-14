import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, map } from 'rxjs';
import { ButtonComponent } from '@shared/ui/button/button.component';

type ErrorPageEntry = {
  label: string;
  title: string;
  message: string;
};

const DEFAULT_KEY = 'default';
const HTTP_STATUS_PATTERN = /^\d{3}$/;

function buildErrorPages(): Record<string, ErrorPageEntry> {
  return {
    '404': {
      label: '404',
      title: $localize`:@@errorPage404Title:Page not found`,
      message: $localize`:@@errorPage404Message:The page you are looking for doesn't exist or has been moved.`,
    },
    '500': {
      label: '500',
      title: $localize`:@@errorPage500Title:Something went wrong`,
      message: $localize`:@@errorPage500Message:An unexpected error occurred on our end. Please try again in a moment.`,
    },
    offline: {
      label: $localize`:@@errorPageOfflineLabel:Offline`,
      title: $localize`:@@errorPageOfflineTitle:Can't reach the server`,
      message: $localize`:@@errorPageOfflineMessage:Couldn't reach the server. Check your connection and try again.`,
    },
    [DEFAULT_KEY]: {
      label: $localize`:@@errorPageDefaultLabel:Error`,
      title: $localize`:@@errorPageDefaultTitle:Something went wrong`,
      message: $localize`:@@errorPageDefaultMessage:An unexpected error occurred. Please try again.`,
    },
  };
}

@Component({
  selector: 'app-error-page',
  imports: [ButtonComponent],
  templateUrl: './error-page.component.html',
  styleUrl: './error-page.component.scss',
})
export class ErrorPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly pages = buildErrorPages();

  // Derive from the live param/data streams so a same-route navigation between
  // codes (e.g. /error/503 -> /error/500) recomputes when Angular reuses the
  // component instance, instead of freezing on the first snapshot.
  protected readonly entry = toSignal(
    combineLatest([this.route.paramMap, this.route.data]).pipe(
      map(([paramMap, data]) => this.resolveEntry(String(paramMap.get('code') ?? data['code'] ?? '404'))),
    ),
    {
      initialValue: this.resolveEntry(
        String(this.route.snapshot.paramMap.get('code') ?? this.route.snapshot.data['code'] ?? '404'),
      ),
    },
  );

  private resolveEntry(key: string): ErrorPageEntry {
    const mapped = this.pages[key];
    if (mapped) {
      return mapped;
    }

    // Unmapped code: don't masquerade as a distinctly-handled error. Show the
    // real HTTP status (e.g. 503) as the label with generic copy; fall back to
    // the plain default only for non-numeric/unknown keys.
    const fallback = this.pages[DEFAULT_KEY];
    return HTTP_STATUS_PATTERN.test(key) ? { ...fallback, label: key } : fallback;
  }
}
