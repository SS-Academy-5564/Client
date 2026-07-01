import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-button',
  imports: [CommonModule, MatButtonModule, RouterModule],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
})
export class ButtonComponent {
  // eslint-disable-next-line @angular-eslint/prefer-signals
  @Input() type: 'primary' | 'secondary' | 'text' = 'primary';
  // eslint-disable-next-line @angular-eslint/prefer-signals
  @Input() buttonType: 'button' | 'submit' = 'button';
  // eslint-disable-next-line @angular-eslint/prefer-signals
  @Input() variant: 'full-width' | 'nav' | 'default' = 'default';
  // eslint-disable-next-line @angular-eslint/prefer-signals
  @Input() label = '';
  // eslint-disable-next-line @angular-eslint/prefer-signals
  @Input() disabled = false;
  // eslint-disable-next-line @angular-eslint/prefer-signals
  @Input() routerLink: string | null = null;
}
