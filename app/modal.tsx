import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { dateInputToIsoString, toDateInputValue } from '@/src/lib/dates';
import { categoryRepository } from '@/src/features/personal-finance/repositories/category.repository';
import { getPersonalContext } from '@/src/features/personal-finance/repositories/personal-context.repository';
import { transactionRepository } from '@/src/features/personal-finance/repositories/transaction.repository';
import { walletRepository } from '@/src/features/personal-finance/repositories/wallet.repository';
import type { Category } from '@/src/features/personal-finance/types/category';
import type { TransactionKind } from '@/src/features/personal-finance/types/transaction';
import type { Wallet } from '@/src/features/personal-finance/types/wallet';

type PersonalOwnerContext = Awaited<ReturnType<typeof getPersonalContext>>;

export default function CreateTransactionModal() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const [context, setContext] = useState<PersonalOwnerContext | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactionType, setTransactionType] = useState<TransactionKind>('expense');
  const [selectedWalletLocalId, setSelectedWalletLocalId] = useState<string | null>(null);
  const [selectedCategoryLocalId, setSelectedCategoryLocalId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [dateValue, setDateValue] = useState(toDateInputValue());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadFormData() {
      setIsLoading(true);
      setError(null);

      try {
        const personalContext = await getPersonalContext();
        const [walletResults, categoryResults] = await Promise.all([
          walletRepository.listWalletsByOwner(personalContext),
          categoryRepository.listCategoriesByOwner(personalContext.owner_type, personalContext.owner_local_id),
        ]);

        if (!isMounted) {
          return;
        }

        setContext(personalContext);
        setWallets(walletResults);
        setCategories(categoryResults);
        setSelectedWalletLocalId((currentValue) => currentValue ?? walletResults[0]?.local_id ?? null);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        const message = loadError instanceof Error ? loadError.message : 'Unable to load transaction form data.';
        setError(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadFormData().catch((loadError) => {
      if (!isMounted) {
        return;
      }

      const message = loadError instanceof Error ? loadError.message : 'Unable to load transaction form data.';
      setError(message);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const matchingCategories = categories.filter((category) => category.category_kind === transactionType);

    setSelectedCategoryLocalId((currentValue) => {
      if (currentValue && matchingCategories.some((category) => category.local_id === currentValue)) {
        return currentValue;
      }

      return matchingCategories[0]?.local_id ?? null;
    });
  }, [categories, transactionType]);

  const filteredCategories = categories.filter((category) => category.category_kind === transactionType);

  async function handleSave() {
    if (!context) {
      setError('Personal context is not available.');
      return;
    }

    if (!selectedWalletLocalId) {
      setError('Please select a wallet.');
      return;
    }

    if (!selectedCategoryLocalId) {
      setError('Please select a category.');
      return;
    }

    const parsedAmount = Number(amount.replace(',', '.'));

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await transactionRepository.createTransaction({
        owner_type: context.owner_type,
        owner_local_id: context.owner_local_id,
        wallet_local_id: selectedWalletLocalId,
        category_local_id: selectedCategoryLocalId,
        transaction_type: transactionType,
        amount: parsedAmount,
        occurred_at: dateInputToIsoString(dateValue),
        note: description,
      });

      router.back();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Unable to save transaction locally.';
      setError(message);
      Alert.alert('Could not save transaction', message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Add transaction
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Save an income or expense locally and update the selected wallet balance.
          </ThemedText>
        </View>

        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="small" color={palette.tint} />
            <ThemedText>Loading form...</ThemedText>
          </View>
        ) : null}

        {error ? (
          <View style={[styles.messageCard, { borderColor: '#d46b5d', backgroundColor: '#fff4f2' }]}>
            <ThemedText type="defaultSemiBold" style={styles.messageTitle}>
              Check the form
            </ThemedText>
            <ThemedText>{error}</ThemedText>
          </View>
        ) : null}

        {!isLoading ? (
          <>
            <View style={styles.section}>
              <ThemedText type="defaultSemiBold">Transaction kind</ThemedText>
              <View style={styles.chipRow}>
                {(['expense', 'income'] as const).map((kind) => {
                  const isSelected = transactionType === kind;

                  return (
                    <Pressable
                      key={kind}
                      style={[
                        styles.chip,
                        isSelected && { backgroundColor: palette.tint, borderColor: palette.tint },
                      ]}
                      onPress={() => setTransactionType(kind)}>
                      <ThemedText style={isSelected ? styles.selectedChipText : undefined}>{kind}</ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <ThemedText type="defaultSemiBold">Wallet</ThemedText>
              <View style={styles.chipRow}>
                {wallets.map((wallet) => {
                  const isSelected = selectedWalletLocalId === wallet.local_id;

                  return (
                    <Pressable
                      key={wallet.local_id}
                      style={[
                        styles.chip,
                        isSelected && { backgroundColor: palette.tint, borderColor: palette.tint },
                      ]}
                      onPress={() => setSelectedWalletLocalId(wallet.local_id)}>
                      <ThemedText style={isSelected ? styles.selectedChipText : undefined}>
                        {wallet.name}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <ThemedText type="defaultSemiBold">Category</ThemedText>
              <View style={styles.chipRow}>
                {filteredCategories.map((category) => {
                  const isSelected = selectedCategoryLocalId === category.local_id;

                  return (
                    <Pressable
                      key={category.local_id}
                      style={[
                        styles.chip,
                        isSelected && { backgroundColor: palette.tint, borderColor: palette.tint },
                      ]}
                      onPress={() => setSelectedCategoryLocalId(category.local_id)}>
                      <ThemedText style={isSelected ? styles.selectedChipText : undefined}>
                        {category.name}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <ThemedText type="defaultSemiBold">Amount</ThemedText>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
                style={[
                  styles.input,
                  {
                    color: palette.text,
                    borderColor: colorScheme === 'dark' ? '#30404f' : '#dbe7f0',
                    backgroundColor: colorScheme === 'dark' ? '#1d2935' : '#ffffff',
                  },
                ]}
                placeholderTextColor={colorScheme === 'dark' ? '#8da0b3' : '#7a8794'}
              />
            </View>

            <View style={styles.section}>
              <ThemedText type="defaultSemiBold">Description</ThemedText>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Optional note"
                style={[
                  styles.input,
                  {
                    color: palette.text,
                    borderColor: colorScheme === 'dark' ? '#30404f' : '#dbe7f0',
                    backgroundColor: colorScheme === 'dark' ? '#1d2935' : '#ffffff',
                  },
                ]}
                placeholderTextColor={colorScheme === 'dark' ? '#8da0b3' : '#7a8794'}
              />
            </View>

            <View style={styles.section}>
              <ThemedText type="defaultSemiBold">Date</ThemedText>
              <TextInput
                value={dateValue}
                onChangeText={setDateValue}
                placeholder="YYYY-MM-DD"
                autoCapitalize="none"
                style={[
                  styles.input,
                  {
                    color: palette.text,
                    borderColor: colorScheme === 'dark' ? '#30404f' : '#dbe7f0',
                    backgroundColor: colorScheme === 'dark' ? '#1d2935' : '#ffffff',
                  },
                ]}
                placeholderTextColor={colorScheme === 'dark' ? '#8da0b3' : '#7a8794'}
              />
            </View>

            <Pressable
              style={[styles.saveButton, { backgroundColor: palette.tint }, isSaving && styles.disabledButton]}
              onPress={() => {
                handleSave().catch(() => {
                  // Errors are handled inside handleSave.
                });
              }}
              disabled={isSaving}>
              <ThemedText style={styles.saveButtonText}>
                {isSaving ? 'Saving...' : 'Save transaction'}
              </ThemedText>
            </Pressable>
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
  header: {
    gap: 8,
  },
  title: {
    lineHeight: 38,
  },
  subtitle: {
    opacity: 0.8,
  },
  section: {
    gap: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#c8d6e5',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  selectedChipText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  saveButton: {
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.7,
  },
  loadingState: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 20,
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
