import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PossessionSubcardItem = {
  label: string;
  value: ReactNode;
  prominent?: boolean;
  fullSpan?: boolean;
  align?: "left" | "right";
};

type PossessionSubcardProps = {
  items: PossessionSubcardItem[];
  columns?: 4 | 5 | 6;
  className?: string;
};

const columnClasses: Record<NonNullable<PossessionSubcardProps["columns"]>, string> = {
  4: "md:grid-cols-4 lg:grid-cols-4",
  5: "md:grid-cols-5 lg:grid-cols-5",
  6: "md:grid-cols-6 lg:grid-cols-6",
};

export function PossessionSubcard({
  items,
  columns = 5,
  className,
}: PossessionSubcardProps) {
  return (
    <div
      className={cn(
        "p-3 rounded-lg border border-border/70 bg-background/80 shadow-[0_1px_0_rgba(0,0,0,0.03)]",
        "dark:bg-muted/30 dark:border-border/60",
        className
      )}
    >
      <div className={cn("grid gap-3 grid-cols-2", columnClasses[columns])}>
        {items.map((item, index) => (
          <div
            key={`${item.label}-${index}`}
            className={cn(
              "space-y-1",
              item.fullSpan && "col-span-2 md:col-span-1",
              item.align === "right" && "lg:text-right"
            )}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {item.label}
            </p>
            <p
              className={cn(
                "font-semibold text-foreground",
                item.prominent ? "text-lg sm:text-xl" : "text-sm sm:text-base"
              )}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
