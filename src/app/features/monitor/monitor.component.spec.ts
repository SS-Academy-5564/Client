import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { MonitorComponent } from './monitor.component';
import { MonitorService } from '@core/services/monitor.service';

describe('MonitorComponent', () => {
  let component: MonitorComponent;
  let fixture: ComponentFixture<MonitorComponent>;
  const monitorServiceMock = {
    getMonitors: vi.fn().mockReturnValue(of([])),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonitorComponent],
      providers: [{ provide: MonitorService, useValue: monitorServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(MonitorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
