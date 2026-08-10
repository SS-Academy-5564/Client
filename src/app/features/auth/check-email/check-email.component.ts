import { Component } from '@angular/core';

import { ROUTES } from '@core/constants/route.constants';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { LogoComponent } from '@shared/ui/logo/logo.component';

/** Explains the next registration step after the initial verification email is sent. */
@Component({
  selector: 'app-check-email',
  imports: [ButtonComponent, LogoComponent],
  templateUrl: './check-email.component.html',
  styleUrl: './check-email.component.scss',
})
export class CheckEmailComponent {
  /** Application routes used by the page actions. */
  protected readonly routes = ROUTES;
}
