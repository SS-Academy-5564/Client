import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PaginationComponent } from './pagination.component';

@Component({
  imports: [PaginationComponent],
  template: `
    <app-pagination [pageNumber]="pageNumber()" [totalPages]="totalPages()" (pageChange)="onPageChange($event)" />
  `,
})
class TestHostComponent {
  readonly pageNumber = signal(1);
  readonly totalPages = signal(1);
  readonly onPageChange = vi.fn();
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

  function setPagination(pageNumber: number, totalPages: number): void {
    host.pageNumber.set(pageNumber);
    host.totalPages.set(totalPages);
  }

  function getButtons(): HTMLButtonElement[] {
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'));
  }
});
