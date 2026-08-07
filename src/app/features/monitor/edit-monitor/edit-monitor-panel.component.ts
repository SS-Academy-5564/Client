import { Component, effect, inject, input, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { MonitorService } from '@core/services/monitor.service';
import { EditableMonitorStatus, MonitorModel, MonitorStatus } from '@core/models/monitor-model';
import { ToastService } from '@core/services/toast.service';
import {
  MonitorFormPanelComponent,
  MonitorFormServerError,
  MonitorFormValue,
} from '../monitor-form-panel/monitor-form-panel.component';

/**
 * Thin wrapper around {@link MonitorFormPanelComponent} for the **edit** flow.
 *
 * When `monitorId` changes to a non-null value the component fetches the full
 * monitor detail, pre-fills the shared form panel, then delegates the PUT
 * request to {@link MonitorService} on submission.
 */
@Component({
  selector: 'app-edit-monitor-panel',
  imports: [MonitorFormPanelComponent],
  templateUrl: './edit-monitor-panel.component.html',
})
export class EditMonitorPanelComponent {
  private readonly monitorService = inject(MonitorService);
  private readonly toastService = inject(ToastService);

  /**
   * ID of the monitor to edit, or `null` when the panel is closed.
   * Changing this from `null` to a string triggers a detail fetch and opens the panel.
   */
  readonly monitorId = input.required<string | null>();

  /** Emitted when the user dismisses the panel. */
  readonly closed = output<void>();

  /** Emitted with the updated monitor in list-projection shape on successful submission. */
  readonly updated = output<MonitorModel>();

  /** Signal indicating whether the form is currently being submitted. */
  protected readonly submitting = signal<boolean>(false);

  /** Signal indicating whether the monitor details are currently being loaded. */
  protected readonly isLoadingDetail = signal<boolean>(false);

  /** Signal containing the list of validation or submission errors returned by the server, or `null`. */
  protected readonly serverErrors = signal<readonly MonitorFormServerError[] | null>(null);

  /** Signal containing the initial values to populate the form with, or `null` if not loaded yet. */
  protected readonly initialValue = signal<MonitorFormValue | null>(null);

  /** Signal containing the ISO-8601 last-modified timestamp of the loaded monitor, or `null` when not yet loaded. */
  protected readonly lastModifiedAt = signal<string | null>(null);

  /** The title text displayed in the panel header. */
  protected readonly panelTitle = $localize`:@@editMonitor.title:Edit Monitor`;

  /** The subtitle/description text displayed in the panel header. */
  protected readonly panelSubtitle = $localize`:@@editMonitor.subtitle:Update the monitor configuration.`;

  /** The text label displayed on the submit/save button. */
  protected readonly panelSubmitLabel = $localize`:@@editMonitor.submit:Save changes`;

  constructor() {
    effect((onCleanup) => {
      const id = this.monitorId();
      if (id) {
        const subscription = this.loadDetail(id);
        onCleanup(() => {
          subscription.unsubscribe();
        });
      } else {
        this.initialValue.set(null);
        this.lastModifiedAt.set(null);
        this.serverErrors.set(null);
      }
    });
  }

  /** Clears state and notifies the parent that the panel was closed. */
  onClose(): void {
    this.serverErrors.set(null);
    this.closed.emit();
  }

  /**
   * Calls the update API with the validated form value.
   * @param value - The validated form value emitted by the form panel.
   */
  onSubmit(value: MonitorFormValue): void {
    const id = this.monitorId();
    if (!id) {
      return;
    }

    this.submitting.set(true);
    this.serverErrors.set(null);

    const submitStatus: EditableMonitorStatus =
      value.status === MonitorStatus.Error ? MonitorStatus.Enabled : (value.status as EditableMonitorStatus);

    this.monitorService
      .updateMonitor(id, {
        name: value.name,
        url: value.url,
        httpMethod: value.httpMethod,
        resultPath: value.resultPath,
        status: submitStatus,
        pollingIntervalSeconds: value.pollingIntervalSeconds,
        pollingTimeoutSeconds: value.pollingTimeoutSeconds,
      })
      .subscribe({
        next: (monitor) => {
          this.submitting.set(false);
          this.updated.emit(monitor);
        },
        error: (err: HttpErrorResponse) => {
          this.submitting.set(false);
          const rawErrors = (err.error as { errors?: unknown } | null)?.errors;
          const fieldErrors = Array.isArray(rawErrors) ? (rawErrors as MonitorFormServerError[]) : [];
          this.serverErrors.set(
            fieldErrors.length > 0
              ? fieldErrors
              : [{ message: $localize`:@@editMonitor.genericError:Failed to update monitor.` }],
          );
        },
      });
  }

  /**
   * Fetches the detail for the given monitor ID.
   * @param id - The ID of the monitor to fetch details for.
   * @returns The active subscription for the detail request.
   */
  private loadDetail(id: string): Subscription {
    this.isLoadingDetail.set(true);
    this.initialValue.set(null);
    this.serverErrors.set(null);

    return this.monitorService.getMonitorById(id).subscribe({
      next: (detail) => {
        this.isLoadingDetail.set(false);
        this.lastModifiedAt.set(detail.lastModifiedAt);
        this.initialValue.set({
          name: detail.name,
          url: detail.url,
          httpMethod: detail.httpMethod,
          resultPath: detail.resultPath,
          status: detail.status,
          pollingIntervalSeconds: detail.pollingIntervalSeconds,
          pollingTimeoutSeconds: detail.pollingTimeoutSeconds,
        });
      },
      error: () => {
        this.isLoadingDetail.set(false);
        this.toastService.error($localize`:@@editMonitor.loadError:Failed to load monitor details.`);
        this.closed.emit();
      },
    });
  }
}
