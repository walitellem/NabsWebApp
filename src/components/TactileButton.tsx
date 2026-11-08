"use client";

import { type ComponentPropsWithoutRef, type ReactNode } from "react";
import { cn } from "../helpers/classname-helper";

export type TactileButtonDepth = "shallow" | "medium" | "deep";
export type TactileButtonSize = "sm" | "md" | "lg";

export type TactileButtonProps = ComponentPropsWithoutRef<"button"> & {
  children: ReactNode;
  depth?: TactileButtonDepth;
  size?: TactileButtonSize;
  href?: string; // If href is provided, render as anchor
};

export function TactileButton({
  children,
  className,
  depth = "medium",
  size = "md",
  href,
  ...props
}: TactileButtonProps) {
  const depthClasses = {
    shallow: "shadow-[0_2px_0_theme(colors.slate.200)] active:shadow-none active:translate-y-[2px] dark:shadow-[0_2px_0_theme(colors.zinc.800)]",
    medium: "shadow-[0_4px_0_theme(colors.slate.200)] active:shadow-none active:translate-y-[4px] dark:shadow-[0_4px_0_theme(colors.zinc.800)]",
    deep: "shadow-[0_6px_0_theme(colors.slate.200)] active:shadow-none active:translate-y-[6px] dark:shadow-[0_6px_0_theme(colors.zinc.800)]",
  };

  const sizeClasses = {
    sm: "h-8 px-3 text-xs gap-1.5",
    md: "h-10 px-4 text-sm gap-2",
    lg: "h-12 px-6 text-base gap-3",
  };

  const Component = href ? "a" : "button";
  const commonClasses = cn(
    "inline-flex items-center justify-center rounded-xl font-bold transition-all duration-75",
    "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50",
    "dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800/50",
    depthClasses[depth],
    sizeClasses[size],
    className
  );

  return (
    // @ts-ignore
    <Component href={href} className={commonClasses} {...props}>
      {children}
    </Component>
  );
}
