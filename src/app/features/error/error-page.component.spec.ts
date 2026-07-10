import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { ErrorPageComponent } from './error-page.component';

type RouteStub = {
  snapshot: {
    paramMap: { get: (key: string) => string | null };
    data: Record<string, unknown>;
  };
};

function createRouteStub(code: string | null, data: Record<string, unknown> = {}): RouteStub {
  return {
    snapshot: {
      paramMap: { get: (key: string): string | null => (key === 'code' ? code : null) },
      data,
    },
  };
}

async function renderWith(route: RouteStub): Promise<ComponentFixture<ErrorPageComponent>> {
  await TestBed.configureTestingModule({
    imports: [ErrorPageComponent],
    providers: [provideRouter([]), { provide: ActivatedRoute, useValue: route }],
  }).compileComponents();

  const fixture = TestBed.createComponent(ErrorPageComponent);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}

describe('ErrorPageComponent', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('renders the 404 entry for the 404 route param', async () => {
    const fixture = await renderWith(createRouteStub('404'));

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('404');
    expect(text).toContain('Page not found');
  });

  it('renders the 500 entry for the 500 route param', async () => {
    const fixture = await renderWith(createRouteStub('500'));

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('500');
    expect(text).toContain('Something went wrong');
  });

  it('renders the offline entry for the offline route param', async () => {
    const fixture = await renderWith(createRouteStub('offline'));

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Offline');
    expect(text).toContain("Can't reach the server");
  });

  it('shows the real status code with generic copy for an unmapped numeric code', async () => {
    const fixture = await renderWith(createRouteStub('503'));

    const text = fixture.nativeElement.textContent;
    // Real code preserved (not normalized to 500), generic message.
    expect(text).toContain('503');
    expect(text).not.toContain('500');
    expect(text).toContain('An unexpected error occurred. Please try again.');
  });

  it('falls back to the plain default label for a non-numeric code', async () => {
    const fixture = await renderWith(createRouteStub('foobar'));

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Error');
    expect(text).not.toContain('foobar');
    expect(text).toContain('An unexpected error occurred. Please try again.');
  });

  it('reads the code from route data when there is no param (wildcard 404)', async () => {
    const fixture = await renderWith(createRouteStub(null, { code: '404' }));

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('404');
    expect(text).toContain('Page not found');
  });

  it('never renders stack traces or exception text', async () => {
    const fixture = await renderWith(createRouteStub('500'));

    const text: string = fixture.nativeElement.textContent;
    expect(text).not.toMatch(/stack|Error:|at\s+\w+\s+\(/i);
  });
});
