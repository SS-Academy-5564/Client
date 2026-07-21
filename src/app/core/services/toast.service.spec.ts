import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  const snackBar = {
    open: vi.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ToastService, { provide: MatSnackBar, useValue: snackBar }],
    });

    snackBar.open.mockClear();
  });

  it('should show a success toast', () => {
    const service = TestBed.inject(ToastService);

    service.success('Monitor created');

    expect(snackBar.open).toHaveBeenCalledWith(
      'Monitor created',
      expect.any(String),
      expect.objectContaining({
        duration: 3_500,
        panelClass: ['pulse-toast', 'toast-success'],
      }),
    );
  });
});
