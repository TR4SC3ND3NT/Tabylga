/**
 * Mock payment merchants used ONLY by the Wallet / Offline Pay demo flows.
 *
 * Intentionally isolated from the Hotels, Food, Transport and Activities
 * modules — names may overlap, but these records exist purely so the wallet
 * can target a "merchant" when running QR / offline / Bluetooth demos.
 */

export type PaymentMerchantType =
  | 'hotel'
  | 'restaurant'
  | 'yurt'
  | 'driver'
  | 'guesthouse'
  | 'guide';

export interface PaymentMerchant {
  id: string;
  name: string;
  type: PaymentMerchantType;
  region: string;
  onlineQrSupported: boolean;
  offlineQrSupported: boolean;
  bluetoothDemoSupported: boolean;
  rating: number;
  description: string;
}

export const PAYMENT_MERCHANTS: PaymentMerchant[] = [
  {
    id: 'shepherd_yurt',
    name: "Shepherd's Life Yurt Camp",
    type: 'yurt',
    region: 'Song-Kul',
    onlineQrSupported: false,
    offlineQrSupported: true,
    bluetoothDemoSupported: true,
    rating: 4.9,
    description: 'Remote yurt camp with offline payment support.',
  },
  {
    id: 'songkul_nomad',
    name: 'Song-Kul Nomad Camp',
    type: 'yurt',
    region: 'Song-Kul',
    onlineQrSupported: false,
    offlineQrSupported: true,
    bluetoothDemoSupported: true,
    rating: 4.8,
    description: 'Nomad camp supporting offline vouchers.',
  },
  {
    id: 'tamga_yurt',
    name: 'Tamga Yurt Camp',
    type: 'yurt',
    region: 'Issyk-Kul',
    onlineQrSupported: true,
    offlineQrSupported: true,
    bluetoothDemoSupported: true,
    rating: 4.7,
    description: 'Yurt camp with online and offline payment support.',
  },
  {
    id: 'mountain_driver_naryn',
    name: 'Mountain Driver Naryn',
    type: 'driver',
    region: 'Naryn',
    onlineQrSupported: false,
    offlineQrSupported: true,
    bluetoothDemoSupported: true,
    rating: 4.8,
    description: 'Verified mountain driver for remote routes.',
  },
  {
    id: 'karakol_guesthouse',
    name: 'Karakol Guesthouse',
    type: 'guesthouse',
    region: 'Karakol',
    onlineQrSupported: true,
    offlineQrSupported: true,
    bluetoothDemoSupported: false,
    rating: 4.7,
    description: 'Guesthouse with online QR and offline voucher support.',
  },
  {
    id: 'arzu_restaurant',
    name: 'Arzu Restaurant',
    type: 'restaurant',
    region: 'Bishkek',
    onlineQrSupported: true,
    offlineQrSupported: false,
    bluetoothDemoSupported: false,
    rating: 4.7,
    description: 'National restaurant in Bishkek with QR payment.',
  },
  {
    id: 'navat_restaurant',
    name: 'Navat Restaurant',
    type: 'restaurant',
    region: 'Bishkek',
    onlineQrSupported: true,
    offlineQrSupported: false,
    bluetoothDemoSupported: false,
    rating: 4.6,
    description: 'Popular restaurant with local food and online QR support.',
  },
  {
    id: 'hyatt_bishkek',
    name: 'Hyatt Regency Bishkek',
    type: 'hotel',
    region: 'Bishkek',
    onlineQrSupported: true,
    offlineQrSupported: false,
    bluetoothDemoSupported: false,
    rating: 4.8,
    description: 'Premium hotel with online payment support.',
  },
  {
    id: 'golden_tulip',
    name: 'Golden Tulip Garden Hotel',
    type: 'hotel',
    region: 'Bishkek',
    onlineQrSupported: true,
    offlineQrSupported: false,
    bluetoothDemoSupported: false,
    rating: 4.6,
    description: 'Comfort hotel with online QR support.',
  },
  {
    id: 'ala_archa_guide',
    name: 'Ala-Archa Guide',
    type: 'guide',
    region: 'Chuy',
    onlineQrSupported: true,
    offlineQrSupported: false,
    bluetoothDemoSupported: false,
    rating: 4.6,
    description: 'Local guide with online QR payment.',
  },
];

export function getPaymentMerchantById(id: string): PaymentMerchant | undefined {
  return PAYMENT_MERCHANTS.find((m) => m.id === id);
}
