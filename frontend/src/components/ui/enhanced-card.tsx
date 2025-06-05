
import * as React from "react";
import { cn } from "@/lib/utils";

const EnhancedCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "glass" | "neumorphic" | "gradient";
    interactive?: boolean;
  }
>(({ className, variant = "default", interactive = false, ...props }, ref) => {
  const variants = {
    default: "rounded-xl border bg-card text-card-foreground shadow-sm",
    glass: "rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-lg dark:border-white/5 dark:bg-black/5",
    neumorphic: "rounded-xl bg-gradient-to-br from-white to-gray-50 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.8)] dark:from-gray-900 dark:to-gray-800 dark:shadow-[8px_8px_16px_rgba(0,0,0,0.3),-8px_-8px_16px_rgba(255,255,255,0.1)]",
    gradient: "rounded-xl bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 border border-primary/10 shadow-lg"
  };

  const interactiveStyles = interactive 
    ? "transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer" 
    : "";

  return (
    <div
      ref={ref}
      className={cn(variants[variant], interactiveStyles, className)}
      {...props}
    />
  );
});

EnhancedCard.displayName = "EnhancedCard";

const EnhancedCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-2 p-6", className)}
    {...props}
  />
));

EnhancedCardHeader.displayName = "EnhancedCardHeader";

const EnhancedCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-bold leading-none tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent",
      className
    )}
    {...props}
  />
));

EnhancedCardTitle.displayName = "EnhancedCardTitle";

const EnhancedCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground/80", className)}
    {...props}
  />
));

EnhancedCardDescription.displayName = "EnhancedCardDescription";

const EnhancedCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));

EnhancedCardContent.displayName = "EnhancedCardContent";

export { 
  EnhancedCard, 
  EnhancedCardHeader, 
  EnhancedCardTitle, 
  EnhancedCardDescription, 
  EnhancedCardContent 
};
