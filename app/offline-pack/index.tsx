import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { WifiOff, CheckCircle2, Clock, AlertTriangle, ArrowRight, Bed, Car, Utensils, Sparkles, MapPin, Phone, Info, Zap, CreditCard } from 'lucide-react-native';
import { useTripStore } from '../../stores/tripStore';
import { getOfflinePack, type OfflinePack, getOfflineMode, setOfflineMode, type OfflinePackDay, type OfflinePackItem, type EmergencyContact, type PhrasebookItem, type OfflinePaymentSnapshot, saveOfflinePackFromCurrentTrip } from '../../lib/offline/offlinePackService';
import { colors } from '../../constants/colors';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Pill } from '../../components/Pill';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useWalletStore } from '../../stores/walletStore';

export default function OfflinePackScreen() {
  const [pack, setPack] = useState<OfflinePack | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [activeSection, setActiveSection] = useState<'overview' | 'itinerary' | 'emergency' | 'phrasebook' | 'offline-pay'>('overview');
  const [phraseCategory, setPhraseCategory] = useState<PhrasebookItem['category'] | 'all'>('all');
  const currentTrip = useTripStore((s) => s.generatedItinerary);
  const wallet = useWalletStore();

  const loadData = useCallback(async () => {
    setLoading(true);
    const [data, offline] = await Promise.all([
      getOfflinePack(),
      getOfflineMode()
    ]);
    setPack(data);
    setIsOfflineMode(offline);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const toggleOfflineMode = async (value: boolean) => {
    setIsOfflineMode(value);
    await setOfflineMode(value);
  };

  const handleUpdate = async () => {
    if (!currentTrip) return;
    setUpdating(true);
    const newPack = await saveOfflinePackFromCurrentTrip(currentTrip, wallet);
    setPack(newPack);
    setUpdating(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScreenHeader title="Offline Pack" subtitle="Saved trip essentials" backTo="/(tabs)" />
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!pack) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScreenHeader title="Offline Pack" subtitle="Saved trip essentials" backTo="/(tabs)" />
        <ScrollView contentContainerStyle={styles.emptyContainer}>
          <View style={styles.iconCircle}>
            <WifiOff size={32} color={colors.brand.primary} />
          </View>
          <Text style={styles.emptyTitle}>No offline pack saved yet.</Text>
          <Text style={styles.emptyText}>
            Save your itinerary before going to remote places. Your stays, transport, emergency contacts and phrasebook will be available without internet.
          </Text>
          <Button
            label={currentTrip ? 'Save current trip' : 'Go to trip'}
            onPress={() => router.push(currentTrip ? '/trip/itinerary' : '/')}
            style={styles.emptyButton}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const checklist = [
    'Itinerary saved',
    'Stay details saved',
    'Transport contacts saved',
    'Food and activities saved',
    'Emergency contacts saved',
    'Phrasebook saved',
    'Offline Pay status saved',
  ];

  const getTitle = () => {
    switch(activeSection) {
      case 'itinerary': return 'Itinerary';
      case 'emergency': return 'Emergency';
      case 'phrasebook': return 'Phrasebook';
      case 'offline-pay': return 'Offline Pay';
      default: return 'Offline Pack';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScreenHeader
        title={getTitle()}
        subtitle={activeSection === 'overview' ? 'Saved trip essentials' : 'Offline-ready details'}
        onBack={activeSection !== 'overview' ? () => setActiveSection('overview') : undefined}
        backTo="/(tabs)"
      />

      {isOfflineMode && (
        <View style={styles.offlineBanner}>
          <WifiOff size={16} color={colors.status.warningText} />
          <Text style={styles.offlineBannerText}>You are offline. Showing saved trip data.</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeSection === 'overview' && (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>{pack.title}</Text>
              <Text style={styles.subtitle}>Your saved trip essentials for remote areas.</Text>
            </View>

            <Card style={styles.statusCard}>
              <View style={styles.statusHeader}>
                <View style={styles.statusRow}>
                  {pack.status === 'saved_offline' ? (
                    <CheckCircle2 size={20} color={colors.status.successText} />
                  ) : pack.status === 'needs_update' ? (
                    <AlertTriangle size={20} color={colors.status.warningText} />
                  ) : (
                    <Clock size={20} color={colors.status.error} />
                  )}
                  <Text style={styles.statusText}>
                    {pack.status === 'saved_offline' ? 'Saved offline' : pack.status === 'needs_update' ? 'Needs update' : 'Pending sync'}
                  </Text>
                </View>
                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>Saved: </Text>
                  <Text style={styles.dateValue}>{new Date(pack.savedAt).toLocaleDateString()}</Text>
                </View>
              </View>

              {(pack.status === 'needs_update' || (currentTrip && pack.tripId !== currentTrip.id)) && (
                <View style={styles.updateNotice}>
                  <Text style={styles.updateNoticeText}>
                    Your current trip has changed since you last saved the offline pack.
                  </Text>
                  <Button 
                    label={updating ? 'Updating...' : 'Update offline pack'} 
                    onPress={handleUpdate} 
                    disabled={updating || isOfflineMode}
                    height={40}
                    fontSize={13}
                    style={{ marginTop: 12 }}
                  />
                </View>
              )}

              <View style={styles.divider} />

              <Text style={styles.checklistTitle}>Quick checklist</Text>
              {checklist.map((item, index) => (
                <View key={index} style={styles.checkItem}>
                  <CheckCircle2 size={16} color={colors.status.successText} />
                  <Text style={styles.checkText}>{item}</Text>
                </View>
              ))}
            </Card>

            <Card style={styles.simulationCard}>
              <View style={styles.simulationHeader}>
                <View>
                  <Text style={styles.simulationTitle}>Simulate offline mode</Text>
                  <Text style={styles.simulationSubtitle}>
                    {isOfflineMode ? 'Online actions are disabled' : 'Offline pack can be updated'}
                  </Text>
                </View>
                <Switch
                  value={isOfflineMode}
                  onValueChange={toggleOfflineMode}
                  trackColor={{ false: colors.border.divider, true: colors.status.success }}
                  thumbColor="#fff"
                />
              </View>
            </Card>

            <View style={styles.sectionPlaceholders}>
              <SectionButton 
                title="1. Itinerary" 
                onPress={() => setActiveSection('itinerary')} 
              />
              <SectionButton 
                title="2. Contacts" 
                disabled 
              />
              <SectionButton 
                title="3. Emergency" 
                onPress={() => setActiveSection('emergency')} 
              />
              <SectionButton 
                title="4. Phrasebook" 
                onPress={() => setActiveSection('phrasebook')} 
              />
              <SectionButton 
                title="5. Offline Pay" 
                onPress={() => setActiveSection('offline-pay')} 
              />
              <SectionButton title="6. Sync status" disabled />
            </View>
          </>
        )}

        {activeSection === 'itinerary' && (
          <View style={styles.itineraryContainer}>
            {pack.days.map((day) => (
              <DaySection key={day.dayNumber} day={day} />
            ))}
          </View>
        )}

        {activeSection === 'emergency' && (
          <View style={styles.emergencyContainer}>
            <Text style={styles.sectionHeading}>Emergency Numbers</Text>
            <Text style={styles.sectionSubtitle}>Tap a number to call. Works without internet.</Text>
            {pack.emergencyContacts.map((contact) => (
              <EmergencyCard key={contact.id} contact={contact} />
            ))}
          </View>
        )}

        {activeSection === 'phrasebook' && (
          <View style={styles.phrasebookContainer}>
            <Text style={styles.sectionHeading}>Phrasebook</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
              {['all', 'basic', 'transport', 'hotel', 'food', 'emergency', 'payment'].map((cat) => (
                <Pressable 
                  key={cat} 
                  onPress={() => setPhraseCategory(cat as any)}
                  style={[
                    styles.categoryTab,
                    phraseCategory === cat && styles.categoryTabActive
                  ]}
                >
                  <Text style={[
                    styles.categoryTabText,
                    phraseCategory === cat && styles.categoryTabTextActive
                  ]}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.phrasesList}>
              {pack.phrasebook
                .filter(p => phraseCategory === 'all' || p.category === phraseCategory)
                .map((phrase) => (
                  <PhraseCard key={phrase.id} phrase={phrase} />
                ))}
            </View>
          </View>
        )}

        {activeSection === 'offline-pay' && (
          <OfflinePayView snapshot={pack.offlinePaymentSnapshot} lastSavedAt={pack.savedAt} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionButton({ title, onPress, disabled }: { title: string; onPress?: () => void; disabled?: boolean }) {
  const [number, ...labelParts] = title.split('. ');
  const label = labelParts.length > 0 ? labelParts.join('. ') : title;

  return (
    <Pressable 
      onPress={onPress} 
      disabled={disabled}
      style={({ pressed }) => [
        styles.sectionRow,
        pressed && !disabled && { opacity: 0.78, backgroundColor: colors.brand.primaryLight },
        disabled && { opacity: 0.5 }
      ]}
    >
      <View style={[styles.sectionBadge, disabled && styles.sectionBadgeDisabled]}>
        <Text style={[styles.sectionBadgeText, disabled && styles.sectionBadgeTextDisabled]}>
          {labelParts.length > 0 ? number : '*'}
        </Text>
      </View>
      <Text style={styles.sectionTitle}>{label}</Text>
      {!disabled && (
        <View style={styles.sectionArrow}>
          <ArrowRight size={16} color={colors.brand.primary} strokeWidth={2} />
        </View>
      )}
    </Pressable>
  );
}

function DaySection({ day }: { day: OfflinePackDay }) {
  return (
    <View style={styles.dayBlock}>
      <View style={styles.dayHeader}>
        <View style={styles.dayNumberBadge}>
          <Text style={styles.dayNumberText}>{day.dayNumber}</Text>
        </View>
        <View>
          <Text style={styles.dayTitle}>{day.title}</Text>
          <View style={styles.regionRow}>
            <MapPin size={12} color={colors.text.tertiary} />
            <Text style={styles.dayRegion}>{day.region || day.city || 'Kyrgyzstan'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.dayItems}>
        <ItemCard item={day.stay} type="stay" icon={<Bed size={18} color={colors.brand.primary} />} />
        <ItemCard item={day.transport} type="transport" icon={<Car size={18} color={colors.brand.primary} />} />
        <ItemCard item={day.food} type="food" icon={<Utensils size={18} color={colors.brand.primary} />} />

        {day.activities.map((act, idx) => (
          <ItemCard key={idx} item={act} type="activity" icon={<Sparkles size={18} color={colors.brand.primary} />} />
        ))}

        {day.notes.length > 0 && (
          <View style={styles.notesContainer}>
            <Info size={14} color={colors.text.tertiary} />
            <Text style={styles.notesText}>{day.notes.join('\n')}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function ItemCard({ item, type, icon }: { item?: OfflinePackItem | null; type: OfflinePackItem['type']; icon: React.ReactNode }) {
  if (!item || item.type === 'note') {
    return (
      <View style={styles.itemCardEmpty}>
        <View style={styles.itemHeader}>
          {icon}
          <Text style={styles.itemTypeLabel}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
        </View>
        <Text style={styles.emptyItemText}>Not added yet</Text>
      </View>
    );
  }

  return (
    <Card style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemTitleRow}>
          {icon}
          <Text style={styles.itemTitle}>{item.name}</Text>
        </View>
        <Pill 
          label={item.offlineAvailable ? 'Offline ✓' : 'Online only'} 
          variant={item.offlineAvailable ? 'online' : 'custom'} 
          fontSize={10}
          height={20}
        />
      </View>

      <View style={styles.itemBody}>
        {item.address && (
          <View style={styles.detailRow}>
            <MapPin size={14} color={colors.text.tertiary} />
            <Text style={styles.detailText}>{item.address}</Text>
          </View>
        )}
        {item.contact && (
          <View style={styles.detailRow}>
            <Phone size={14} color={colors.text.tertiary} />
            <Text style={styles.detailText}>{item.contact}</Text>
          </View>
        )}
        {item.price !== undefined && (
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Price: </Text>
            <Text style={styles.priceValue}>
              {item.currency === 'USD' ? '$' : ''}{item.price}{item.currency === 'KGS' ? ' KGS' : ''}
            </Text>
          </View>
        )}
        {item.paymentLabels && item.paymentLabels.length > 0 && (
          <View style={styles.tagsRow}>
            {item.paymentLabels.map((tag, idx) => (
              <View key={idx} style={styles.smallTag}>
                <Text style={styles.smallTagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Card>
  );
}

function EmergencyCard({ contact }: { contact: EmergencyContact }) {
  const handleCall = () => {
    Linking.openURL(`tel:${contact.phone}`);
  };

  return (
    <Card style={styles.emergencyCard}>
      <View style={styles.emergencyInfo}>
        <Text style={styles.emergencyTitle}>{contact.title}</Text>
        <Text style={styles.emergencyDesc}>{contact.description}</Text>
      </View>
      <Pressable onPress={handleCall} style={styles.callButton}>
        <Phone size={18} color="#fff" />
        <Text style={styles.callButtonText}>{contact.phone}</Text>
      </Pressable>
    </Card>
  );
}

function PhraseCard({ phrase }: { phrase: PhrasebookItem }) {
  return (
    <Card style={styles.phraseCard}>
      <View style={styles.phraseHeader}>
        <Text style={styles.phraseEnglish}>{phrase.english}</Text>
        <Pill label={phrase.category} fontSize={9} height={18} backgroundColor={colors.surface.primary} textColor={colors.text.tertiary} />
      </View>
      <View style={styles.phraseTranslations}>
        <View style={styles.translationRow}>
          <Text style={styles.langLabel}>RU</Text>
          <Text style={styles.translationText}>{phrase.russian}</Text>
        </View>
        {phrase.kyrgyz && (
          <View style={styles.translationRow}>
            <Text style={styles.langLabel}>KG</Text>
            <Text style={styles.translationText}>{phrase.kyrgyz}</Text>
          </View>
        )}
      </View>
    </Card>
  );
}

function OfflinePayView({ snapshot, lastSavedAt }: { snapshot: OfflinePaymentSnapshot | null; lastSavedAt: string }) {
  if (!snapshot) return null;

  const getStatusColor = () => {
    switch(snapshot.status) {
      case 'ready': return colors.status.successText;
      case 'pending_sync': return colors.status.warningText;
      default: return colors.text.tertiary;
    }
  };

  return (
    <View style={styles.offlinePayContainer}>
      <Text style={styles.sectionHeading}>Offline Pay Status</Text>
      <Text style={styles.sectionSubtitle}>Last saved: {new Date(lastSavedAt).toLocaleString()}</Text>

      <Card style={styles.payStatusCard}>
        <View style={styles.payStatusHeader}>
          <View style={styles.payStatusInfo}>
            <Zap size={24} color={getStatusColor()} />
            <View>
              <Text style={[styles.payStatusText, { color: getStatusColor() }]}>
                {snapshot.status === 'ready' ? 'Ready' : snapshot.status === 'pending_sync' ? 'Pending sync' : 'Not ready'}
              </Text>
              <Text style={styles.payStatusMessage}>{snapshot.message}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.payMetrics}>
          <PayMetric label="Total Balance" value={snapshot.totalBalance} currency={snapshot.currency} />
          <PayMetric label="Offline Reserve" value={snapshot.offlineReserve} currency={snapshot.currency} highlight />
        </View>

        <View style={styles.payDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Locked offline:</Text>
            <Text style={styles.detailValue}>{snapshot.lockedOffline ?? 0} {snapshot.currency}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pending sync:</Text>
            <Text style={[styles.detailValue, (snapshot.pendingSync ?? 0) > 0 && { color: colors.status.warningText }]}>
              {snapshot.pendingSync ?? 0} {snapshot.currency}
            </Text>
          </View>
        </View>
      </Card>

      <View style={styles.payActions}>
        {snapshot.status === 'not_ready' && (
          <Button 
            label="Activate Offline Pay" 
            icon={<Zap size={18} color="#fff" />}
            onPress={() => router.push('/wallet/activate-offline' as any)} 
          />
        )}
        {snapshot.status === 'ready' && (
          <Button 
            label="Pay Offline" 
            icon={<CreditCard size={18} color="#fff" />}
            onPress={() => router.push('/wallet/pay-offline' as any)} 
          />
        )}
        {snapshot.status === 'pending_sync' && (
          <View style={styles.pendingSyncNotice}>
            <AlertTriangle size={16} color={colors.status.warningText} />
            <Text style={styles.pendingSyncText}>You have payments waiting for sync.</Text>
            <Button 
              label="Open Wallet" 
              variant="secondary"
              onPress={() => router.push('/(tabs)/wallet' as any)} 
              style={{ marginTop: 12 }}
            />
          </View>
        )}
      </View>
    </View>
  );
}

function PayMetric({ label, value, currency, highlight }: { label: string; value?: number; currency: string; highlight?: boolean }) {
  return (
    <View style={styles.payMetric}>
      <Text style={styles.payMetricLabel}>{label}</Text>
      <Text style={[styles.payMetricValue, highlight && { color: colors.status.successText }]}>
        {value ?? 0} <Text style={styles.payMetricCurrency}>{currency}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface.primary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.text.secondary,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.brand.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 24,
    color: colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.text.secondary,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 32,
  },
  emptyButton: {
    width: '100%',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.status.warningLight,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.status.warning,
  },
  offlineBannerText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.status.warningText,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 28,
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  statusCard: {
    padding: 16,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.text.primary,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.text.tertiary,
  },
  dateValue: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.text.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.divider,
    marginBottom: 16,
  },
  updateNotice: {
    backgroundColor: colors.brand.primaryLight,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  updateNoticeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.brand.primary,
    lineHeight: 18,
  },
  checklistTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.text.primary,
    marginBottom: 12,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  checkText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.text.secondary,
  },
  simulationCard: {
    padding: 16,
    marginBottom: 24,
  },
  simulationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  simulationTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.text.primary,
    marginBottom: 4,
  },
  simulationSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.text.secondary,
  },
  sectionPlaceholders: {
    gap: 12,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 58,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 14,
    backgroundColor: colors.surface.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border.divider,
  },
  sectionBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionBadgeDisabled: {
    backgroundColor: colors.surface.canvas,
  },
  sectionBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: '#fff',
  },
  sectionBadgeTextDisabled: {
    color: colors.text.tertiary,
  },
  sectionTitle: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: colors.text.primary,
  },
  sectionArrow: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: colors.brand.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itineraryContainer: {
    gap: 24,
  },
  dayBlock: {
    gap: 12,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayNumberText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#fff',
  },
  dayTitle: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 18,
    color: colors.text.primary,
  },
  regionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dayRegion: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.text.tertiary,
  },
  dayItems: {
    gap: 8,
    paddingLeft: 44,
  },
  itemCard: {
    padding: 12,
  },
  itemCardEmpty: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.divider,
    borderStyle: 'dashed',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  itemTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.text.primary,
  },
  itemTypeLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.text.secondary,
    marginLeft: 8,
  },
  emptyItemText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  itemBody: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.text.secondary,
  },
  priceRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  priceLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.text.tertiary,
  },
  priceValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: colors.brand.primary,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  smallTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: colors.brand.primaryLight,
  },
  smallTagText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: colors.brand.primary,
  },
  notesContainer: {
    flexDirection: 'row',
    gap: 6,
    padding: 8,
    backgroundColor: colors.surface.canvas,
    borderRadius: 8,
    marginTop: 4,
  },
  notesText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.text.secondary,
    flex: 1,
  },
  emergencyContainer: {
    gap: 16,
  },
  sectionHeading: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 22,
    color: colors.text.primary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  emergencyInfo: {
    flex: 1,
    marginRight: 12,
  },
  emergencyTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: 4,
  },
  emergencyDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.text.secondary,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.status.error,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  callButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#fff',
  },
  phrasebookContainer: {
    gap: 16,
  },
  categoriesRow: {
    paddingBottom: 8,
    gap: 8,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface.card,
    borderWidth: 1,
    borderColor: colors.border.divider,
  },
  categoryTabActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  categoryTabText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.text.secondary,
  },
  categoryTabTextActive: {
    color: '#fff',
  },
  phrasesList: {
    gap: 12,
  },
  phraseCard: {
    padding: 16,
  },
  phraseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  phraseEnglish: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: colors.text.primary,
    flex: 1,
    marginRight: 8,
  },
  phraseTranslations: {
    gap: 8,
    backgroundColor: colors.surface.primary,
    padding: 12,
    borderRadius: 12,
  },
  translationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  langLabel: {
    width: 24,
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: colors.text.tertiary,
  },
  translationText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.brand.primary,
    flex: 1,
  },
  offlinePayContainer: {
    gap: 16,
  },
  payStatusCard: {
    padding: 20,
  },
  payStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  payStatusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  payStatusText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
  },
  payStatusMessage: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  payMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  payMetric: {
    flex: 1,
  },
  payMetricLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.text.tertiary,
    marginBottom: 4,
  },
  payMetricValue: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 20,
    color: colors.text.primary,
  },
  payMetricCurrency: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.text.tertiary,
  },
  payDetails: {
    backgroundColor: colors.surface.primary,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  payActions: {
    marginTop: 8,
  },
  pendingSyncNotice: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.status.warningLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.status.warning,
  },
  pendingSyncText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.status.warningText,
    marginTop: 8,
    textAlign: 'center',
  },
  detailLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.text.secondary,
  },
  detailValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.text.primary,
  },
});
