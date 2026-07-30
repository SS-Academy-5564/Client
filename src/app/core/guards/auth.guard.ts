import { CanActivateFn } from '@angular/router';

import { authenticatedGuard } from '@core/guards/authenticated-guard';

/**
 * Preserves the legacy guard name while using initialization-aware authentication checks.
 *
 * @returns The shared authenticated-route guard result.
 */
export const authGuard: CanActivateFn = authenticatedGuard;
