import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, Tag } from "lucide-react";
import { motion } from "motion/react";
import type { Product } from "../hooks/useQueries";

interface ProductDetailViewProps {
  product: Product;
  onBack: () => void;
}

function formatCost(cost: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cost);
}

export function ProductDetailView({ product, onBack }: ProductDetailViewProps) {
  const displayName = product.name?.trim() || null;
  const displaySku = product.sku?.trim() || null;

  return (
    <motion.div
      data-ocid="product.detail.panel"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-5xl mx-auto px-4 sm:px-6 py-8"
    >
      {/* Back button */}
      <Button
        data-ocid="product.detail.back_button"
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="mb-6 gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/40 -ml-2 font-medium text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to products
      </Button>

      {/* Detail card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, delay: 0.05, ease: "easeOut" }}
        className="rounded-lg border border-border bg-card/80 overflow-hidden"
      >
        {/* Card header accent */}
        <div className="h-1 w-full bg-gradient-to-r from-primary/60 via-primary to-primary/40" />

        <div className="px-6 sm:px-8 py-8 space-y-8">
          {/* Product name */}
          <div className="space-y-1.5">
            <p className="text-[11px] uppercase tracking-widest font-medium text-muted-foreground flex items-center gap-1.5">
              <Package className="h-3 w-3" />
              Product Name
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground leading-tight">
              {displayName ?? (
                <span className="text-muted-foreground/60 italic font-normal text-xl">
                  (no name)
                </span>
              )}
            </h2>
          </div>

          {/* Divider */}
          <div className="border-t border-border/60" />

          {/* SKU + Cost grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10">
            {/* SKU */}
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-widest font-medium text-muted-foreground flex items-center gap-1.5">
                <Tag className="h-3 w-3" />
                SKU
              </p>
              <div>
                {displaySku ? (
                  <span className="sku-badge inline-flex items-center px-3 py-1.5 rounded-md border border-primary/25 bg-primary/8 text-primary/90 text-base tracking-wide">
                    {displaySku}
                  </span>
                ) : (
                  <span className="text-muted-foreground/50 text-lg font-mono">
                    —
                  </span>
                )}
              </div>
            </div>

            {/* Cost */}
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-widest font-medium text-muted-foreground">
                Cost
              </p>
              <div>
                {product.cost === -1 ? (
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-amber-500/70 flex-shrink-0" />
                    <p className="text-sm text-amber-400/90 leading-relaxed">
                      Product has multiple variants, please check your master
                      copy
                    </p>
                  </div>
                ) : (
                  <span className="cost-figure text-2xl sm:text-3xl">
                    {formatCost(product.cost)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
