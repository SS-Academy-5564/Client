import { MonitorIntervalPipe } from './monitor-interval.pipe';
import { RelativeTimePipe } from './relative-time.pipe';

describe('Monitor formatting pipes', () => {
  it('formats relative timestamps and handles missing values', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-14T12:00:00Z'));

    const pipe = new RelativeTimePipe();

    expect(pipe.transform('2026-07-14T11:59:30Z')).toBe('30 sec ago');
    expect(pipe.transform('2026-07-14T11:58:00Z')).toBe('2 min ago');
    expect(pipe.transform('2026-07-13T12:00:00Z')).toBe('1 day ago');
    expect(pipe.transform(null)).toBe('—');
    expect(pipe.transform('invalid')).toBe('—');

    vi.useRealTimers();
  });

  it('formats monitor intervals', () => {
    const pipe = new MonitorIntervalPipe();

    expect(pipe.transform(30)).toBe('30s');
    expect(pipe.transform(60)).toBe('1m');
    expect(pipe.transform(300)).toBe('5m');
    expect(pipe.transform(900)).toBe('15m');
  });
});
