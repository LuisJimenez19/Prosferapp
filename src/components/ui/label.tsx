import * as Slot from '@rn-primitives/slot';
import * as React from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { cn } from '@/src/lib/utils';

export type LabelProps = RNTextProps & {
  asChild?: boolean;
  className?: string;
};

export const Label = React.forwardRef<React.ElementRef<typeof RNText>, LabelProps>(
  ({ asChild = false, className, ...props }, ref) => {
    const Component = asChild ? Slot.Text : RNText;

    return (
      <Component
        ref={ref}
        className={cn('text-sm font-medium leading-5 text-foreground', className)}
        {...props}
      />
    );
  }
);

Label.displayName = 'Label';
