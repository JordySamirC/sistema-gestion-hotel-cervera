import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { isValidPhoneNumber, CountryCode } from 'libphonenumber-js';
import { infoPorNacionalidad } from './phone-utils';

export function phoneValidator(nacionalidad: () => string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value || value.trim() === '') return null;

    const info = infoPorNacionalidad(nacionalidad());
    if (!info) return null;

    const fullNumber = info.codigo + value;
    return isValidPhoneNumber(fullNumber, info.iso as CountryCode) ? null : { invalidPhone: true };
  };
}
