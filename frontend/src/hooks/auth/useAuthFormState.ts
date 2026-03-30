import { useEffect, useState } from 'react';
import { fetchRestaurants } from '../../services/restaurantsApi';
import type { AuthMode, Restaurant } from '../../types/auth';
import { useCooldownTimer } from './useCooldownTimer';

export function useAuthFormState() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<
    number | null
  >(null);
  const [requestManagerRole, setRequestManagerRole] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [forgotPasswordCooldownSeconds, setForgotPasswordCooldownSeconds] =
    useState(0);
  const [
    resendVerificationCooldownSeconds,
    setResendVerificationCooldownSeconds,
  ] = useState(0);

  useCooldownTimer(
    forgotPasswordCooldownSeconds,
    setForgotPasswordCooldownSeconds,
  );
  useCooldownTimer(
    resendVerificationCooldownSeconds,
    setResendVerificationCooldownSeconds,
  );

  useEffect(() => {
    let isActive = true;

    void fetchRestaurants()
      .then((result) => {
        if (!isActive) {
          return;
        }

        setRestaurants(result);
        if (result.length > 0) {
          setSelectedRestaurantId((current) => current ?? result[0].id);
        }
      })
      .catch(() => {
        if (isActive) {
          setRestaurants([]);
          setSelectedRestaurantId(null);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  function resetFeedbackState() {
    setError(null);
    setNotice(null);
  }

  function resetCooldowns() {
    setForgotPasswordCooldownSeconds(0);
    setResendVerificationCooldownSeconds(0);
  }

  return {
    mode,
    email,
    password,
    firstName,
    lastName,
    restaurants,
    selectedRestaurantId,
    requestManagerRole,
    rememberMe,
    error,
    notice,
    forgotPasswordCooldownSeconds,
    resendVerificationCooldownSeconds,
    setMode,
    setEmail,
    setPassword,
    setFirstName,
    setLastName,
    setRestaurants,
    setSelectedRestaurantId,
    setRequestManagerRole,
    setRememberMe,
    setError,
    setNotice,
    setForgotPasswordCooldownSeconds,
    setResendVerificationCooldownSeconds,
    resetFeedbackState,
    resetCooldowns,
  };
}
