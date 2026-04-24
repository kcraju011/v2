export function requireEnv(value: string, key: string) {
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}
