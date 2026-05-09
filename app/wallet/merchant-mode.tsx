import { Redirect } from 'expo-router';

export default function LegacyMerchantModeRedirect() {
  return <Redirect href="/merchant/dashboard" />;
}
