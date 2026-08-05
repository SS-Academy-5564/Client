import { computed, inject, Injectable, signal, Signal } from '@angular/core';
import { UpdateMonitorPayload } from '@core/models/monitor-model';
import { TokenStorageService } from '@core/services/token-storage.service';
import { environment } from '@environments/environment';
import * as signalR from '@microsoft/signalr';
import { defer, from, Observable, of, Subscription, tap, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

/**
 * Manages the authenticated SignalR connection used for monitor updates.
 */
@Injectable({
  providedIn: 'root',
})
export class SignalrService {
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly connectionStateValue = signal<signalR.HubConnectionState>(signalR.HubConnectionState.Disconnected);
  private readonly connectionErrorValue = signal<string | null>(null);
  private hubConnection: signalR.HubConnection | null = null;

  /** Current SignalR connection state. */
  readonly connectionState: Signal<signalR.HubConnectionState> = this.connectionStateValue.asReadonly();

  /** Whether the monitor hub connection is active. */
  readonly isConnected = computed((): boolean => this.connectionState() === signalR.HubConnectionState.Connected);

  /** Latest connection error, when establishing or restoring the connection fails. */
  readonly connectionError: Signal<string | null> = this.connectionErrorValue.asReadonly();

  /**
   * Starts the authenticated monitor hub connection.
   *
   * @returns An observable that completes when the connection has started.
   */
  start(): Observable<void> {
    return defer((): Observable<void> => {
      const connection = this.getOrCreateConnection();

      if (
        connection.state === signalR.HubConnectionState.Connected ||
        connection.state === signalR.HubConnectionState.Connecting ||
        connection.state === signalR.HubConnectionState.Reconnecting
      ) {
        return of(undefined);
      }

      this.connectionErrorValue.set(null);
      this.connectionStateValue.set(signalR.HubConnectionState.Connecting);

      return from(connection.start()).pipe(
        tap((): void => {
          this.connectionStateValue.set(signalR.HubConnectionState.Connected);
        }),
        catchError((error: unknown): Observable<never> => {
          this.connectionStateValue.set(signalR.HubConnectionState.Disconnected);
          this.connectionErrorValue.set(this.getErrorMessage(error));
          return throwError(() => error);
        }),
      );
    });
  }

  /**
   * Stops the current monitor hub connection.
   *
   * @returns An observable that completes when the connection has stopped.
   */
  stop(): Observable<void> {
    return defer((): Observable<void> => {
      if (!this.hubConnection || this.hubConnection.state === signalR.HubConnectionState.Disconnected) {
        this.connectionStateValue.set(signalR.HubConnectionState.Disconnected);
        return of(undefined);
      }

      return from(this.hubConnection.stop()).pipe(
        finalize((): void => {
          this.connectionStateValue.set(signalR.HubConnectionState.Disconnected);
        }),
      );
    });
  }

  /**
   * Registers a handler for a completed monitor check.
   *
   * @param handler Callback that receives the updated monitor payload.
   * @returns A subscription that unregisters the handler when unsubscribed.
   */
  onMonitorUpdated(handler: (update: UpdateMonitorPayload) => void): Subscription {
    const connection = this.getOrCreateConnection();
    connection.on('SendUpdatedMonitorAsync', handler);

    return new Subscription((): void => {
      connection.off('SendUpdatedMonitorAsync', handler);
    });
  }

  private getOrCreateConnection(): signalR.HubConnection {
    if (this.hubConnection) {
      return this.hubConnection;
    }

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.hubBaseUrl}/monitors`, {
        accessTokenFactory: (): string => this.tokenStorage.getToken() ?? '',
      })
      .withAutomaticReconnect()
      .build();

    connection.onreconnecting((error?: Error): void => {
      this.connectionStateValue.set(signalR.HubConnectionState.Reconnecting);
      this.connectionErrorValue.set(error ? this.getErrorMessage(error) : null);
    });

    connection.onreconnected((): void => {
      this.connectionStateValue.set(signalR.HubConnectionState.Connected);
      this.connectionErrorValue.set(null);
    });

    connection.onclose((error?: Error): void => {
      this.connectionStateValue.set(signalR.HubConnectionState.Disconnected);
      this.connectionErrorValue.set(error ? this.getErrorMessage(error) : null);
    });

    this.hubConnection = connection;
    return connection;
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'SignalR connection failed.';
  }
}
