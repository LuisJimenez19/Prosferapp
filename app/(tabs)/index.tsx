import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatDateLabel } from '@/src/lib/dates';
import { getPersonalContext } from '@/src/features/personal-finance/repositories/personal-context.repository';
import { transactionRepository } from '@/src/features/personal-finance/repositories/transaction.repository';
import { walletRepository } from '@/src/features/personal-finance/repositories/wallet.repository';
import type { TransactionListItem } from '@/src/features/personal-finance/types/transaction';
import type { Wallet } from '@/src/features/personal-finance/types/wallet';

function formatCurrency(amount: number, currencyCode: string) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function HomeScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<TransactionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    let isMounted = true;

    async function loadHomeData() {
      setIsLoading(true);
      setError(null);

      try {
        const context = await getPersonalContext();
        const [walletResults, transactionResults] = await Promise.all([
          walletRepository.listWalletsByOwner(context),
          transactionRepository.listRecentTransactionsByOwner(
            context.owner_type,
            context.owner_local_id,
            10,
          ),
        ]);

        if (!isMounted) {
          return;
        }

        setWallets(walletResults);
        setTransactions(transactionResults);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        const message = loadError instanceof Error ? loadError.message : 'Unable to load local finance data.';
        setError(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadHomeData().catch((loadError) => {
      if (!isMounted) {
        return;
      }

      const message = loadError instanceof Error ? loadError.message : 'Unable to load local finance data.';
      setError(message);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [isFocused]);

  const primaryCurrency = wallets[0]?.currency_code ?? 'USD';
  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.current_balance, 0);

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.heroCard, { backgroundColor: colorScheme === 'dark' ? '#17324a' : '#e8f4fb' }]}>
          <ThemedText type="defaultSemiBold" style={[styles.eyebrow, { color: palette.tint }]}>
            Personal finance
          </ThemedText>
          <ThemedText type="title" style={styles.heroTitle}>
            {formatCurrency(totalBalance, primaryCurrency)}
          </ThemedText>
          <ThemedText style={styles.heroSubtitle}>Total balance across your wallets</ThemedText>
          <Pressable
            style={[styles.primaryButton, { backgroundColor: palette.tint }]}
            onPress={() => router.push('/modal')}>
            <ThemedText style={styles.primaryButtonText}>Add transaction</ThemedText>
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="small" color={palette.tint} />
            <ThemedText style={styles.loadingText}>Loading your local data...</ThemedText>
          </View>
        ) : null}

        {error ? (
          <View style={[styles.messageCard, { borderColor: '#d46b5d', backgroundColor: '#fff4f2' }]}>
            <ThemedText type="defaultSemiBold" style={styles.messageTitle}>
              Something went wrong
            </ThemedText>
            <ThemedText>{error}</ThemedText>
          </View>
        ) : null}

        {!isLoading && !error ? (
          <>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle">Wallets</ThemedText>
            </View>
            <View style={styles.sectionList}>
              {wallets.map((wallet) => (
                <View
                  key={wallet.local_id}
                  style={[
                    styles.card,
                    {
                      backgroundColor: colorScheme === 'dark' ? '#1d2935' : '#ffffff',
                      borderColor: colorScheme === 'dark' ? '#30404f' : '#dbe7f0',
                    },
                  ]}>
                  <View style={styles.rowBetween}>
                    <View>
                      <ThemedText type="defaultSemiBold">{wallet.name}</ThemedText>
                      <ThemedText style={styles.cardMeta}>
                        {wallet.wallet_type} {wallet.is_default ? '• default' : ''}
                      </ThemedText>
                    </View>
                    <ThemedText type="defaultSemiBold">
                      {formatCurrency(wallet.current_balance, wallet.currency_code)}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle">Latest transactions</ThemedText>
            </View>
            <View style={styles.sectionList}>
              {transactions.length === 0 ? (
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: colorScheme === 'dark' ? '#1d2935' : '#ffffff',
                      borderColor: colorScheme === 'dark' ? '#30404f' : '#dbe7f0',
                    },
                  ]}>
                  <ThemedText>No transactions yet. Add your first one to start tracking.</ThemedText>
                </View>
              ) : (
                transactions.map((transaction) => {
                  const signedAmount =
                    transaction.transaction_type === 'income' ? transaction.amount : -transaction.amount;

                  return (
                    <View
                      key={transaction.local_id}
                      style={[
                        styles.card,
                        {
                          backgroundColor: colorScheme === 'dark' ? '#1d2935' : '#ffffff',
                          borderColor: colorScheme === 'dark' ? '#30404f' : '#dbe7f0',
                        },
                      ]}>
                      <View style={styles.rowBetween}>
                        <View style={styles.transactionInfo}>
                          <ThemedText type="defaultSemiBold">
                            {transaction.note || transaction.category_name || 'Transaction'}
                          </ThemedText>
                          <ThemedText style={styles.cardMeta}>
                            {transaction.wallet_name} • {transaction.category_name || 'Uncategorized'} •{' '}
                            {formatDateLabel(transaction.occurred_at)}
                          </ThemedText>
                        </View>
                        <ThemedText
                          type="defaultSemiBold"
                          style={{
                            color: transaction.transaction_type === 'income' ? '#1d7a46' : '#c2410c',
                          }}>
                          {formatCurrency(signedAmount, transaction.currency_code)}
                        </ThemedText>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 36,
    gap: 18,
  },
  heroCard: {
    borderRadius: 24,
    padding: 20,
    gap: 10,
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 12,
  },
  heroTitle: {
    lineHeight: 38,
  },
  heroSubtitle: {
    opacity: 0.8,
  },
  primaryButton: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  loadingState: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  loadingText: {
    opacity: 0.8,
  },
  sectionHeader: {
    marginTop: 4,
  },
  sectionList: {
    gap: 12,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  cardMeta: {
    opacity: 0.7,
    fontSize: 14,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  transactionInfo: {
    flex: 1,
    gap: 4,
  },
  messageCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  messageTitle: {
    color: '#8a1c12',
  },
});
