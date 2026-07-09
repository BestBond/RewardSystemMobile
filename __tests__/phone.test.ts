import {
  isValidIndiaMobile,
  normalizeIndiaNationalPhoneInput,
} from '../src/utils/phone';

describe('normalizeIndiaNationalPhoneInput', () => {
  it('keeps a valid 10-digit mobile', () => {
    expect(normalizeIndiaNationalPhoneInput('9611299129')).toBe('9611299129');
  });

  it('strips spaces and leading 0', () => {
    expect(normalizeIndiaNationalPhoneInput('096112 99129')).toBe('9611299129');
    expect(normalizeIndiaNationalPhoneInput('09611299129')).toBe('9611299129');
  });

  it('strips pasted country code', () => {
    expect(normalizeIndiaNationalPhoneInput('919611299129')).toBe('9611299129');
    expect(normalizeIndiaNationalPhoneInput('+91 96112 99129')).toBe(
      '9611299129',
    );
  });

  it('does not truncate leading-0 paste to the wrong 10 digits', () => {
    // Old bug: '09611299129'.slice(0, 10) === '0961129912'
    expect(normalizeIndiaNationalPhoneInput('09611299129')).not.toBe(
      '0961129912',
    );
  });
});

describe('isValidIndiaMobile', () => {
  it('accepts mobiles starting 6-9', () => {
    expect(isValidIndiaMobile('9611299129')).toBe(true);
    expect(isValidIndiaMobile('0961129912')).toBe(false);
  });
});
