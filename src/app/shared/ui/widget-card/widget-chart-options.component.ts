import { ChartData } from '@/app/core/models/chart-data-model';
import { EChartsOption } from 'echarts';

function singleLegend(name: string, color: string): EChartsOption['legend'] {
  return {
    data: [name],
    top: 0,
    left: 0,
    icon: 'circle' as const,
    itemWidth: 8,
    itemHeight: 8,
    itemGap: 6,
    textStyle: {
      fontSize: 13,
      fontWeight: 700,
      color: '#1F2937',
    },
    selectedMode: false,
    inactiveColor: color,
  };
}

export function createLineChartOptions(data: ChartData, seriesName: string): EChartsOption {
  return {
    tooltip: {
      trigger: 'axis',
    },

    legend: singleLegend(seriesName, '#3B82F6'),

    grid: {
      left: 4,
      right: 20,
      top: 44,
      bottom: 30,
      containLabel: true,
    },

    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.labels,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
    },

    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: {
        lineStyle: {
          color: '#EEF2F7',
        },
      },
    },

    series: [
      {
        name: seriesName,
        type: 'line',
        smooth: true,
        symbol: 'none',
        color: '#3B82F6',

        lineStyle: {
          color: '#3B82F6',
          width: 2,
        },

        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: 'rgba(59,130,246,0.25)',
              },
              {
                offset: 1,
                color: 'rgba(59,130,246,0)',
              },
            ],
          },
        },

        data: data.values,
      },
    ],
  };
}

export function createBarChartOptions(data: ChartData, seriesName: string): EChartsOption {
  return {
    tooltip: {
      trigger: 'axis',
    },

    legend: singleLegend(seriesName, '#6D4AFF'),

    grid: {
      left: 4,
      right: 20,
      top: 44,
      bottom: 30,
      containLabel: true,
    },

    xAxis: {
      type: 'category',
      data: data.labels,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
    },

    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: {
        lineStyle: {
          color: '#EEF2F7',
        },
      },
    },

    series: [
      {
        name: seriesName,
        type: 'bar',
        color: '#6D4AFF',

        data: data.values,

        barWidth: '60%',
        barCategoryGap: '20%',
        barGap: '0%',

        itemStyle: {
          color: '#6D4AFF',
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  };
}

export function createHorizontalBarChartOptions(data: ChartData, seriesName: string): EChartsOption {
  return {
    tooltip: {
      trigger: 'axis',
    },

    legend: singleLegend(seriesName, '#6D4AFF'),

    grid: {
      left: 4,
      right: 40,
      top: 44,
      bottom: 20,
      containLabel: true,
    },

    xAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: {
        lineStyle: {
          color: '#EEF2F7',
        },
      },
    },

    yAxis: {
      type: 'category',
      data: data.labels,
      axisLine: { show: false },
      axisTick: { show: false },
    },

    series: [
      {
        name: seriesName,
        type: 'bar',
        color: '#6D4AFF',

        data: data.values,

        barWidth: '45%',
        barCategoryGap: '50%',

        itemStyle: {
          color: '#6D4AFF',
          borderRadius: [0, 6, 6, 0],
        },

        label: {
          show: true,
          position: 'right',
          color: '#1F2937',
          fontSize: 13,
          fontWeight: 700,
        },
      },
    ],
  };
}

export function createDonutChartOptions(data: ChartData): EChartsOption {
  const aggregatedMap = new Map<string, number>();

  data.labels.forEach((label, index) => {
    const val = data.values[index] ?? 0;
    aggregatedMap.set(label, (aggregatedMap.get(label) ?? 0) + val);
  });

  const chartData = Array.from(aggregatedMap.entries()).map(([name, value]) => ({
    name,
    value: Number(value.toFixed(2)),
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return {
    color: ['#6D4AFF', '#3B82F6', '#4ADE80', '#F59E0B', '#EF4444'],

    tooltip: {
      trigger: 'item',
    },

    legend: {
      orient: 'vertical',
      left: '46%',
      top: 'center',

      icon: 'circle',
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 16,

      textStyle: {
        fontSize: 13,
        color: '#1F2937',
      },

      formatter: (name: string): string => {
        const item = chartData.find((x) => x.name === name);

        if (!item) {
          return name;
        }

        const pct = total === 0 ? '0.0' : ((item.value / total) * 100).toFixed(1);

        return `${name} ${item.value} (${pct}%)`;
      },
    },

    series: [
      {
        type: 'pie',
        radius: ['48%', '78%'],
        center: ['23%', '50%'],

        label: {
          show: false,
        },

        labelLine: {
          show: false,
        },

        data: chartData,
      },
    ],
  };
}
