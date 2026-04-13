import * as React from 'react';
import { View, type ViewProps } from 'react-native';

import { Text } from '@/src/components/ui/text';
import { cn } from '@/src/lib/utils';

export type CardProps = ViewProps & {
  className?: string;
};

export function Card({ className, ...props }: CardProps) {
  return <View className={cn('rounded-xl border border-border bg-card', className)} {...props} />;
}

export function CardHeader({ className, ...props }: CardProps) {
  return <View className={cn('gap-1.5 px-5 pt-5', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.ComponentProps<typeof Text>) {
  return <Text className={cn('text-lg font-semibold leading-7', className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.ComponentProps<typeof Text>) {
  return <Text variant="muted" className={cn(className)} {...props} />;
}

export function CardContent({ className, ...props }: CardProps) {
  return <View className={cn('px-5 py-5', className)} {...props} />;
}

export function CardFooter({ className, ...props }: CardProps) {
  return <View className={cn('flex-row items-center px-5 pb-5', className)} {...props} />;
}
