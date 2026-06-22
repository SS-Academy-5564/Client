import { Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxEchartsModule } from 'ngx-echarts';
import { provideEchartsCore } from 'ngx-echarts';

@Component({
  selector: 'app-root',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    NgxEchartsModule,
  ],
  providers: [
    provideEchartsCore({
      echarts: () => import('echarts'),
    }),
  ],
  template: `
    <div class="container">
      <h1>Hello, {{ title() }}</h1>

      <mat-card appearance="outlined" class="demo-card">
        <mat-card-header>
          <mat-card-title>Angular Material + ngx-echarts</mat-card-title>
          <mat-card-subtitle
            >Standalone components with Signals and Signals-based inputs</mat-card-subtitle
          >
        </mat-card-header>

        <mat-card-content>
          <form class="demo-form">
            <mat-form-field appearance="fill">
              <mat-label>Sample input</mat-label>
              <input matInput placeholder="Type something..." />
            </mat-form-field>

            <button mat-raised-button color="primary" type="button">Primary Action</button>

            <div class="chart-container">
              <echarts [options]="chartOptions()" style="width:100%;height:360px;"></echarts>
              @if (loading()) {
                <mat-progress-spinner diameter="48" mode="indeterminate"></mat-progress-spinner>
              }
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .container {
        padding: 24px;
        max-width: 960px;
        margin: 0 auto;
        box-sizing: border-box;
      }

      .demo-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .demo-card {
        margin-top: 16px;
      }

      .chart-container {
        margin-top: 16px;
      }
    `,
  ],
})
export class App {
  protected readonly title = signal('Client');
  protected readonly loading = signal(false);

  protected readonly chartOptions = signal({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['Series A', 'Series B'],
    },
    xAxis: {
      type: 'category',
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: 'Series A',
        type: 'bar',
        data: [120, 200, 150, 80, 70, 110, 130],
      },
      {
        name: 'Series B',
        type: 'line',
        data: [60, 120, 100, 140, 90, 80, 150],
      },
    ],
  });
}
