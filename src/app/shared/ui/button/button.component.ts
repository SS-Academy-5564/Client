import { Component, Input} from '@angular/core';
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
  @Input() type: 'primary' | 'secondary' | 'text' = 'primary';
  @Input() buttonType: 'button' | 'submit' = 'button';
  @Input() variant: 'full-width' | 'nav' | 'default' = 'default';
  @Input() label: string = '';
  @Input() disabled: boolean = false;
  @Input() routerLink: string | null = null;
}
