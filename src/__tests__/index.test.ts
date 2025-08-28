import {
  BN,
  calculateEstimatedUnlockDate,
  computeValidatorFeeFactor,
  fetchWalletBalances,
} from '../index';

describe('Radix Utils', () => {
  describe('BN (Decimal utilities)', () => {
    it('should create a decimal with proper precision', () => {
      const decimal = BN('123.456789012345678901234567890');
      expect(decimal.toString()).toBe('123.45678901234567890123456789');
    });

    it('should perform accurate decimal arithmetic', () => {
      const a = BN('100.123456789');
      const b = BN('200.987654321');
      const result = a.plus(b);
      expect(result.toString()).toBe('301.11111111');
    });
  });

  describe('calculateEstimatedUnlockDate', () => {
    it('should calculate unlock date correctly', () => {
      const currentEpoch = 1000;
      const unlockEpoch = 1100;
      const result = calculateEstimatedUnlockDate(unlockEpoch, currentEpoch);

      // Result should be a valid date string
      expect(typeof result).toBe('string');
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/); // Should match DD/MM/YYYY format
    });

    it('should handle same epoch', () => {
      const epoch = 1000;
      const result = calculateEstimatedUnlockDate(epoch, epoch);
      expect(typeof result).toBe('string');
    });
  });

  describe('computeValidatorFeeFactor', () => {
    it('should compute current fee factor without changes', () => {
      const result = computeValidatorFeeFactor('0.05', null, 1000);

      expect(result.current).toBe('5.00%');
      expect(result.aboutToChange).toBeNull();
      expect(result.alert).toBe('');
    });

    it('should compute fee factor with future change', () => {
      const newFeeFactor = {
        new_fee_factor: '0.03',
        epoch_effective: 1100,
      };

      const result = computeValidatorFeeFactor('0.05', newFeeFactor, 1000);

      expect(result.current).toBe('5.00%');
      expect(result.aboutToChange).toEqual({
        new_fee_factor: '3.00%',
        epoch_effective: 1100,
      });
      expect(result.alert).toContain('Fee will be changed to 3.00%');
    });

    it('should apply new fee factor when epoch is reached', () => {
      const newFeeFactor = {
        new_fee_factor: '0.03',
        epoch_effective: 1000,
      };

      const result = computeValidatorFeeFactor('0.05', newFeeFactor, 1000);

      expect(result.current).toBe('3.00%');
      expect(result.aboutToChange).toBeNull();
    });
  });

  describe('fetchWalletBalances', () => {
    it('should be exported from the main module', () => {
      expect(typeof fetchWalletBalances).toBe('function');
    });
  });
});
