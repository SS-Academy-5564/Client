import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validates that a control's string value is a syntactically valid HTTP or HTTPS URL.
 *
 * Returns `{ url: true }` when the value is non-empty and fails validation.
 * Returns `null` when the value is empty (defer to `Validators.required`)
 * or when it is a valid `http:` / `https:` URL.
 *
 * @returns A {@link ValidatorFn} for use in a reactive form control.
 */
export function urlValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) {
      return null;
    }
    try {
      const parsed = new URL(value);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return null;
      }
    } catch {
      // URL constructor threw — value is not a valid absolute URL
    }
    return { url: true };
  };
}
