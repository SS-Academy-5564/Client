import { TestBed } from '@angular/core/testing';
import { TokenStorageService } from '@core/services/token-storage.service';
import { environment } from '@environments/environment';
import * as signalR from '@microsoft/signalr';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SignalrService } from './signalr.service';

describe('SignalrService', (): void => {
  let service: SignalrService;
  let tokenStorageMock: { getToken: ReturnType<typeof vi.fn> };
  let connectionUrl: string | null;
  let accessTokenFactory: (() => string) | null;
  let reconnectingHandler: ((error?: Error) => void) | null;
  let reconnectedHandler: (() => void) | null;
  let closeHandler: ((error?: Error) => void) | null;
  let connection: {
    state: signalR.HubConnectionState;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    on: ReturnType<typeof vi.fn>;
    off: ReturnType<typeof vi.fn>;
    onreconnecting: ReturnType<typeof vi.fn>;
    onreconnected: ReturnType<typeof vi.fn>;
    onclose: ReturnType<typeof vi.fn>;
  };

  beforeEach((): void => {
    connectionUrl = null;
    accessTokenFactory = null;
    reconnectingHandler = null;
    reconnectedHandler = null;
    closeHandler = null;
    tokenStorageMock = { getToken: vi.fn().mockReturnValue('access-token') };
    connection = {
      state: signalR.HubConnectionState.Disconnected,
      start: vi.fn().mockImplementation(async (): Promise<void> => {
        connection.state = signalR.HubConnectionState.Connected;
      }),
      stop: vi.fn().mockImplementation(async (): Promise<void> => {
        connection.state = signalR.HubConnectionState.Disconnected;
      }),
      on: vi.fn(),
      off: vi.fn(),
      onreconnecting: vi.fn((handler: (error?: Error) => void): void => {
        reconnectingHandler = handler;
      }),
      onreconnected: vi.fn((handler: () => void): void => {
        reconnectedHandler = handler;
      }),
      onclose: vi.fn((handler: (error?: Error) => void): void => {
        closeHandler = handler;
      }),
    };

    vi.spyOn(signalR.HubConnectionBuilder.prototype, 'withUrl').mockImplementation(function (
      this: signalR.HubConnectionBuilder,
      url: string,
      options?: signalR.IHttpConnectionOptions,
    ): signalR.HubConnectionBuilder {
      connectionUrl = url;
      accessTokenFactory = (options?.accessTokenFactory as (() => string) | undefined) ?? null;
      return this;
    });
    vi.spyOn(signalR.HubConnectionBuilder.prototype, 'withAutomaticReconnect').mockReturnThis();
    vi.spyOn(signalR.HubConnectionBuilder.prototype, 'build').mockReturnValue(
      connection as unknown as signalR.HubConnection,
    );

    TestBed.configureTestingModule({
      providers: [SignalrService, { provide: TokenStorageService, useValue: tokenStorageMock }],
    });

    service = TestBed.inject(SignalrService);
  });

  afterEach((): void => {
    vi.restoreAllMocks();
  });

  it('starts an authenticated connection to the monitor hub', async (): Promise<void> => {
    await firstValueFrom(service.start());

    expect(connectionUrl).toBe(`${environment.hubsBaseUrl}/monitors`);
    expect(accessTokenFactory?.()).toBe('access-token');
    expect(connection.start).toHaveBeenCalledOnce();
    expect(service.isConnected()).toBe(true);
  });

  it('reads the latest token whenever the access token factory runs', async (): Promise<void> => {
    await firstValueFrom(service.start());
    tokenStorageMock.getToken.mockReturnValue('refreshed-token');

    expect(accessTokenFactory?.()).toBe('refreshed-token');
  });

  it('does not start an already connected connection again', async (): Promise<void> => {
    connection.state = signalR.HubConnectionState.Connected;

    await firstValueFrom(service.start());

    expect(connection.start).not.toHaveBeenCalled();
  });

  it('registers and unregisters the monitor updates handler', (): void => {
    const handler = vi.fn();

    const subscription = service.onMonitorsUpdated(handler);
    subscription.unsubscribe();

    expect(connection.on).toHaveBeenCalledWith('SendUpdatedMonitorsAsync', handler);
    expect(connection.off).toHaveBeenCalledWith('SendUpdatedMonitorsAsync', handler);
  });

  it('registers and unregisters the single monitor update handler', (): void => {
    const handler = vi.fn();

    const subscription = service.onMonitorUpdated(handler);
    subscription.unsubscribe();

    expect(connection.on).toHaveBeenCalledWith('SendUpdatedMonitorAsync', handler);
    expect(connection.off).toHaveBeenCalledWith('SendUpdatedMonitorAsync', handler);
  });

  it('tracks reconnecting, reconnected, and closed states', (): void => {
    service.onMonitorsUpdated(vi.fn());

    reconnectingHandler?.(new Error('Connection interrupted'));
    expect(service.connectionState()).toBe(signalR.HubConnectionState.Reconnecting);
    expect(service.connectionError()).toBe('Connection interrupted');

    reconnectedHandler?.();
    expect(service.connectionState()).toBe(signalR.HubConnectionState.Connected);
    expect(service.connectionError()).toBeNull();

    closeHandler?.();
    expect(service.connectionState()).toBe(signalR.HubConnectionState.Disconnected);
  });

  it('stops an active connection', async (): Promise<void> => {
    await firstValueFrom(service.start());
    await firstValueFrom(service.stop());

    expect(connection.stop).toHaveBeenCalledOnce();
    expect(service.connectionState()).toBe(signalR.HubConnectionState.Disconnected);
  });
});
