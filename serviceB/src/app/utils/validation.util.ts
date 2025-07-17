import { BadRequestException } from '@nestjs/common';

/**
 * Validates date string and returns a Date object
 * @param dateString - The date string to validate
 * @param fieldName - The name of the field for error reporting
 * @returns Date object or undefined if dateString is falsy
 */
export function validateDate(dateString: string | undefined, fieldName: string): Date | undefined {
  if (!dateString) return undefined;

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new BadRequestException(`Invalid ${fieldName} format`);
  }
  return date;
}

/**
 * Validates and parses integer from string
 * @param value - The string value to parse
 * @param defaultValue - Default value if parsing fails
 * @returns Parsed integer or default value
 */
export function parseInteger(value: string | undefined, defaultValue = 1): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Validates required fields in an object
 * @param obj - The object to validate
 * @param fields - Array of required field names
 * @throws BadRequestException if any required field is missing
 */
export function validateRequiredFields(obj: Record<string, unknown>, fields: string[]): void {
  const missingFields = fields.filter(field => !obj[field]);
  if (missingFields.length > 0) {
    throw new BadRequestException(`Missing required fields: ${missingFields.join(', ')}`);
  }
}
