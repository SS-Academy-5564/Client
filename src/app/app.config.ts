import {
  ApplicationConfig,
  importProvidersFrom,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NgxEchartsModule } from 'ngx-echarts';

import { routes } from './app.routes';
import { AuthService } from '@core/services/auth.service';
import { authInterceptor } from '@core/interceptors/auth.interceptor';
import { serverErrorInterceptor } from '@core/interceptors/server-error.interceptor';

const initializeAuthentication = (): Observable<void> => inject(AuthService).initializeSession();

/** Root providers, including authentication restoration before routing begins. */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptors([authInterceptor, serverErrorInterceptor])),
    provideAppInitializer(initializeAuthentication),
    importProvidersFrom(
      NgxEchartsModule.forRoot({
        echarts: () => import('echarts'),
      }),
    ),
  ],
};
