import * as Slot from '@rn-primitives/slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { cn } from '@/src/lib/utils';

const textVariants = cva('text-[15px] leading-6 text-foreground', {
  variants: {
    variant: {
      body: '',
      title: 'text-[32px] font-semibold leading-10 tracking-tight',
      heading: 'text-[22px] font-semibold leading-8 tracking-tight',
      subheading: 'text-[18px] font-medium leading-7',
      label: 'text-sm font-medium leading-5',
      muted: 'text-sm leading-5 text-muted-foreground',
      caption: 'text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground',
    },
    weight: {
      regular: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
  },
  defaultVariants: {
    variant: 'body',
    weight: 'regular',
  },
});

export const TextClassContext = React.createContext<string | undefined>(undefined);

export type TextProps = RNTextProps &
  VariantProps<typeof textVariants> & {
    asChild?: boolean;
    className?: string;
  };

export const Text = React.forwardRef<React.ElementRef<typeof RNText>, TextProps>(
  ({ asChild = false, className, variant, weight, ...props }, ref) => {
    const inheritedClassName = React.useContext(TextClassContext);
    const Component = asChild ? Slot.Text : RNText;

    return (
      <Component
        ref={ref}
        className={cn(textVariants({ variant, weight }), inheritedClassName, className)}
        {...props}
      />
    );
  }
);

Text.displayName = 'Text';
