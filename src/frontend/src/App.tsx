import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import {
  AlertCircle,
  BarChart3,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Package,
  Plus,
  ScanBarcode,
  Search,
  Tag,
  Trash2,
  Upload,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { BarcodeScanner } from "./components/BarcodeScanner";
import { ClearAllConfirmDialog } from "./components/ClearAllConfirmDialog";
import { CsvUploadDialog } from "./components/CsvUploadDialog";
import { DeleteConfirmDialog } from "./components/DeleteConfirmDialog";
import { ProductForm } from "./components/ProductForm";
import { useActor } from "./hooks/useActor";
import {
  useAddProduct,
  useClearAllProducts,
  useDeleteProduct,
  useListAllProducts,
  useProductCount,
  useSearchProducts,
  useSeedSampleData,
} from "./hooks/useQueries";
import type { Product } from "./hooks/useQueries";

type SortKey = "name" | "sku" | "cost";
type SortDir = "asc" | "desc";

function formatCost(cost: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cost);
}

export default function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [addOpen, setAddOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [clearAllOpen, setClearAllOpen] = useState(false);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [seeded, setSeeded] = useState(false);

  const { actor } = useActor();

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const { data: totalCount } = useProductCount();

  const allProductsQuery = useListAllProducts();
  const searchQuery = useSearchProducts(debouncedSearch);

  const isSearching = debouncedSearch.trim().length > 0;
  const activeQuery = isSearching ? searchQuery : allProductsQuery;
  const { data: products, isLoading, isError } = activeQuery;

  const seedMutation = useSeedSampleData();
  const addMutation = useAddProduct();
  const deleteMutation = useDeleteProduct();
  const clearAllMutation = useClearAllProducts();

  // Seed on first load if empty
  useEffect(() => {
    if (
      !seeded &&
      actor &&
      !isLoading &&
      totalCount !== undefined &&
      totalCount === BigInt(0)
    ) {
      setSeeded(true);
      seedMutation.mutate(undefined, {
        onSuccess: () => toast.success("Sample data loaded"),
        onError: () => toast.error("Failed to load sample data"),
      });
    }
  }, [actor, isLoading, totalCount, seeded, seedMutation]);

  // Sort products
  const sorted = [...(products ?? [])].sort((a, b) => {
    let cmp = 0;
    const aLabel = a.name || a.sku;
    const bLabel = b.name || b.sku;
    if (sortKey === "name") cmp = aLabel.localeCompare(bLabel);
    else if (sortKey === "sku") cmp = a.sku.localeCompare(b.sku);
    else if (sortKey === "cost") cmp = a.cost - b.cost;
    return sortDir === "asc" ? cmp : -cmp;
  });

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const handleAdd = useCallback(
    async (data: {
      sku: string;
      name: string;
      cost: number;
      description: string | null;
    }) => {
      await addMutation.mutateAsync(data, {
        onSuccess: () => {
          toast.success(`Product "${data.name || data.sku}" added`);
          setAddOpen(false);
        },
        onError: (err) => {
          toast.error(`Failed to add product: ${(err as Error).message}`);
        },
      });
    },
    [addMutation],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteProduct) return;
    await deleteMutation.mutateAsync(deleteProduct.sku, {
      onSuccess: () => {
        toast.success(`"${deleteProduct.name || deleteProduct.sku}" deleted`);
        setDeleteProduct(null);
      },
      onError: (err) => {
        toast.error(`Failed to delete: ${(err as Error).message}`);
      },
    });
  }, [deleteMutation, deleteProduct]);

  const handleClearAll = useCallback(async () => {
    await clearAllMutation.mutateAsync(undefined, {
      onSuccess: () => {
        toast.success("All products cleared");
        setClearAllOpen(false);
      },
      onError: (err) => {
        toast.error(`Failed to clear products: ${(err as Error).message}`);
      },
    });
  }, [clearAllMutation]);

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronUp className="h-3 w-3 opacity-25" />;
    return sortDir === "asc" ? (
      <ChevronUp className="h-3 w-3 text-primary" />
    ) : (
      <ChevronDown className="h-3 w-3 text-primary" />
    );
  }

  return (
    <div className="min-h-screen bg-background grid-noise">
      <Toaster position="top-right" theme="dark" />

      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-md header-glow border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-base font-bold tracking-tight leading-none">
                Product Cost Lookup
              </h1>
              {totalCount !== undefined && (
                <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                  {totalCount.toString()} products in catalog
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {totalCount !== undefined && totalCount > BigInt(0) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setClearAllOpen(true)}
                data-ocid="manage.clear_all_button"
                className="border-destructive/40 text-destructive/70 hover:text-destructive hover:border-destructive hover:bg-destructive/10 gap-1.5 text-xs font-medium transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear All
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCsvOpen(true)}
              data-ocid="csv_upload.open_modal_button"
              className="border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40 gap-1.5 text-xs font-medium"
            >
              <Upload className="h-3.5 w-3.5" />
              Import CSV
            </Button>
            <Button
              size="sm"
              onClick={() => setAddOpen(true)}
              data-ocid="manage.add_button"
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Product
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Search bar */}
        <div className="space-y-1.5">
          <div className="relative flex items-center search-glow rounded-md transition-all duration-200">
            <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              data-ocid="search.search_input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by SKU or product name..."
              className={`pl-10 h-11 bg-card border-border focus-visible:border-primary text-sm font-sans placeholder:text-muted-foreground/60 ${searchTerm ? "pr-16" : "pr-10"}`}
              autoComplete="off"
              spellCheck={false}
            />
            {/* Barcode scan button */}
            <motion.button
              data-ocid="search.scan_button"
              onClick={() => setScannerOpen(true)}
              className={`absolute ${searchTerm ? "right-8" : "right-3"} h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-primary transition-all duration-150`}
              aria-label="Scan barcode"
              title="Scan barcode or QR code"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ScanBarcode className="h-4 w-4" />
            </motion.button>
            <AnimatePresence>
              {searchTerm && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors text-xs font-mono"
                >
                  ✕
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          {isSearching && (
            <p className="text-xs text-muted-foreground pl-1">
              Results for{" "}
              <span className="text-primary font-mono">
                "{debouncedSearch}"
              </span>
            </p>
          )}
        </div>

        {/* Table */}
        <div className="rounded-md border border-border overflow-hidden bg-card/50">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_2fr_auto] gap-0 bg-muted/30 border-b border-border text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
            <button
              type="button"
              onClick={() => toggleSort("sku")}
              className="flex items-center gap-1.5 px-4 py-3 text-left hover:text-foreground transition-colors"
            >
              <Tag className="h-3 w-3" />
              SKU
              <SortIcon col="sku" />
            </button>
            <button
              type="button"
              onClick={() => toggleSort("name")}
              className="flex items-center gap-1.5 px-4 py-3 text-left hover:text-foreground transition-colors"
            >
              <Package className="h-3 w-3" />
              Product Name
              <SortIcon col="name" />
            </button>
            <button
              type="button"
              onClick={() => toggleSort("cost")}
              className="flex items-center gap-1.5 px-4 py-3 text-right hover:text-foreground transition-colors"
            >
              <DollarSign className="h-3 w-3" />
              Cost
              <SortIcon col="cost" />
            </button>
          </div>

          {/* Loading */}
          {isLoading && (
            <div
              data-ocid="product.loading_state"
              className="divide-y divide-border/50"
            >
              {(["sk1", "sk2", "sk3", "sk4", "sk5"] as const).map((k) => (
                <div
                  key={k}
                  className="grid grid-cols-[1fr_2fr_auto] gap-0 px-4 py-3.5"
                >
                  <Skeleton className="h-4 w-20 bg-muted/50" />
                  <Skeleton className="h-4 w-40 bg-muted/50" />
                  <Skeleton className="h-4 w-16 bg-muted/50" />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {isError && !isLoading && (
            <div
              data-ocid="product.error_state"
              className="flex flex-col items-center gap-3 py-16 text-center"
            >
              <AlertCircle className="h-8 w-8 text-destructive/60" />
              <div>
                <p className="text-sm font-medium text-destructive">
                  Failed to load products
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Check your connection and try again.
                </p>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !isError && sorted.length === 0 && (
            <div
              data-ocid="product.empty_state"
              className="flex flex-col items-center gap-4 py-16 text-center"
            >
              <div className="w-12 h-12 rounded-full border border-border bg-muted/30 flex items-center justify-center">
                <Package className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {isSearching ? "No products found" : "No products in catalog"}
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  {isSearching
                    ? `No results for "${debouncedSearch}". Try a different SKU or partial name.`
                    : "Add your first product to get started."}
                </p>
              </div>
              {!isSearching && (
                <Button
                  size="sm"
                  onClick={() => setAddOpen(true)}
                  className="bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add Product
                </Button>
              )}
            </div>
          )}

          {/* Product rows */}
          {!isLoading && !isError && sorted.length > 0 && (
            <div data-ocid="product.list" className="divide-y divide-border/50">
              <AnimatePresence initial={false}>
                {sorted.map((product, index) => (
                  <motion.div
                    key={product.sku || product.name}
                    data-ocid={`product.item.${index + 1}`}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15, delay: index * 0.03 }}
                    className="grid grid-cols-[1fr_2fr_auto] gap-0 items-center px-4 py-3.5 card-hover group"
                  >
                    {/* SKU */}
                    <div className="pr-2">
                      {product.sku.trim() ? (
                        <Badge
                          variant="outline"
                          className="sku-badge border-border/70 text-muted-foreground bg-muted/20 group-hover:border-primary/30 group-hover:text-primary/80 transition-colors"
                        >
                          {product.sku}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground/40 text-xs font-mono">
                          —
                        </span>
                      )}
                    </div>

                    {/* Name + Description */}
                    <div className="pr-4 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {product.name || (
                          <span className="text-muted-foreground/60 italic">
                            (no name)
                          </span>
                        )}
                      </p>
                      {product.description && (
                        <p className="text-xs text-muted-foreground/70 truncate mt-0.5">
                          {product.description}
                        </p>
                      )}
                    </div>

                    {/* Cost */}
                    <div className="pr-6 text-right tabular-nums">
                      {product.cost === -1 ? (
                        <span className="text-xs text-amber-500/80 italic leading-tight block max-w-[160px] text-right">
                          Product has multiple variants, please check your
                          master copy
                        </span>
                      ) : (
                        <span className="cost-figure text-sm">
                          {formatCost(product.cost)}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Footer row: result count */}
          {!isLoading && !isError && sorted.length > 0 && (
            <div className="px-4 py-2.5 border-t border-border/50 bg-muted/20 flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground font-mono">
                {sorted.length} result{sorted.length !== 1 ? "s" : ""}
                {isSearching && ` for "${debouncedSearch}"`}
              </p>
              {isSearching && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="text-[11px] text-primary hover:text-primary/80 font-mono transition-colors"
                >
                  Clear search →
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-center">
          <p className="text-[11px] text-muted-foreground/50 font-mono">
            © {new Date().getFullYear()}.{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-muted-foreground transition-colors"
            >
              Built with ♥ using caffeine.ai
            </a>
          </p>
        </div>
      </footer>

      {/* Barcode Scanner Dialog */}
      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={(val) => {
          setSearchTerm(val);
          setScannerOpen(false);
        }}
      />

      {/* CSV Upload Dialog */}
      <CsvUploadDialog open={csvOpen} onClose={() => setCsvOpen(false)} />

      {/* Add Product Dialog */}
      <ProductForm
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAdd}
        mode="add"
        isLoading={addMutation.isPending}
      />

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        open={!!deleteProduct}
        onClose={() => setDeleteProduct(null)}
        onConfirm={handleDelete}
        productName={deleteProduct?.name ?? ""}
        productSku={deleteProduct?.sku ?? ""}
        isLoading={deleteMutation.isPending}
      />

      {/* Clear All Confirm Dialog */}
      <ClearAllConfirmDialog
        open={clearAllOpen}
        onClose={() => setClearAllOpen(false)}
        onConfirm={handleClearAll}
        isLoading={clearAllMutation.isPending}
      />
    </div>
  );
}
