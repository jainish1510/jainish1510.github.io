import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-[background,color,border-color,box-shadow,transform] duration-200 ease-[var(--ease-out-expo)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-fg text-bg hover:bg-fg/90 shadow-[0_1px_0_rgb(255_255_255/0.2)_inset]",
        accent: "bg-accent text-[#05282a] hover:bg-accent-strong",
        secondary: "border border-line-strong bg-surface text-fg hover:border-fg/25 hover:bg-surface-2",
        ghost: "text-fg-2 hover:bg-surface-2 hover:text-fg",
        outline: "border border-line text-fg-2 hover:border-line-strong hover:text-fg",
        danger: "bg-danger/90 text-white hover:bg-danger",
        link: "h-auto px-0 text-fg-2 hover:text-fg link-underline rounded-none",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4",
        lg: "h-11 px-5 text-[0.9375rem]",
        icon: "size-9",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export type ButtonProps = ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
