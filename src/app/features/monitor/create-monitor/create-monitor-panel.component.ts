import { Component, inject, input, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { ErrorMessageComponent } from '@shared/ui/error-message/error-message.component';
import { MonitorService } from '@core/services/monitor.service';
import { CreateMonitorRequest, HttpMethod, MonitorModel } from '@core/models/monitor-model';
import {
  DEFAULT_HTTP_METHOD,
  DEFAULT_POLLING_INTERVAL_SECONDS,
  DEFAULT_POLLING_TIMEOUT_SECONDS,
  HTTP_METHODS,
  POLLING_INTERVAL_OPTIONS,
  POLLING_TIMEOUT_OPTIONS,
} from './create-monitor.options';

type ApiErrorBody = {
  errors?: { field?: string; message: string }[];
};

// Maps backend field names (PascalCase) to reactive-form control names.
const FIELD_TO_CONTROL: Readonly<Record<string, string>> = {
  Name: 'name',
  Url: 'url',
  HttpMethod: 'httpMethod',
  ResultPath: 'resultPath',
  PollingIntervalSeconds: 'pollingIntervalSeconds',
  PollingTimeoutSeconds: 'pollingTimeoutSeconds',
};

@Component({
  selector: 'app-create-monitor-panel',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ButtonComponent,
    ErrorMessageComponent,
  ],
  templateUrl: './create-monitor-panel.component.html',
  styleUrl: './create-monitor-panel.component.scss',
})
export class CreateMonitorPanelComponent {
  private readonly fb = inject(FormBuilder);
  private readonly monitorService = inject(MonitorService);

  readonly isOpen = input.required<boolean>();
  readonly closed = output<void>();
  readonly created = output<MonitorModel>();

  protected readonly httpMethods = HTTP_METHODS;
  protected readonly intervalOptions = POLLING_INTERVAL_OPTIONS;
  protected readonly timeoutOptions = POLLING_TIMEOUT_OPTIONS;

  protected readonly submitting = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(64)]],
    httpMethod: [DEFAULT_HTTP_METHOD as HttpMethod, [Validators.required]],
    url: ['', [Validators.required, Validators.maxLength(2083)]],
    resultPath: ['', [Validators.required, Validators.maxLength(255)]],
    pollingIntervalSeconds: [DEFAULT_POLLING_INTERVAL_SECONDS, [Validators.required]],
    pollingTimeoutSeconds: [DEFAULT_POLLING_TIMEOUT_SECONDS, [Validators.required]],
  });

  onClose(): void {
    if (this.submitting()) {
      return;
    }

    this.resetForm();
    this.closed.emit();
  }

  onSubmit(): void {
    if (this.submitting()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const request: CreateMonitorRequest = this.form.getRawValue();

    this.monitorService.createMonitor(request).subscribe({
      next: (monitor) => {
        this.submitting.set(false);
        this.created.emit(monitor);
        this.resetForm();
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.applyServerErrors(err);
      },
    });
  }

  private applyServerErrors(err: HttpErrorResponse): void {
    const body = err.error as ApiErrorBody | null;
    const fieldErrors = body?.errors ?? [];

    for (const fieldError of fieldErrors) {
      const controlName = fieldError.field ? FIELD_TO_CONTROL[fieldError.field] : undefined;
      const control = controlName ? this.form.get(controlName) : null;

      if (control) {
        control.setErrors({ server: fieldError.message });
        control.markAsTouched();
      }
    }

    this.error.set(fieldErrors[0]?.message ?? $localize`:@@createMonitor.genericError:Failed to create monitor.`);
  }

  private resetForm(): void {
    this.error.set(null);
    this.form.reset({
      name: '',
      httpMethod: DEFAULT_HTTP_METHOD,
      url: '',
      resultPath: '',
      pollingIntervalSeconds: DEFAULT_POLLING_INTERVAL_SECONDS,
      pollingTimeoutSeconds: DEFAULT_POLLING_TIMEOUT_SECONDS,
    });
  }
}
