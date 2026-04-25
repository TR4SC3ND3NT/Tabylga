import { useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import { getStrings } from './strings';

export function useStrings() {
  const language = useAuthStore((s) => s.language);
  return useMemo(() => getStrings(language), [language]);
}
