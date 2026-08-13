import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { WidgetCardComponent } from './widget-card.component';
import { Widget } from '@/app/core/models/widget.model';
import { provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts';

describe('WidgetCardComponent', () => {
  let component: WidgetCardComponent;
  let fixture: ComponentFixture<WidgetCardComponent>;

  const mockWidget: Widget = {
    id: '1',
    type: 'line-chart',
    metric: 'ResponseTime',
    title: 'Response Time',
    chartData: {
      labels: ['10:00', '10:05'],
      values: [100, 200],
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WidgetCardComponent],
      providers: [
        provideEchartsCore({
          echarts,
        }),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(WidgetCardComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('widget', mockWidget);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should generate line chart options', () => {
    fixture.componentRef.setInput('widget', {
      ...mockWidget,
      type: 'line-chart',
    });

    expect(component.chartOptions()).toBeTruthy();
    expect(component.chartOptions().series).toBeDefined();
  });

  it('should generate bar chart options', () => {
    fixture.componentRef.setInput('widget', {
      ...mockWidget,
      type: 'bar-chart',
    });

    expect(component.chartOptions().series).toBeDefined();
  });

  it('should generate horizontal bar chart options', () => {
    fixture.componentRef.setInput('widget', {
      ...mockWidget,
      type: 'horizontal-bar-chart',
    });

    expect(component.chartOptions().series).toBeDefined();
  });

  it('should generate donut chart options', () => {
    fixture.componentRef.setInput('widget', {
      ...mockWidget,
      type: 'donut-chart',
    });

    expect(component.chartOptions().series).toBeDefined();
  });

  it('should return empty options for unsupported widget type', () => {
    fixture.componentRef.setInput('widget', {
      ...mockWidget,
      type: 'unknown',
    });

    expect(component.chartOptions()).toEqual({});
  });

  it('should emit edit event with the widget', () => {
    const editSpy = vi.fn();

    component.edit.subscribe(editSpy);

    component.editWidget();

    expect(editSpy).toHaveBeenCalledWith(mockWidget);
  });

  it('should call delete widget', () => {
    const spy = vi.spyOn(console, 'log');

    component.deleteWidget();

    expect(spy).toHaveBeenCalledWith('Delete', mockWidget);
  });
});
