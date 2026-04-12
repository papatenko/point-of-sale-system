export const PHONE_MIN_LENGTH = 10;
export const PHONE_MAX_LENGTH = 17;
export const PHONE_PLACEHOLDER = "(123) 456-7890";

export const NAME_MIN_LENGTH = 1;
export const NAME_MAX_LENGTH = 50;
export const NAME_REGEX = /^[a-zA-Z][a-zA-Z\s\-']*$/;

export function formatPhoneNumber(value) {
  const digits = value.replace(/[^0-9]/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11) {
    return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
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
  return len >= PHONE_MIN_LENGTH && len <= 11;
}

export function getPhoneError(phone) {
  if (!phone) return null;
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.length > 0 && digits.length < PHONE_MIN_LENGTH) {
    return "Phone number must be 10-11 digits";
  }
  return null;
}

export function validateName(name) {
  if (!name) return false;
  const trimmed = name.trim();
  if (trimmed.length < NAME_MIN_LENGTH || trimmed.length > NAME_MAX_LENGTH) {
    return false;
  }
  return NAME_REGEX.test(trimmed);
}

export function getNameError(name) {
  if (!name) return "Name is required";
  const trimmed = name.trim();
  if (trimmed.length < NAME_MIN_LENGTH) {
    return "Name must be at least 1 character";
  }
  if (trimmed.length > NAME_MAX_LENGTH) {
    return `Name must be no more than ${NAME_MAX_LENGTH} characters`;
  }
  if (!NAME_REGEX.test(trimmed)) {
    return "Name must start with a letter and contain only letters, spaces, hyphens, or apostrophes";
  }
  return null;
}

export function sanitizeName(name) {
  if (!name) return "";
  return name.replace(/[^a-zA-Z\s\-']/g, "");
}
