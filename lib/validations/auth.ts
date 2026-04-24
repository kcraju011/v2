export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isStrongPassword(value: string) {
  return value.length >= 8 && /[A-Za-z]/.test(value) && /[0-9]/.test(value);
}
