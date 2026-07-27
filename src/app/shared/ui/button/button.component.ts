import { Component, input } from '@angular/core';
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
  readonly type = input<'primary' | 'secondary' | 'text'>('primary');

  readonly buttonType = input<'button' | 'submit'>('button');

  readonly variant = input<'full-width' | 'nav' | 'default'>('default');

  readonly label = input('');

  readonly disabled = input(false);

  readonly routerLink = input<string | null>(null);
}
