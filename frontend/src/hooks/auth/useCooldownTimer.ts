import { useEffect } from 'react';

export function useCooldownTimer(
  value: number,
  setValue: (updater: (current: number) => number) => void,
) {
  useEffect(() => {
    if (value <= 0) {
      return;
    }

    const intervalId = setInterval(() => {
      setValue((currentValue) => (currentValue > 1 ? currentValue - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [setValue, value]);
}
