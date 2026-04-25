import React from 'react';
import { View, Text, Modal, ScrollView } from 'react-native';
import { colors } from '../../constants/colors';
import { Button } from '../Button';
import { Card } from '../Card';
import { Transaction } from '../../services/paymentService';

interface PaymentReceiptProps {
  transaction: Transaction | null;
  visible: boolean;
  onClose: () => void;
}

export function PaymentReceipt({ transaction, visible, onClose }: PaymentReceiptProps) {
  if (!transaction) return null;

  let message = '';
  if (transaction.type === 'online_qr_payment' || transaction.type === 'top_up' || transaction.type === 'offline_reserve') {
    message = 'Payment completed online.';
  } else if (transaction.status === 'accepted_offline') {
    message = 'Payment accepted offline. It will sync when internet is available.';
  } else if (transaction.status === 'synced' || transaction.type === 'sync') {
    message = 'Payment synced and settled in demo mode.';
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
        <Card style={{ padding: 24 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.text.primary, marginBottom: 16, textAlign: 'center' }}>
            Payment Receipt
          </Text>

          <View style={{ gap: 12, marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: 'Inter_500Medium', color: colors.text.secondary }}>Receipt Code</Text>
              <Text style={{ fontFamily: 'Inter_600SemiBold', color: colors.text.primary }}>{transaction.receiptCode}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: 'Inter_500Medium', color: colors.text.secondary }}>Amount</Text>
              <Text style={{ fontFamily: 'Inter_600SemiBold', color: colors.text.primary }}>{transaction.amount} {transaction.currency}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: 'Inter_500Medium', color: colors.text.secondary }}>Merchant</Text>
              <Text style={{ fontFamily: 'Inter_600SemiBold', color: colors.text.primary }}>{transaction.merchantName || 'N/A'}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: 'Inter_500Medium', color: colors.text.secondary }}>Method</Text>
              <Text style={{ fontFamily: 'Inter_600SemiBold', color: colors.text.primary }}>{transaction.method.replace(/_/g, ' ')}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: 'Inter_500Medium', color: colors.text.secondary }}>Status</Text>
              <Text style={{ fontFamily: 'Inter_600SemiBold', color: colors.text.primary }}>{transaction.status.replace(/_/g, ' ')}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: 'Inter_500Medium', color: colors.text.secondary }}>Created</Text>
              <Text style={{ fontFamily: 'Inter_600SemiBold', color: colors.text.primary }}>{new Date(transaction.createdAt).toLocaleString()}</Text>
            </View>
            {transaction.acceptedAt && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: 'Inter_500Medium', color: colors.text.secondary }}>Accepted</Text>
                <Text style={{ fontFamily: 'Inter_600SemiBold', color: colors.text.primary }}>{new Date(transaction.acceptedAt).toLocaleString()}</Text>
              </View>
            )}
            {transaction.syncedAt && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: 'Inter_500Medium', color: colors.text.secondary }}>Synced</Text>
                <Text style={{ fontFamily: 'Inter_600SemiBold', color: colors.text.primary }}>{new Date(transaction.syncedAt).toLocaleString()}</Text>
              </View>
            )}
          </View>

          <View style={{ backgroundColor: colors.brand.primaryLight, padding: 12, borderRadius: 8, marginBottom: 24 }}>
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.brand.primary, textAlign: 'center' }}>
              {message}
            </Text>
          </View>

          <Button variant="primary" label="Close" onPress={onClose} />
        </Card>
      </View>
    </Modal>
  );
}