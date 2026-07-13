import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { ResetSuccessComponent } from './reset-success.component';

describe('ResetSuccessComponent', () => {
  let component: ResetSuccessComponent;
  let fixture: ComponentFixture<ResetSuccessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResetSuccessComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetSuccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });
});
