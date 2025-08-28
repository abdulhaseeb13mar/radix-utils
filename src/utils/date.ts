/**
 * Calculate estimated unlock date based on epoch information
 * @param epochUnlocked - The epoch when the stake will be unlocked
 * @param currentEpoch - The current epoch
 * @returns Formatted date string
 */
export const calculateEstimatedUnlockDate = (
  epochUnlocked: number,
  currentEpoch: number
): string => {
  const minutesPerEpoch = 5;
  const currentDate = new Date();
  const unlockDate = new Date(
    currentDate.getTime() +
      (epochUnlocked - currentEpoch) * minutesPerEpoch * 60000
  );
  return unlockDate.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};
