import { Component, inject, input, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MonitorService } from '@core/services/monitor.service';
import { MonitorModel } from '@core/models/monitor-model';
import {
  MonitorFormPanelComponent,
  MonitorFormServerError,
  MonitorFormValue,
} from '../monitor-form-panel/monitor-form-panel.component';

/**
 * Thin wrapper around {@link MonitorFormPanelComponent} for the **create** flow.
 *
 * Manages submission state, delegates the POST request to {@link MonitorService},
 * and forwards the created monitor to the parent via `created`.
 * The public API (inputs/outputs) is unchanged from before the refactor.
 */
@Component({
  selector: 'app-create-monitor-panel',
  imports: [MonitorFormPanelComponent],
  templateUrl: './create-monitor-panel.component.html',
})
export class CreateMonitorPanelComponent {
  private readonly monitorService = inject(MonitorService);

  /** Whether the create panel is open. */
  readonly isOpen = input.required<boolean>();

  /** Emitted when the user dismisses the panel. */
  readonly closed = output<void>();

  /** Emitted with the newly created monitor on successful submission. */
  readonly created = output<MonitorModel>();

  protected readonly submitting = signal<boolean>(false);
  protected readonly serverErrors = signal<readonly MonitorFormServerError[] | null>(null);

  protected readonly panelTitle = $localize`:@@createMonitor.title:New Monitor`;
  protected readonly panelSubtitle = 
    $localize`:@@createMonitor.subtitle:Configure an endpoint to poll for a metric value.`;
  protected readonly panelSubmitLabel = $localize`:@@createMonitor.submit:Create monitor`;

  /** Clears errors and notifies the parent that the panel was closed. */
  onClose(): void {
    this.serverErrors.set(null);
    this.closed.emit();
  }

  /**
   * Calls the create API with the validated form value.
   * @param value - The validated form value emitted by the form panel.
   */
  onSubmit(value: MonitorFormValue): void {
    this.submitting.set(true);
    this.serverErrors.set(null);

    this.monitorService
      .createMonitor({
        name: value.name,
        url: value.url,
        httpMethod: value.httpMethod,
        resultPath: value.resultPath,
        pollingIntervalSeconds: value.pollingIntervalSeconds,
        pollingTimeoutSeconds: value.pollingTimeoutSeconds,
      })
      .subscribe({
        next: (monitor) => {
          this.submitting.set(false);
          this.created.emit(monitor);
        },
        error: (err: HttpErrorResponse) => {
          this.submitting.set(false);
          const rawErrors = (err.error as { errors?: unknown } | null)?.errors;
          const fieldErrors = Array.isArray(rawErrors) ? (rawErrors as MonitorFormServerError[]) : [];
          this.serverErrors.set(
            fieldErrors.length > 0
              ? fieldErrors
              : [{ message: $localize`:@@createMonitor.genericError:Failed to create monitor.` }],
          );
        },
      });
  }
}
