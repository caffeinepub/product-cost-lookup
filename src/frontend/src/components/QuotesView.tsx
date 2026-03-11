import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, Tag, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import type { Product } from "../hooks/useQueries";

interface QuotesViewProps {
  product: Product;
  onBack: () => void;
}

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

const PRICE_TIERS = [
  {
    label: "Retail Price",
    multiplier: 1.82,
    markupLabel: "Cost + 82%",
    colorClass: "border-primary/30 bg-primary/5",
    badgeClass: "bg-primary/15 text-primary",
    ocid: "quotes.retail.card",
  },
  {
    label: "Wholesale Price",
    multiplier: 1.35,
    markupLabel: "Cost + 35%",
    colorClass: "border-amber-500/30 bg-amber-500/5",
    badgeClass: "bg-amber-500/15 text-amber-400",
    ocid: "quotes.wholesale.card",
  },
  {
    label: "Bulk Price",
    multiplier: 1.2,
    markupLabel: "Cost + 20%",
    colorClass: "border-green-500/30 bg-green-500/5",
    badgeClass: "bg-green-500/15 text-green-400",
    ocid: "quotes.bulk.card",
  },
];

export function QuotesView({ product, onBack }: QuotesViewProps) {
  const displayName = product.name?.trim() || null;
  const displaySku = product.sku?.trim() || null;
  const hasValidCost = product.cost !== -1;

  return (
    <motion.div
      data-ocid="quotes.panel"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-5xl mx-auto px-4 sm:px-6 py-8"
    >
      {/* Back button */}
      <Button
        data-ocid="quotes.back_button"
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="mb-6 gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/40 -ml-2 font-medium text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to product
      </Button>

      {/* Product summary pill */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-muted/30">
          <Package className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            {displayName ?? (
              <span className="italic text-muted-foreground">(no name)</span>
            )}
          </span>
        </div>
        {displaySku && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-primary/25 bg-primary/8">
            <Tag className="h-3.5 w-3.5 text-primary/70" />
            <span className="text-sm font-mono text-primary/90">
              {displaySku}
            </span>
          </div>
        )}
      </div>

      {/* Heading */}
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h2 className="font-display text-xl font-bold text-foreground">
          Selling Price Quotes
        </h2>
      </div>

      {!hasValidCost ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-6 py-8 text-center">
          <p className="text-sm text-amber-400">
            This product has multiple variants — cost is not set. Please check
            your master copy to calculate quotes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PRICE_TIERS.map((tier, i) => {
            const price = product.cost * tier.multiplier;
            const markup = price - product.cost;
            return (
              <motion.div
                key={tier.label}
                data-ocid={tier.ocid}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.05 + i * 0.07 }}
                className={`rounded-lg border ${tier.colorClass} px-5 py-6 space-y-4`}
              >
                {/* Tier badge */}
                <span
                  className={`inline-block text-[11px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded ${tier.badgeClass}`}
                >
                  {tier.markupLabel}
                </span>

                {/* Label */}
                <p className="text-sm font-medium text-muted-foreground">
                  {tier.label}
                </p>

                {/* Price */}
                <p className="font-display text-2xl sm:text-3xl font-bold text-foreground tabular-nums">
                  {formatINR(price)}
                </p>

                {/* Breakdown */}
                <div className="text-[11px] font-mono text-muted-foreground/70 space-y-0.5 border-t border-border/40 pt-3">
                  <div className="flex justify-between">
                    <span>Cost</span>
                    <span>{formatINR(product.cost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Markup</span>
                    <span>+ {formatINR(markup)}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
