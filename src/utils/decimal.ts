import { Decimal } from 'decimal.js';

// Configure Decimal for Radix use case
Decimal.config({
  precision: 28,
  rounding: Decimal.ROUND_HALF_UP,
});

/**
 * Creates a new Decimal instance with Radix-specific configuration
 * @param value - The value to convert to Decimal
 * @returns A new Decimal instance
 */
export const BN = (value: string | number): Decimal => new Decimal(value);

/**
 * Retry a promise with exponential backoff
 * @param promises - Array of promises to execute
 * @param retries - Number of retries (default: 3)
 * @param delay - Initial delay in milliseconds (default: 1000)
 * @returns Promise that resolves to the result of Promise.all
 */
export const retryPromiseAll = async <T>(
  promises: Promise<T>[],
  retries = 3,
  delay = 1000
): Promise<T[]> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await Promise.all(promises);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) =>
        setTimeout(resolve, delay * Math.pow(2, i))
      );
    }
  }
  throw new Error('All retries exhausted');
};
