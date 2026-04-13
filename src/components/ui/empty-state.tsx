import * as React from 'react';
import { View } from 'react-native';

import { Card, CardContent } from '@/src/components/ui/card';
import { Text } from '@/src/components/ui/text';
import { cn } from '@/src/lib/utils';

export type EmptyStateProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
};

export function EmptyState({
  action,
  className,
  compact = false,
  description,
  title,
}: EmptyStateProps) {
  return (
    <Card className={cn(className)}>
      <CardContent className={cn('items-center gap-3', compact ? 'py-6' : 'py-8')}>
        <View className="h-12 w-12 items-center justify-center rounded-full bg-secondary">
          <View className="h-2.5 w-2.5 rounded-full bg-primary" />
        </View>
        <View className="items-center gap-1">
          <Text variant="subheading" className="text-center">
            {title}
          </Text>
          <Text variant="muted" className="text-center">
            {description}
          </Text>
        </View>
        {action}
      </CardContent>
    </Card>
  );
}
