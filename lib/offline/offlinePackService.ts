import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Itinerary } from '../ai/generateTrip';
import type { WalletState } from '../../stores/walletStore';

export interface OfflinePackItem {
  id?: string;
  name: string;
  type: "stay" | "transport" | "food" | "activity" | "note";
  region?: string;
  city?: string;
  price?: number;
  currency?: "USD" | "KGS";
  contact?: string;
  address?: string;
  offlineAvailable?: boolean;
  paymentLabels?: string[];
  notes?: string;
  status?: "suggested" | "booked_mock" | "saved" | "pending";
}

export interface OfflinePackDay {
  dayNumber: number;
  title: string;
  region?: string;
  city?: string;
  stay?: OfflinePackItem | null;
  transport?: OfflinePackItem | null;
  food?: OfflinePackItem | null;
  activities: OfflinePackItem[];
  notes: string[];
}

export interface EmergencyContact {
  id: string;
  title: string;
  phone: string;
  description: string;
}

export interface PhrasebookItem {
  id: string;
  category: "basic" | "transport" | "hotel" | "food" | "emergency" | "payment";
  english: string;
  russian: string;
  kyrgyz?: string;
}

export interface OfflinePaymentSnapshot {
  totalBalance?: number;
  availableOnline?: number;
  offlineReserve?: number;
  lockedOffline?: number;
  pendingSync?: number;
  currency: "KGS";
  status: "not_ready" | "ready" | "pending_sync";
  message: string;
}

export interface OfflinePack {
  id: string;
  tripId: string | null;
  title: string;
  savedAt: string;
  lastUpdatedAt: string;
  status: "saved_offline" | "needs_update" | "expired_demo";
  days: OfflinePackDay[];
  emergencyContacts: EmergencyContact[];
  phrasebook: PhrasebookItem[];
  offlinePaymentSnapshot: OfflinePaymentSnapshot | null;
  notes: string[];
  syncStatus: {
    lastSyncedAt: string;
    hasLocalChanges: boolean;
    message: string;
  };
}

const STORAGE_KEY_PACK = 'tabylga_offline_pack';
const STORAGE_KEY_MODE = 'tabylga_offline_mode';
const STORAGE_KEY_HISTORY = 'tabylga_offline_pack_history';

export const getOfflinePack = async (): Promise<OfflinePack | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY_PACK);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.warn('[OfflinePackService] Failed to get offline pack:', error);
    return null;
  }
};

export const deleteOfflinePack = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY_PACK);
  } catch (error) {
    console.warn('[OfflinePackService] Failed to delete offline pack:', error);
  }
};

export const getOfflineMode = async (): Promise<boolean> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY_MODE);
    return data === 'true';
  } catch (error) {
    console.warn('[OfflinePackService] Failed to get offline mode:', error);
    return false;
  }
};

export const setOfflineMode = async (enabled: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_MODE, enabled ? 'true' : 'false');
  } catch (error) {
    console.warn('[OfflinePackService] Failed to set offline mode:', error);
  }
};

export const getOfflinePackHistory = async (): Promise<OfflinePack[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY_HISTORY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.warn('[OfflinePackService] Failed to get offline pack history:', error);
    return [];
  }
};

export const saveOfflinePackHistoryEntry = async (pack: OfflinePack): Promise<void> => {
  try {
    const history = await getOfflinePackHistory();
    history.push(pack);
    await AsyncStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
  } catch (error) {
    console.warn('[OfflinePackService] Failed to save offline pack history entry:', error);
  }
};

export const updateOfflinePack = async (pack: OfflinePack): Promise<void> => {
  try {
    pack.lastUpdatedAt = new Date().toISOString();
    await AsyncStorage.setItem(STORAGE_KEY_PACK, JSON.stringify(pack));
  } catch (error) {
    console.warn('[OfflinePackService] Failed to update offline pack:', error);
  }
};

export const markOfflinePackNeedsUpdate = async (): Promise<void> => {
  try {
    const pack = await getOfflinePack();
    if (pack) {
      pack.status = 'needs_update';
      await updateOfflinePack(pack);
    }
  } catch (error) {
    console.warn('[OfflinePackService] Failed to mark offline pack needs update:', error);
  }
};

export const getEmergencyContacts = (): EmergencyContact[] => {
  return [
    { id: '1', title: 'Emergency services', phone: '112', description: 'General emergency' },
    { id: '2', title: 'Ambulance', phone: '103', description: 'Medical emergency' },
    { id: '3', title: 'Police', phone: '102', description: 'Law enforcement' },
    { id: '4', title: 'Fire service', phone: '101', description: 'Fire and rescue' },
    { id: '5', title: 'Tourist support demo', phone: '+996 555 000 000', description: 'Demo support' },
    { id: '6', title: 'Tabylga support demo', phone: '+996 700 000 000', description: 'Demo support' },
  ];
};

export const getPhrasebook = (): PhrasebookItem[] => {
  return [
    { id: '1', category: 'basic', english: 'Hello', russian: 'Здравствуйте' },
    { id: '2', category: 'basic', english: 'Thank you', russian: 'Спасибо' },
    { id: '3', category: 'basic', english: 'I need help', russian: 'Мне нужна помощь' },
    { id: '4', category: 'basic', english: 'I do not speak Russian', russian: 'Я не говорю по-русски' },
    { id: '5', category: 'basic', english: 'Do you speak English?', russian: 'Вы говорите по-английски?' },
    { id: '6', category: 'transport', english: 'How much does it cost?', russian: 'Сколько это стоит?' },
    { id: '7', category: 'transport', english: 'Please take me to this address.', russian: 'Пожалуйста, отвезите меня по этому адресу.' },
    { id: '8', category: 'transport', english: 'Can you wait here?', russian: 'Вы можете подождать здесь?' },
    { id: '9', category: 'transport', english: 'Is this the road to Song-Kul?', russian: 'Это дорога на Сон-Куль?' },
    { id: '10', category: 'hotel', english: 'I have a booking.', russian: 'У меня есть бронь.' },
    { id: '11', category: 'hotel', english: 'Can I check in?', russian: 'Могу я заселиться?' },
    { id: '12', category: 'hotel', english: 'Is there Wi-Fi?', russian: 'Здесь есть Wi-Fi?' },
    { id: '13', category: 'hotel', english: 'Can I charge my phone?', russian: 'Могу я зарядить телефон?' },
    { id: '14', category: 'food', english: 'I do not eat meat.', russian: 'Я не ем мясо.' },
    { id: '15', category: 'food', english: 'Is this halal?', russian: 'Это халяль?' },
    { id: '16', category: 'food', english: 'Can I have water?', russian: 'Можно мне воды?' },
    { id: '17', category: 'food', english: 'How much is this?', russian: 'Сколько это стоит?' },
    { id: '18', category: 'emergency', english: 'I am lost.', russian: 'Я заблудился.' },
    { id: '19', category: 'emergency', english: 'I need a doctor.', russian: 'Мне нужен врач.' },
    { id: '20', category: 'emergency', english: 'Please call the police.', russian: 'Пожалуйста, вызовите полицию.' },
    { id: '21', category: 'emergency', english: 'My phone has no internet.', russian: 'В моем телефоне нет интернета.' },
    { id: '22', category: 'payment', english: 'Can I pay by QR?', russian: 'Могу я оплатить по QR?' },
    { id: '23', category: 'payment', english: 'Can I pay offline?', russian: 'Могу я оплатить оффлайн?' },
    { id: '24', category: 'payment', english: 'The payment will sync later.', russian: 'Оплата синхронизируется позже.' },
  ];
};

export const getOfflinePaymentSnapshot = (wallet?: WalletState): OfflinePaymentSnapshot => {
  if (!wallet) {
    return {
      currency: 'KGS',
      status: 'not_ready',
      message: 'Offline Pay is not activated yet.',
    };
  }

  const totalBalance = wallet.balanceKgs || 0;
  const exchangeRate = wallet.exchangeRate || 87.0;
  const offlineLimitKgs = (wallet.offlineLimit || 0) * exchangeRate;
  
  let pendingSync = 0;
  if (wallet.offlinePending && wallet.offlinePending.length > 0) {
     pendingSync = wallet.offlinePending.reduce((sum, tx) => sum + tx.amountKgs, 0);
  }

  const offlineReserve = Math.max(0, offlineLimitKgs - pendingSync);
  const lockedOffline = pendingSync; 
  const availableOnline = totalBalance; 

  let status: OfflinePaymentSnapshot['status'] = 'not_ready';
  if (pendingSync > 0) {
    status = 'pending_sync';
  } else if (offlineReserve > 0) {
    status = 'ready';
  }

  return {
    totalBalance,
    availableOnline,
    offlineReserve,
    lockedOffline,
    pendingSync,
    currency: 'KGS',
    status,
    message: status === 'ready' ? 'Ready for offline payments' : (status === 'pending_sync' ? 'Payments pending sync' : 'Offline Pay is not activated yet.'),
  };
};

export const buildOfflinePackSnapshot = ({ currentTrip, wallet }: { currentTrip: Itinerary; wallet?: WalletState }): OfflinePack => {
  const trip = currentTrip as any;
  const sourceDays = Array.isArray(trip.dailyPlans) ? trip.dailyPlans : Array.isArray(trip.days) ? trip.days : [];
  const regions = Array.isArray(trip.regions) ? trip.regions : Array.isArray(trip.regionsCovered) ? trip.regionsCovered : [];
  const days: OfflinePackDay[] = sourceDays.map((day: any) => {
    const activities = Array.isArray(day.activities) ? day.activities : [];
    return {
      dayNumber: day.day ?? day.dayNumber ?? 1,
      title: `Day ${day.day}`,
      region: day.region || regions[0] || 'Kyrgyzstan',
      city: day.city || day.region || regions[0] || 'Kyrgyzstan',
      stay: day.stay ? {
        id: day.stay.id,
        name: day.stay.name,
        type: 'stay',
        region: day.stay.region,
        city: day.stay.city,
        price: day.stay.pricePerNight,
        currency: 'USD',
        offlineAvailable: !!day.stay.offlinePaymentSupported,
        paymentLabels: [day.stay.qrPayment ? 'QR payment' : null, day.stay.offlinePaymentSupported ? 'Offline Pay' : null].filter(Boolean),
        status: day.stay.status || 'suggested',
      } : null,
      transport: day.transport ? {
        id: day.transport.id,
        name: day.transport.name,
        type: 'transport',
        price: day.transport.price,
        currency: 'USD',
        offlineAvailable: !!day.transport.offlineContactAvailable,
        paymentLabels: [day.transport.qrPayment ? 'QR payment' : null, day.transport.offlineContactAvailable ? 'Offline contact' : null].filter(Boolean),
        notes: day.transport.description,
      } : null,
      food: day.food ? {
        id: day.food.id,
        name: day.food.name,
        type: 'food',
        price: day.food.priceEstimate,
        currency: 'USD',
        offlineAvailable: !!day.food.offlinePaymentSupported,
        paymentLabels: [day.food.qrPayment ? 'QR payment' : null, day.food.offlinePaymentSupported ? 'Offline Pay' : null].filter(Boolean),
        notes: day.food.description,
      } : null,
      activities: activities.map((act: any) => ({
        id: act.id || act.placeId,
        name: act.name || act.placeName,
        type: 'activity',
        price: act.price ?? act.costUsd,
        currency: 'USD',
        offlineAvailable: true,
        notes: act.description
      })),
      notes: [],
    };
  });

  return {
    id: `offline_${Date.now()}`,
    tripId: trip.id || null,
    title: trip.title || 'Offline Trip',
    savedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    status: 'saved_offline',
    days,
    emergencyContacts: getEmergencyContacts(),
    phrasebook: getPhrasebook(),
    offlinePaymentSnapshot: getOfflinePaymentSnapshot(wallet),
    notes: Array.isArray(trip.tips) ? trip.tips : trip.summary ? [trip.summary] : [],
    syncStatus: {
      lastSyncedAt: new Date().toISOString(),
      hasLocalChanges: false,
      message: 'Up to date',
    },
  };
};

export const saveOfflinePackFromCurrentTrip = async (currentTrip: Itinerary, optionalWalletSnapshot?: WalletState): Promise<OfflinePack> => {
  const pack = buildOfflinePackSnapshot({ currentTrip, wallet: optionalWalletSnapshot });
  await AsyncStorage.setItem(STORAGE_KEY_PACK, JSON.stringify(pack));
  await saveOfflinePackHistoryEntry(pack);
  return pack;
};

export const checkOfflinePackNeedsUpdate = async (currentTrip: Itinerary | null): Promise<boolean> => {
  if (!currentTrip) return false;
  const pack = await getOfflinePack();
  if (!pack) return false;

  if (pack.tripId !== (currentTrip as any).id) return true;
  
  return false;
};
