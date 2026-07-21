import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

type ToastType = 'success' | 'error' | 'warning' | 'info';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.open(message, 'success', 3_500);
  }

  error(message: string): void {
    this.open(message, 'error', 6_000);
  }

  info(message: string): void {
    this.open(message, 'info', 4_000);
  }

  warning(message: string): void {
    this.open(message, 'warning', 4_000);
  }

  private open(message: string, type: ToastType, duration: number): void {
    this.snackBar.open(message, $localize`:@@toast.dismiss:Dismiss`, {
      duration,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: ['pulse-toast', `toast-${type}`],
    });
  }
}
