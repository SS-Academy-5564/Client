import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsModule, provideEchartsCore } from 'ngx-echarts';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { FormsModule } from '@angular/forms';
import { EChartsOption } from 'echarts';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '@shared/ui/button/button.component';

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    NgxEchartsModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    FormsModule,
    RouterModule,
    ButtonComponent
  ],
  providers: [provideEchartsCore({
    echarts: () => import('echarts')
  })],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  protected readonly title = signal('Client');
  protected readonly loading = signal(false);

  protected readonly chartOptions = signal({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['Series A', 'Series B']
    },
    xAxis: {
      type: 'category',
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: 'Series A',
        type: 'bar',
        data: [120, 200, 150, 80, 70, 110, 130]
      },
      {
        name: 'Series B',
        type: 'line',
        data: [60, 120, 100, 140, 90, 80, 150]
      }
    ]
  });
}
