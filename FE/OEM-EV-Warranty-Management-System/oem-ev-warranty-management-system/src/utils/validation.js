export const PHONE_LENGTH = 10;
export const PHONE_PATTERN = '0\\d{9}';
export const PHONE_REGEX = /^0\d{9}$/;
export const PHONE_ERROR_MESSAGE = 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0.';

export const sanitizeDigits = (value = '') => value.replace(/\D/g, '');

export const formatPhoneInput = (value = '') => {
  const digitsOnly = sanitizeDigits(value);
  return digitsOnly.slice(0, PHONE_LENGTH);
};

export const isValidPhoneNumber = (value = '') => PHONE_REGEX.test(value);

export const getMaxAllowedYear = () => new Date().getFullYear() + 1;

export const MIN_YEAR = 1900;

export const clampYearValue = (value = '') => {
  if (value === '' || value === null || value === undefined) return '';
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return '';
  const maxYear = getMaxAllowedYear();
  return Math.min(Math.max(numericValue, MIN_YEAR), maxYear);
};

export const sanitizeYearListInput = (value = '') =>
  value.replace(/[^0-9,\s]/g, '').replace(/\s+/g, ' ').trim();

export const parseYearList = (value = '') =>
  sanitizeYearListInput(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => Number(item))
    .filter((num) => !Number.isNaN(num));

export const isYearWithinRange = (year) =>
  typeof year === 'number' &&
  !Number.isNaN(year) &&
  year >= MIN_YEAR &&
  year <= getMaxAllowedYear();

// Email validation
export const EMAIL_PATTERN = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
export const EMAIL_ERROR_MESSAGE = 'Vui lòng nhập một địa chỉ email hợp lệ.';

export const isValidEmail = (email) => {
  if (!email || email.trim() === '') return false;
  return EMAIL_PATTERN.test(String(email).toLowerCase());
};

