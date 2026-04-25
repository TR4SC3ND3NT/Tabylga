import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { colors } from '../../constants/colors';
import { Card } from '../Card';
import { Transaction } from '../../services/paymentService';
import { PaymentReceipt } from './PaymentReceipt';

interface TransactionHistoryProps {
  transactions: Transaction[];
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed_online': return colors.status.success;
    case 'synced': return colors.status.success;
    case 'accepted_offline': return colors.brand.cta;
    case 'waiting_merchant_acceptance': return colors.status.warning;
    case 'failed_demo': return colors.status.error;
    case 'expired': return colors.text.tertiary;
    default: return colors.text.secondary;
  }
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  if (transactions.length === 0) {
    return (
      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.text.tertiary, textAlign: 'center', marginTop: 20 }}>
        No transactions yet.
      </Text>
    );
  }

  return (
    <>
      <Card>
        {transactions.map((tx, i) => {
          const isLast = i === transactions.length - 1;
          const isCredit = tx.type === 'top_up';
          return (
            <Pressable
              key={tx.id}
              onPress={() => setSelectedTx(tx)}
              style={({ pressed }) => ([
                {
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  paddingHorizontal: 16, paddingVertical: 14,
                  borderBottomWidth: isLast ? 0 : 1,
                  borderBottomColor: colors.border.divider,
                  minHeight: 64,
                  opacity: pressed ? 0.7 : 1,
                }
              ])}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 15, color: colors.text.primary }}>
                  {tx.merchantName || (tx.type === 'top_up' ? 'Top Up' : tx.type.replace(/_/g, ' '))}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 6 }}>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.text.tertiary }}>
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </Text>
                  <View style={{ backgroundColor: getStatusColor(tx.status) + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 10, color: getStatusColor(tx.status) }}>
                      {tx.status.replace(/_/g, ' ')}
                    </Text>
                  </View>
                </View>
              </View>
              <Text style={{
                fontFamily: 'Inter_600SemiBold', fontSize: 15,
                color: isCredit ? colors.status.success : colors.text.primary,
              }}>
                {isCredit ? '+' : '-'}{tx.amount} {tx.currency}
              </Text>
            </Pressable>
          );
        })}
      </Card>
      
      <PaymentReceipt
        transaction={selectedTx}
        visible={!!selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </>
  );
}