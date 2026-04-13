import * as React from 'react';
import { TextInput, type TextInputProps } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { getThemeColors } from '@/src/lib/theme';
import { cn } from '@/src/lib/utils';

export type InputProps = TextInputProps & {
  className?: string;
};

export const Input = React.forwardRef<React.ElementRef<typeof TextInput>, InputProps>(
  ({ className, editable = true, placeholderTextColor, selectionColor, ...props }, ref) => {
    const colorScheme = useColorScheme();
    const colors = getThemeColors(colorScheme);

    return (
      <TextInput
        ref={ref}
        className={cn(
          'min-h-12 rounded-lg border border-input bg-card px-4 py-3 text-[15px] leading-6 text-foreground',
          !editable && 'opacity-60',
          className
        )}
        editable={editable}
        placeholderTextColor={placeholderTextColor ?? colors.mutedForeground}
        selectionColor={selectionColor ?? colors.primary}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
