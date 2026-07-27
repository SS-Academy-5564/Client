import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PaginationComponent } from './pagination.component';

@Component({
  imports: [PaginationComponent],
  template: `
    <app-pagination
      [pageNumber]="pageNumber()"
      [pageSize]="pageSize()"
      [totalPages]="totalPages()"
      (pageChange)="onPageChange($event)"
      (pageSizeChange)="onPageSizeChange($event)" />
  `,
})
class TestHostComponent {
  readonly pageNumber = signal(1);
  readonly pageSize = signal(10);
  readonly totalPages = signal(1);
  readonly onPageChange = vi.fn();
  readonly onPageSizeChange = vi.fn();
}

describe('PaginationComponent', () => {
  let host: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    setPagination(2, 3);
    fixture.detectChanges();
  });

  it('emits the previous page', () => {
    getButtons()[0].click();

    expect(host.onPageChange).toHaveBeenCalledWith(1);
  });

  it('emits the next page', () => {
    getButtons()[1].click();

    expect(host.onPageChange).toHaveBeenCalledWith(3);
  });

  it('disables navigation at the page boundaries', () => {
    setPagination(1, 3);
    fixture.detectChanges();

    expect(getButtons()[0].disabled).toBe(true);
    expect(getButtons()[1].disabled).toBe(false);

    setPagination(3, 3);
    fixture.detectChanges();

    expect(getButtons()[0].disabled).toBe(false);
    expect(getButtons()[1].disabled).toBe(true);
  });

  it('hides pagination when there is only one page', () => {
    setPagination(1, 1);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('nav')).toBeNull();
  });

  it('emits the new page size when dropdown selection changes', () => {
    const select = (fixture.nativeElement as HTMLElement).querySelector<HTMLSelectElement>('.rows-select');
    expect(select).not.toBeNull();
    if (select) {
      select.value = '20';
      select.dispatchEvent(new Event('change'));
      expect(host.onPageSizeChange).toHaveBeenCalledWith(20);
    }
  });

  function setPagination(pageNumber: number, totalPages: number): void {
    host.pageNumber.set(pageNumber);
    host.totalPages.set(totalPages);
  }

  function getButtons(): HTMLButtonElement[] {
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'));
  }
});
