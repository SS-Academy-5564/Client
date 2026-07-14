import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { LogoComponent } from '@shared/ui/logo/logo.component';

@Component({
  selector: 'app-reset-success',
  imports: [MatCardModule, MatIconModule, RouterModule, LogoComponent],
  templateUrl: './reset-success.component.html',
  styleUrl: './reset-success.component.scss',
})
export class ResetSuccessComponent {}
