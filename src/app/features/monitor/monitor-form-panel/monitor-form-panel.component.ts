import { Component, effect, inject, input, output, signal } from '@angular/core';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { ErrorMessageComponent } from '@shared/ui/error-message/error-message.component';
import { HttpMethod, MonitorStatus } from '@core/models/monitor-model';
import { urlValidator } from '@shared/validators/url.validator';
import {
  DEFAULT_HTTP_METHOD,
  DEFAULT_POLLING_INTERVAL_SECONDS,
  DEFAULT_POLLING_TIMEOUT_SECONDS,
  HTTP_METHODS,
  POLLING_INTERVAL_OPTIONS,
  POLLING_TIMEOUT_OPTIONS,
} from './monitor-form.options';

/** The value shape emitted by {@link MonitorFormPanelComponent} on submission. */
export type MonitorFormValue = {
  name: string;
  httpMethod: HttpMethod;
  url: string;
  resultPath: string;
  status: MonitorStatus;
  pollingIntervalSeconds: number;
  pollingTimeoutSeconds: number;
};

/** A field-level error forwarded from a server response. */
export type MonitorFormServerError = {
  field?: string | null;
  message: string;
};

const DEFAULT_STATUS: MonitorStatus = MonitorStatus.Enabled;

/**
 * Maps backend field names to reactive-form control names.
 * Includes both PascalCase and camelCase variants because ASP.NET Core
 * serialisation defaults vary across endpoints.
 */
const FIELD_TO_CONTROL: Readonly<Record<string, string>> = {
  Name: 'name',
  name: 'name',
  Url: 'url',
  url: 'url',
  HttpMethod: 'httpMethod',
  httpMethod: 'httpMethod',
  ResultPath: 'resultPath',
  resultPath: 'resultPath',
  Status: 'status',
  status: 'status',
  PollingIntervalSeconds: 'pollingIntervalSeconds',
  pollingIntervalSeconds: 'pollingIntervalSeconds',
  PollingTimeoutSeconds: 'pollingTimeoutSeconds',
  pollingTimeoutSeconds: 'pollingTimeoutSeconds',
};

/**
 * Mode-agnostic monitor form panel.
 *
 * Renders the slide-in panel UI with the full monitor form.
 * It does **not** call any API; it emits {@link MonitorFormValue} via `submitted`
 * and lets the parent (create or edit wrapper) perform the actual request.
 */
@Component({
  selector: 'app-monitor-form-panel',
  imports: [
    A11yModule,
    DatePipe,
    NgTemplateOutlet,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ButtonComponent,
    ErrorMessageComponent,
  ],
  host: {
    '(keydown.escape)': 'onClose()',
  },
  templateUrl: './monitor-form-panel.component.html',
  styleUrl: './monitor-form-panel.component.scss',
})
export class MonitorFormPanelComponent {
  private readonly fb = inject(FormBuilder);

  /** Heading text rendered in the panel header. */
  readonly title = input.required<string>();

  /** Optional subtitle rendered below the heading. */
  readonly subtitle = input<string>('');

  /** Label for the primary submit button. */
  readonly submitLabel = input.required<string>();

  /**
   * When `true`, a Status dropdown (`Enabled` / `Disabled`) is shown.
   * Pass `false` for the create flow where status is not part of the request.
   */
  readonly showStatus = input<boolean>(false);

  /**
   * Pre-fill values for the form.
   * When this changes from `null` to a value (e.g., detail loaded for editing),
   * the form resets to those values.
   */
  readonly initialValue = input<MonitorFormValue | null>(null);

  /**
   * Server-side field errors to map onto form controls.
   * Setting this to a non-empty array applies the errors; `null` clears the banner.
   */
  readonly serverErrors = input<readonly MonitorFormServerError[] | null>(null);

  /** Whether a submission request is in flight. Disables the submit button and close gesture. */
  readonly submitting = input<boolean>(false);

  /**
   * ISO-8601 timestamp of the last modification, shown in the panel footer.
   * Pass `null` (default) to hide the label — used by the create flow.
   */
  readonly lastModifiedAt = input<string | null>(null);

  /**
   * When `true`, the form body is replaced with a loading indicator.
   * Used by the edit wrapper while the monitor detail is being fetched.
   */
  readonly isLoadingInitial = input<boolean>(false);

  /** Emitted when the user closes the panel without submitting. */
  readonly closed = output<void>();

  /** Emitted with the valid form value when the user submits. */
  readonly submitted = output<MonitorFormValue>();

  /** Selectable HTTP methods for the request-method dropdown. */
  protected readonly httpMethods = HTTP_METHODS;

  /** Selectable polling-interval options for the dropdown. */
  protected readonly intervalOptions = POLLING_INTERVAL_OPTIONS;

  /** Selectable polling-timeout options for the dropdown. */
  protected readonly timeoutOptions = POLLING_TIMEOUT_OPTIONS;

  /** Exposed for template comparisons in the status dropdown. */
  protected readonly MonitorStatus = MonitorStatus;

  /** Banner message shown above the form when server-side validation fails. */
  protected readonly bannerError = signal<string | null>(null);

  /** Reactive form group backing all monitor fields. */
  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(64)]],
    httpMethod: [DEFAULT_HTTP_METHOD as HttpMethod, [Validators.required]],
    url: ['', [Validators.required, Validators.maxLength(2083), urlValidator()]],
    resultPath: ['', [Validators.required, Validators.maxLength(255)]],
    status: [DEFAULT_STATUS as MonitorStatus, [Validators.required]],
    pollingIntervalSeconds: [DEFAULT_POLLING_INTERVAL_SECONDS, [Validators.required]],
    pollingTimeoutSeconds: [DEFAULT_POLLING_TIMEOUT_SECONDS, [Validators.required]],
  });

  /**
   * Gets the localized name-field error message shown in the UI.
   * @returns The error message, or `null` when the field has no visible error.
   */
  get nameError(): string | null {
    const control = this.form.get('name');
    if (!control?.touched || !control.errors) {
      return null;
    }
    if (control.hasError('required')) {
      return $localize`:@@monitorFormPanel.nameRequired:Monitor name is required.`;
    }
    if (control.hasError('maxlength')) {
      return $localize`:@@monitorFormPanel.nameMaxLength:Monitor name must be at most 64 characters.`;
    }
    if (control.hasError('server')) {
      return control.getError('server');
    }
    return null;
  }

  /** `@returns` The localized URL-field error message, or `null` when the field has no visible error. */
  get urlError(): string | null {
    const control = this.form.get('url');
    if (!control?.touched || !control.errors) {
      return null;
    }
    if (control.hasError('required')) {
      return $localize`:@@monitorFormPanel.urlRequired:Endpoint URL is required.`;
    }
    if (control.hasError('maxlength')) {
      return $localize`:@@monitorFormPanel.urlMaxLength:Endpoint URL is too long.`;
    }
    if (control.hasError('url')) {
      return $localize`:@@monitorFormPanel.urlInvalid:Endpoint URL must be a valid HTTP or HTTPS URL.`;
    }
    if (control.hasError('server')) {
      return control.getError('server');
    }
    return null;
  }

  /** `@returns` The localized result-path error message, or `null` when the field has no visible error. */
  get resultPathError(): string | null {
    const control = this.form.get('resultPath');
    if (!control?.touched || !control.errors) {
      return null;
    }
    if (control.hasError('required')) {
      return $localize`:@@monitorFormPanel.resultPathRequired:Result path is required.`;
    }
    if (control.hasError('maxlength')) {
      return $localize`:@@monitorFormPanel.resultPathMaxLength:Result path is too long.`;
    }
    if (control.hasError('server')) {
      return control.getError('server');
    }
    return null;
  }

  /** `@returns` The localized status-field error message, or `null` when the field has no visible error. */
  get statusError(): string | null {
    const control = this.form.get('status');
    if (!control?.touched || !control.errors) {
      return null;
    }
    if (control.hasError('server')) {
      return control.getError('server');
    }
    return null;
  }

  constructor() {
    effect(() => {
      const value = this.initialValue();
      if (value) {
        this.form.reset(value);
        this.bannerError.set(null);
      }
    });

    effect(() => {
      this.applyServerErrors(this.serverErrors() ?? []);
    });
  }

  /** Closes the panel, unless a submission is in flight. */
  onClose(): void {
    if (this.submitting()) {
      return;
    }
    this.closed.emit();
  }

  /** Validates the form and emits `submitted` with the raw value, or marks all fields touched. */
  onSubmit(): void {
    if (this.submitting()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.bannerError.set(null);
    this.submitted.emit(this.form.getRawValue());
  }

  private applyServerErrors(errors: readonly MonitorFormServerError[]): void {
    if (!Array.isArray(errors)) {
      return;
    }

    for (const control of Object.values(this.form.controls)) {
      if (control.hasError('server')) {
        const rest = Object.fromEntries(Object.entries(control.errors ?? {}).filter(([k]) => k !== 'server'));
        control.setErrors(Object.keys(rest).length > 0 ? rest : null);
      }
    }

    for (const error of errors) {
      const controlName = error.field ? FIELD_TO_CONTROL[error.field] : undefined;
      const control = controlName ? this.form.get(controlName) : null;
      if (control) {
        control.setErrors({ ...control.errors, server: error.message });
        control.markAsTouched();
      }
    }

    this.bannerError.set(
      errors.length > 0 ? $localize`:@@monitorFormPanel.genericError:Please check the form for errors.` : null,
    );
  }
}
