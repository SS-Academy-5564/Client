import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { ErrorPageComponent } from './error-page.component';

type ParamMapStub = { get: (key: string) => string | null };

function createParamMap(code: string | null): ParamMapStub {
  return { get: (key: string): string | null => (key === 'code' ? code : null) };
}

type RouteStub = {
  paramMap: BehaviorSubject<ParamMapStub>;
  data: BehaviorSubject<Record<string, unknown>>;
  snapshot: {
    paramMap: ParamMapStub;
    data: Record<string, unknown>;
  };
};

function createRouteStub(code: string | null, data: Record<string, unknown> = {}): RouteStub {
  const paramMap = createParamMap(code);
  return {
    paramMap: new BehaviorSubject<ParamMapStub>(paramMap),
    data: new BehaviorSubject<Record<string, unknown>>(data),
    snapshot: { paramMap, data },
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

  it('recomputes the entry when the code param changes on a reused instance', async () => {
    const route = createRouteStub('503');
    const fixture = await renderWith(route);

    expect(fixture.nativeElement.textContent).toContain('503');

    // Simulate a same-route navigation (component instance reused) to a code
    // that maps to a distinct page; the display must follow the new param.
    route.paramMap.next(createParamMap('404'));
    fixture.detectChanges();
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('404');
    expect(text).toContain('Page not found');
    expect(text).not.toContain('503');
  });

  it('never renders stack traces or exception text', async () => {
    const fixture = await renderWith(createRouteStub('500'));

    const text: string = fixture.nativeElement.textContent;
    expect(text).not.toMatch(/stack|Error:|at\s+\w+\s+\(/i);
  });
});
