import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OverviewComponent } from './overview.component';
import { WidgetService } from '@core/services/widget.service';
import { of } from 'rxjs';

describe('OverviewComponent', () => {
  let component: OverviewComponent;
  let fixture: ComponentFixture<OverviewComponent>;

  const widgetServiceMock = {
    getWidgets: vi.fn(),
    createWidget: vi.fn(),
    updateWidget: vi.fn(),
  };

  beforeEach(async () => {
    widgetServiceMock.getWidgets.mockReturnValue(
      of({
        data: [],
      }),
    );

    await TestBed.configureTestingModule({
      imports: [OverviewComponent],
      providers: [
        {
          provide: WidgetService,
          useValue: widgetServiceMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OverviewComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load widgets on initialization', () => {
    expect(widgetServiceMock.getWidgets).toHaveBeenCalledWith('00000000-0000-0000-0000-000000000001');
  });

  it('should open widget form for creation', () => {
    component.openWidgetForm();

    expect(component.isWidgetFormOpen()).toBe(true);
    expect(component.editingWidget()).toBeNull();
  });

  it('should close widget form', () => {
    component.openWidgetForm();

    component.closeWidgetForm();

    expect(component.isWidgetFormOpen()).toBe(false);
    expect(component.editingWidget()).toBeNull();
  });

  it('should open widget form for editing with the selected widget', () => {
    const widget = { id: '1', type: 'stat-card', metric: 'availability' };

    component.editWidget(widget);

    expect(component.isWidgetFormOpen()).toBe(true);
    expect(component.editingWidget()).toEqual(widget);
  });

  it('should cancel editing without calling updateWidget', () => {
    const widget = { id: '1', type: 'stat-card', metric: 'availability' };

    component.editWidget(widget);
    component.closeWidgetForm();

    expect(component.isWidgetFormOpen()).toBe(false);
    expect(component.editingWidget()).toBeNull();
    expect(widgetServiceMock.updateWidget).not.toHaveBeenCalled();
  });

  it('should create widget and reload widgets', () => {
    const request = {
      dashboardTabId: '00000000-0000-0000-0000-000000000001',
      type: 'line-chart',
      title: 'Response time',
      subtitle: '',
      metric: 'responseTime',
      timeRange: '24h',
      settings: '',
    };

    widgetServiceMock.createWidget.mockReturnValue(of({}));

    const loadSpy = vi.spyOn(component as unknown as { loadWidgets: () => void }, 'loadWidgets');
    component.onWidgetCreated(request);

    expect(widgetServiceMock.createWidget).toHaveBeenCalledWith(request);

    expect(component.isWidgetFormOpen()).toBe(false);

    expect(loadSpy).toHaveBeenCalled();
  });

  it('should update widget and reload widgets', () => {
    const request = {
      widgetId: '1',
      type: 'line-chart',
      title: 'Response time',
      subtitle: '',
      metric: 'responseTime',
      timeRange: '24h',
      settings: '',
    };

    widgetServiceMock.updateWidget.mockReturnValue(of(undefined));

    const loadSpy = vi.spyOn(component as unknown as { loadWidgets: () => void }, 'loadWidgets');
    component.onWidgetUpdated(request);

    expect(widgetServiceMock.updateWidget).toHaveBeenCalledWith(request);

    expect(component.isWidgetFormOpen()).toBe(false);

    expect(loadSpy).toHaveBeenCalled();
  });

  it('should sort widgets by priority', () => {
    component._widgets.set([
      {
        id: '1',
        type: 'bar-chart',
        metric: 'requests',
      },
      {
        id: '2',
        type: 'stat-card',
        metric: 'availability',
      },
      {
        id: '3',
        type: 'line-chart',
        metric: 'responseTime',
      },
    ]);
    expect(component.widgets().map((x) => x.type)).toEqual(['stat-card', 'line-chart', 'bar-chart']);
  });
});
