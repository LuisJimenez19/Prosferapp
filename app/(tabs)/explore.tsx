import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function TabTwoScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">More coming soon</ThemedText>
      <ThemedText style={styles.text}>
        This route is hidden from the tab bar for now while MVP 1 focuses on basic personal finance
        tracking.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 12,
  },
  text: {
    opacity: 0.8,
  },
});
