import { Component, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
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
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    NgxEchartsModule
  ],
  providers: [provideEchartsCore({
    echarts: () => import('echarts')
  })],
  template: `
    <div class="container">
      <h1 i18n>Hello, {{ title() }}</h1>

      <mat-card appearance="outlined" class="demo-card">
        <mat-card-header>
          <mat-card-title>Angular Material + ngx-echarts</mat-card-title>
          <mat-card-subtitle i18n>Standalone components with Signals and Signals-based inputs</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form class="demo-form">
            <mat-form-field appearance="fill">
              <mat-label i18n>Sample input</mat-label>
              <input i18n-placeholder matInput placeholder="Type something..." />
            </mat-form-field>

            <button i18n mat-raised-button color="primary" type="button">Primary Action</button>

            <div class="locale-examples">
              <p i18n>Date: {{ sampleDate() | date:'longDate' }}</p>
              <p i18n>Price: {{ samplePrice() | currency }}</p>
            </div>

            <div class="chart-container">
              <echarts [options]="chartOptions()" style="width:100%;height:360px;"></echarts>
              <mat-progress-spinner *ngIf="loading()" diameter="48" mode="indeterminate"></mat-progress-spinner>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
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
  `]
})
export class App {
  protected readonly title = signal('Client');
  protected readonly loading = signal(false);
  protected readonly sampleDate = signal(new Date(2024, 0, 15));
  protected readonly samplePrice = signal(1234.56);

  protected readonly chartOptions = signal({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: [$localize`Series A`, $localize`Series B`]
    },
    xAxis: {
      type: 'category',
      data: [
        $localize`Mon`,
        $localize`Tue`,
        $localize`Wed`,
        $localize`Thu`,
        $localize`Fri`,
        $localize`Sat`,
        $localize`Sun`,
      ]
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: $localize`Series A`,
        type: 'bar',
        data: [120, 200, 150, 80, 70, 110, 130]
      },
      {
        name: $localize`Series B`,
        type: 'line',
        data: [60, 120, 100, 140, 90, 80, 150]
      }
    ]
  });
}
