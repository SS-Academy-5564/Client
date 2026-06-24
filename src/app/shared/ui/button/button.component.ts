import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, MatButtonModule, RouterModule],
  templateUrl: './button.html',
  styleUrls: ['./button.scss'],
})
export class ButtonComponent {
  @Input() label = '';
  @Input() type: 'primary' | 'secondary' | 'text' = 'primary';
  @Input() variant: 'default' | 'nav' | 'full-width' = 'default';
  @Input() disabled = false;
  @Input() routerLink?: string;
}
