import { FormControl, ValidationErrors } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { urlValidator } from './url.validator';

describe('urlValidator', () => {
  const validate = (value: string): ValidationErrors | null => urlValidator()(new FormControl(value));

  it('returns null for an empty value (defers to required)', () => {
    expect(validate('')).toBeNull();
  });

  it('returns null for a valid http URL', () => {
    expect(validate('http://example.com')).toBeNull();
  });

  it('returns null for a valid https URL', () => {
    expect(validate('https://api.example.com/data?key=val')).toBeNull();
  });

  it('returns { url: true } for an ftp URL', () => {
    expect(validate('ftp://example.com/file')).toEqual({ url: true });
  });

  it('returns { url: true } for plain text (no protocol)', () => {
    expect(validate('not-a-url')).toEqual({ url: true });
  });

  it('returns { url: true } for a javascript: URL', () => {
    expect(validate('javascript:alert(1)')).toEqual({ url: true });
  });

  it('returns { url: true } for a relative path', () => {
    expect(validate('/api/data')).toEqual({ url: true });
  });
});
