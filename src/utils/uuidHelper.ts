import { randomUUID } from 'crypto';

export function generateUuid(): string {
  return randomUUID();
}

export function cleanUuid(value: string | null | undefined): string | null {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return null;
  }
  return value.trim();
}

export function cleanUuidFields<T extends Record<string, any>>(
  data: T,
  uuidFields: (keyof T)[]
): T {
  const cleaned = { ...data };

  uuidFields.forEach((field) => {
    if (field in cleaned) {
      cleaned[field] = cleanUuid(cleaned[field] as any) as any;
    }
  });

  return cleaned;
}

export function isValidUuid(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}
