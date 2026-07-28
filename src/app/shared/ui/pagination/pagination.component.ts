import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss',
})
export class PaginationComponent {
  readonly pageNumber = input<number>(1);
  readonly pageSize = input<number>(10);
  readonly totalPages = input<number>(0);
  readonly pageSizeOptions = input<number[]>([5, 10, 20, 50]);

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();
  onPreviousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageChange.emit(this.pageNumber() - 1);
    }
  }

  onNextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageChange.emit(this.pageNumber() + 1);
    }
  }

  onPageSizeSelect(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newSize = Number(select.value);
    if (newSize && newSize !== this.pageSize()) {
      this.pageSizeChange.emit(newSize);
    }
  }
}
