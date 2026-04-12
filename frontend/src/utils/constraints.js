export const PHONE_MIN_LENGTH = 10;
export const PHONE_MAX_LENGTH = 14;
export const PHONE_PLACEHOLDER = "(123) 456-7890";

export function formatPhoneNumber(value) {
  const digits = value.replace(/[^0-9]/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function normalizePhoneNumber(phone) {
  if (!phone) return null;
  return phone.replace(/[^0-9]/g, "");
}

export function validatePhoneNumber(phone) {
  if (!phone) return true;
  const digits = phone.replace(/[^0-9]/g, "");
  const len = digits.length;
  return len >= PHONE_MIN_LENGTH && len <= PHONE_MIN_LENGTH;
}

export function getPhoneError(phone) {
  if (!phone) return null;
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.length > 0 && digits.length < PHONE_MIN_LENGTH) {
    return `Phone number must be at least ${PHONE_MIN_LENGTH} digits`;
  }
  return null;
}
