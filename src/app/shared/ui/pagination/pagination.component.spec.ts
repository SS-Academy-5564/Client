import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PaginationComponent } from './pagination.component';

describe('PaginationComponent', () => {
  let component: PaginationComponent;
  let fixture: ComponentFixture<PaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PaginationComponent);
    component = fixture.componentInstance;
    setPagination(2, 3);
    fixture.detectChanges();
  });

  it('emits the previous page', () => {
    const pageChange = vi.fn();
    component.pageChange.subscribe(pageChange);

    getButtons()[0].click();

    expect(pageChange).toHaveBeenCalledWith(1);
  });

  it('emits the next page', () => {
    const pageChange = vi.fn();
    component.pageChange.subscribe(pageChange);

    getButtons()[1].click();

    expect(pageChange).toHaveBeenCalledWith(3);
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
    // The project's JIT Vitest setup does not compile signal input metadata,
    // so setInput() cannot update these inputs in an isolated component test.
    Object.defineProperties(component, {
      pageNumber: { value: signal(pageNumber), configurable: true },
      totalPages: { value: signal(totalPages), configurable: true },
    });
  }

  function getButtons(): HTMLButtonElement[] {
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'));
  }
});
