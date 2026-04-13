import * as Slot from "@rn-primitives/slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
} from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { Text, TextClassContext } from "@/src/components/ui/text";
import { getThemeColors } from "@/src/lib/theme";
import { cn } from "@/src/lib/utils";

const buttonVariants = cva(
  "flex-row items-center justify-center gap-2 rounded-lg border active:opacity-90",
  {
    variants: {
      variant: {
        default: "border-primary bg-primary",
        secondary: "border-secondary bg-accent",
        outline: "border-border bg-transparent",
        ghost: "border-transparent bg-transparent",
        destructive: "border-destructive bg-destructive",
      },
      size: {
        default: "min-h-12 px-4 py-3",
        sm: "min-h-10 px-3.5 py-2.5",
        lg: "min-h-14 px-5 py-4",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      fullWidth: false,
    },
  },
);

const buttonTextVariants = cva("text-center font-semibold", {
  variants: {
    variant: {
      default: "text-primary-foreground",
      secondary: "text-secondary-foreground",
      outline: "text-foreground",
      ghost: "text-foreground",
      destructive: "text-destructive-foreground",
    },
    size: {
      default: "text-[15px] leading-5",
      sm: "text-sm leading-5",
      lg: "text-base leading-6",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export type ButtonProps = PressableProps &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    className?: string;
    textClassName?: string;
    loading?: boolean;
    children: React.ReactNode;
  };

function wrapButtonChildren(children: React.ReactNode) {
  if (typeof children === "string" || typeof children === "number") {
    return <Text>{children}</Text>;
  }

  return children;
}

export const Button = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  ButtonProps
>(
  (
    {
      asChild = false,
      children,
      className,
      disabled,
      fullWidth,
      loading = false,
      size,
      textClassName,
      variant,
      ...props
    },
    ref,
  ) => {
    const colorScheme = useColorScheme();
    const colors = getThemeColors(colorScheme);
    const Component = asChild ? Slot.Pressable : Pressable;
    const textClassNameValue = cn(
      buttonTextVariants({ size, variant }),
      textClassName,
    );
    const spinnerColor =
      variant === "secondary"
        ? colors.secondaryForeground
        : variant === "outline" || variant === "ghost"
          ? colors.foreground
          : variant === "destructive"
            ? colors.destructiveForeground
            : colors.primaryForeground;

    return (
      <Component
        ref={ref}
        className={cn(
          buttonVariants({ size, variant, fullWidth }),
          (disabled || loading) && "opacity-60",
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <ActivityIndicator color={spinnerColor} size="small" />
        ) : null}
        <TextClassContext.Provider value={textClassNameValue}>
          {wrapButtonChildren(children)}
        </TextClassContext.Provider>
      </Component>
    );
  },
);

Button.displayName = "Button";
