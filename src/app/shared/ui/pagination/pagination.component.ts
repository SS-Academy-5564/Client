import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss',
})
export class PaginationComponent {
  readonly pageChange = output<number>();
  readonly pageNumber = input<number>(1);
  readonly totalPages = input<number>(0);

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
}
