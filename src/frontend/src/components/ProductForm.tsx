import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Product } from "../hooks/useQueries";

interface ProductFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    sku: string;
    name: string;
    cost: number;
    description: string | null;
  }) => Promise<void>;
  initialData?: Product | null;
  isLoading?: boolean;
  mode: "add" | "edit";
}

export function ProductForm({
  open,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
  mode,
}: ProductFormProps) {
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (initialData) {
        setSku(initialData.sku);
        setName(initialData.name);
        // Show blank in form if cost is -1 (multiple variants sentinel)
        setCost(initialData.cost === -1 ? "" : initialData.cost.toString());
        setDescription(initialData.description ?? "");
      } else {
        setSku("");
        setName("");
        setCost("");
        setDescription("");
      }
      setErrors({});
    }
  }, [open, initialData]);

  function validate() {
    const errs: Record<string, string> = {};
    // At least one of SKU or name must be provided
    if (!sku.trim() && !name.trim())
      errs.name = "Either SKU or product name must be provided";
    // Cost is optional — blank means multiple variants (-1)
    if (cost.trim() !== "") {
      const costNum = Number.parseFloat(cost);
      if (Number.isNaN(costNum) || costNum < 0)
        errs.cost =
          "Enter a valid cost (≥ 0) or leave blank for multiple variants";
    }
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    const costValue = cost.trim() === "" ? -1 : Number.parseFloat(cost);
    await onSubmit({
      sku: sku.trim(),
      name: name.trim(),
      cost: costValue,
      description: description.trim() || null,
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-lg tracking-tight">
            {mode === "add" ? "Add Product" : "Edit Product"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label
              htmlFor="product-sku"
              className="text-xs font-medium text-muted-foreground uppercase tracking-widest"
            >
              SKU{" "}
              <span className="normal-case tracking-normal text-muted-foreground/60">
                (optional)
              </span>
            </Label>
            <Input
              id="product-sku"
              data-ocid="manage.input"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. HDWR-001"
              disabled={mode === "edit"}
              className="font-mono text-sm bg-muted/50 border-border focus:border-primary"
            />
            {errors.sku && (
              <p className="text-xs text-destructive">{errors.sku}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="product-name"
              className="text-xs font-medium text-muted-foreground uppercase tracking-widest"
            >
              Product Name{" "}
              <span className="normal-case tracking-normal text-muted-foreground/60">
                (optional if SKU provided)
              </span>
            </Label>
            <Input
              id="product-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Stainless Steel Bolt M8"
              className="bg-muted/50 border-border focus:border-primary"
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="product-cost"
              className="text-xs font-medium text-muted-foreground uppercase tracking-widest"
            >
              Cost (₹){" "}
              <span className="normal-case tracking-normal text-muted-foreground/60">
                (leave blank if multiple variants)
              </span>
            </Label>
            <Input
              id="product-cost"
              type="number"
              step="0.01"
              min="0"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="Leave blank if product has multiple variants"
              className="font-mono bg-muted/50 border-border focus:border-primary"
            />
            {errors.cost && (
              <p className="text-xs text-destructive">{errors.cost}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="product-description"
              className="text-xs font-medium text-muted-foreground uppercase tracking-widest"
            >
              Description{" "}
              <span className="normal-case tracking-normal text-muted-foreground/60">
                (optional)
              </span>
            </Label>
            <Textarea
              id="product-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief product description..."
              rows={3}
              className="bg-muted/50 border-border focus:border-primary resize-none text-sm"
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
              data-ocid="manage.cancel_button"
              className="text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              data-ocid="manage.submit_button"
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "add" ? "Adding..." : "Saving..."}
                </>
              ) : mode === "add" ? (
                "Add Product"
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
