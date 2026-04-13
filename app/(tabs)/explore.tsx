import { EmptyState, Screen } from '@/src/components/ui';

export default function TabTwoScreen() {
  return (
    <Screen contentClassName="flex-1 justify-center">
      <EmptyState
        title="More coming soon"
        description="This route stays hidden for now while the first MVP focuses on personal finance tracking."
      />
    </Screen>
  );
}
