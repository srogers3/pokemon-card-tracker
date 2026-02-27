import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-primary/70 to-primary/90 text-primary-foreground backdrop-blur-sm border border-white/20 border-b-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),inset_0_-1px_1px_rgba(0,0,0,0.15),0_2px_12px_hsl(var(--primary)/0.35),0_1px_2px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 hover:from-primary/80 hover:to-primary hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),inset_0_-1px_1px_rgba(0,0,0,0.15),0_4px_20px_hsl(var(--primary)/0.45),0_1px_3px_rgba(0,0,0,0.25)] active:translate-y-0 active:from-primary/95 active:to-primary/85 active:shadow-[inset_0_2px_3px_rgba(0,0,0,0.2),0_1px_4px_hsl(var(--primary)/0.3)]",
        destructive:
          "bg-gradient-to-b from-destructive/70 to-destructive/90 text-white backdrop-blur-sm border border-white/20 border-b-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),inset_0_-1px_1px_rgba(0,0,0,0.15),0_2px_12px_hsl(var(--destructive)/0.35),0_1px_2px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 hover:from-destructive/80 hover:to-destructive hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),inset_0_-1px_1px_rgba(0,0,0,0.15),0_4px_20px_hsl(var(--destructive)/0.45),0_1px_3px_rgba(0,0,0,0.25)] active:translate-y-0 active:from-destructive/95 active:to-destructive/85 active:shadow-[inset_0_2px_3px_rgba(0,0,0,0.2),0_1px_4px_hsl(var(--destructive)/0.3)] focus-visible:ring-destructive/20",
        outline:
          "border border-white/20 border-b-white/10 bg-gradient-to-b from-card/40 to-card/20 backdrop-blur-sm shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_2px_8px_rgba(124,92,191,0.1),0_1px_2px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 hover:from-accent/20 hover:to-accent/10 hover:text-accent-foreground hover:border-accent/30 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_4px_20px_rgba(124,92,191,0.2),0_2px_4px_rgba(0,0,0,0.1)] active:translate-y-0 active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1),0_1px_4px_rgba(124,92,191,0.15)]",
        secondary:
          "bg-gradient-to-b from-secondary/50 to-secondary/70 text-secondary-foreground backdrop-blur-sm border border-white/15 border-b-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),inset_0_-1px_1px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 hover:from-secondary/60 hover:to-secondary/85 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),inset_0_-1px_1px_rgba(0,0,0,0.1),0_4px_16px_rgba(124,92,191,0.12),0_2px_4px_rgba(0,0,0,0.08)] active:translate-y-0 active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]",
        ghost:
          "hover:-translate-y-0.5 hover:bg-gradient-to-b hover:from-card/35 hover:to-card/20 hover:backdrop-blur-sm hover:text-foreground hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_4px_16px_rgba(124,92,191,0.12),0_1px_3px_rgba(0,0,0,0.08)] active:translate-y-0 active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)]",
        link: "text-primary underline-offset-4 hover:underline",
        accent:
          "bg-gradient-to-b from-accent/70 to-accent/90 text-accent-foreground rounded-full backdrop-blur-sm border border-white/20 border-b-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),inset_0_-1px_1px_rgba(0,0,0,0.15),0_2px_12px_hsl(var(--accent)/0.35),0_1px_2px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 hover:from-accent/80 hover:to-accent hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),inset_0_-1px_1px_rgba(0,0,0,0.15),0_4px_20px_hsl(var(--accent)/0.45),0_1px_3px_rgba(0,0,0,0.25)] active:translate-y-0 active:from-accent/95 active:to-accent/85 active:shadow-[inset_0_2px_3px_rgba(0,0,0,0.2),0_1px_4px_hsl(var(--accent)/0.3)]",
        gold:
          "bg-gradient-to-b from-gold/70 to-gold/90 text-white rounded-full backdrop-blur-sm border border-white/25 border-b-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),inset_0_-1px_1px_rgba(0,0,0,0.15),0_2px_12px_hsl(var(--gold)/0.4),0_1px_2px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 hover:from-gold/80 hover:to-gold hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(0,0,0,0.15),0_4px_20px_hsl(var(--gold)/0.5),0_1px_3px_rgba(0,0,0,0.25)] active:translate-y-0 active:from-gold/95 active:to-gold/85 active:shadow-[inset_0_2px_3px_rgba(0,0,0,0.2),0_1px_4px_hsl(var(--gold)/0.35)]",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-lg px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
