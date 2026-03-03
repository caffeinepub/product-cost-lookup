import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Product } from "../hooks/useQueries";
import { useBulkImportProducts } from "../hooks/useQueries";

interface ParsedRow {
  rowIndex: number;
  data?: Product;
  error?: string;
}

function parseCSV(raw: string): ParsedRow[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  // Skip header row (first line)
  const dataLines = lines.slice(1);

  return dataLines.map((line, i) => {
    const rowIndex = i + 2; // 1-indexed, skipping header

    // Parse CSV respecting quoted fields
    const fields = parseCSVLine(line);

    if (fields.length < 2) {
      return {
        rowIndex,
        error: `Row ${rowIndex}: expected at least 2 columns (sku, name), got ${fields.length}`,
      };
    }

    const sku = fields[0].trim();
    const name = fields[1].trim();
    const costRaw = fields[2]?.trim() ?? "";
    const description = fields[3]?.trim() || undefined;

    if (!sku && !name) {
      return {
        rowIndex,
        error: `Row ${rowIndex}: Either SKU or product name must be provided`,
      };
    }

    // Cost is optional — blank means "multiple variants" (stored as -1)
    let cost: number;
    if (costRaw === "") {
      cost = -1;
    } else {
      cost = Number(costRaw);
      if (Number.isNaN(cost) || cost < 0) {
        return {
          rowIndex,
          error: `Row ${rowIndex}: Invalid cost "${costRaw}" — must be a non-negative number or leave blank`,
        };
      }
    }

    return {
      rowIndex,
      data: { sku, name, cost, description },
    };
  });
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

interface CsvUploadDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CsvUploadDialog({ open, onClose }: CsvUploadDialogProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [hasFile, setHasFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bulkImport = useBulkImportProducts();

  const validRows = parsedRows.filter((r) => r.data !== undefined);
  const errorRows = parsedRows.filter((r) => r.error !== undefined);

  function reset() {
    setFileName(null);
    setParsedRows([]);
    setHasFile(false);
    setIsDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleClose() {
    reset();
    onClose();
  }

  function processFile(file: File) {
    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a .csv file");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCSV(text);
      setParsedRows(rows);
      setHasFile(true);
    };
    reader.readAsText(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  async function handleImport() {
    if (validRows.length === 0) return;
    const products = validRows.map((r) => r.data as Product);
    bulkImport.mutate(products, {
      onSuccess: () => {
        toast.success(
          `${products.length} product${products.length !== 1 ? "s" : ""} imported successfully`,
        );
        handleClose();
      },
      onError: (err) => {
        toast.error(`Import failed: ${(err as Error).message}`);
      },
    });
  }

  const previewRows = parsedRows.slice(0, 10);
  const hasMore = parsedRows.length > 10;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        data-ocid="csv_upload.dialog"
        className="sm:max-w-2xl bg-card border-border max-h-[90vh] flex flex-col overflow-hidden"
      >
        <DialogHeader className="shrink-0">
          <DialogTitle className="font-display text-lg tracking-tight flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Import Products from CSV
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Upload a CSV file to bulk-import or update products. Existing SKUs
            will be updated.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
          {/* Format hint */}
          <div className="rounded-md bg-muted/30 border border-border/60 px-3 py-2.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">
              Expected CSV format
            </p>
            <code className="text-xs font-mono text-primary/90 block">
              sku,name,cost,description
            </code>
            <p className="text-[11px] text-muted-foreground/70 mt-1">
              First row is always treated as a header and skipped. SKU, cost,
              and description are optional. Leave cost blank if the product has
              multiple variants.
            </p>
          </div>

          {/* Drop zone */}
          {!hasFile && (
            <label
              data-ocid="csv_upload.dropzone"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                relative rounded-md border-2 border-dashed transition-all duration-200 cursor-pointer
                flex flex-col items-center justify-center gap-3 py-10 px-4 text-center
                ${
                  isDragging
                    ? "border-primary bg-primary/5 scale-[1.01]"
                    : "border-border/60 bg-muted/20 hover:border-primary/40 hover:bg-muted/30"
                }
              `}
            >
              <UploadCloud
                className={`h-8 w-8 transition-colors ${isDragging ? "text-primary" : "text-muted-foreground/50"}`}
              />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Drop your CSV file here
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  or click to browse
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="sr-only"
                data-ocid="csv_upload.upload_button"
                aria-label="Upload CSV file"
              />
            </label>
          )}

          {/* File loaded state */}
          {hasFile && (
            <div className="space-y-3">
              {/* File name + clear */}
              <div className="flex items-center justify-between rounded-md bg-muted/30 border border-border/60 px-3 py-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm font-mono text-foreground truncate max-w-[280px]">
                    {fileName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={reset}
                  className="text-muted-foreground hover:text-foreground transition-colors ml-2 shrink-0"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Summary badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {parsedRows.length} row{parsedRows.length !== 1 ? "s" : ""}{" "}
                  parsed
                </span>
                {validRows.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-medium text-primary">
                    <CheckCircle2 className="h-3 w-3" />
                    {validRows.length} valid
                  </span>
                )}
                {errorRows.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 border border-destructive/20 px-2.5 py-0.5 text-xs font-medium text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {errorRows.length} error{errorRows.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {/* Errors */}
              {errorRows.length > 0 && (
                <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-destructive uppercase tracking-wider">
                    Parse errors
                  </p>
                  {errorRows.map((r) => (
                    <p
                      key={r.rowIndex}
                      className="text-xs text-destructive/80 font-mono"
                    >
                      {r.error}
                    </p>
                  ))}
                </div>
              )}

              {/* Preview table */}
              {validRows.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                    Preview
                    {hasMore && (
                      <span className="ml-1.5 normal-case tracking-normal font-normal text-muted-foreground/60">
                        (showing first 10 of {parsedRows.length} rows)
                      </span>
                    )}
                  </p>
                  <div className="rounded-md border border-border/60 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/40 border-b border-border/60">
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground uppercase tracking-wider text-[10px]">
                            SKU
                          </th>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground uppercase tracking-wider text-[10px]">
                            Name
                          </th>
                          <th className="text-right px-3 py-2 font-medium text-muted-foreground uppercase tracking-wider text-[10px]">
                            Cost (₹)
                          </th>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground uppercase tracking-wider text-[10px]">
                            Description
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {previewRows
                          .filter((r) => r.data !== undefined)
                          .map((r) => (
                            <tr
                              key={r.rowIndex}
                              className="hover:bg-muted/20 transition-colors"
                            >
                              <td className="px-3 py-2 font-mono text-primary/80">
                                {r.data!.sku || (
                                  <span className="text-muted-foreground/50">
                                    —
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-foreground">
                                {r.data!.name}
                              </td>
                              <td className="px-3 py-2 text-right font-mono tabular-nums text-foreground">
                                {r.data!.cost === -1 ? (
                                  <span className="text-muted-foreground italic text-[10px] normal-nums">
                                    Multiple variants
                                  </span>
                                ) : (
                                  r.data!.cost.toFixed(2)
                                )}
                              </td>
                              <td className="px-3 py-2 text-muted-foreground truncate max-w-[120px]">
                                {r.data!.description ?? "—"}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  {hasMore && (
                    <p className="text-[11px] text-muted-foreground/60 mt-1.5 pl-0.5">
                      + {parsedRows.length - 10} more rows will also be imported
                    </p>
                  )}
                </div>
              )}

              {/* Empty valid rows */}
              {validRows.length === 0 && parsedRows.length > 0 && (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <AlertCircle className="h-6 w-6 text-destructive/60" />
                  <p className="text-sm text-muted-foreground">
                    No valid rows to import. Fix the errors above and re-upload.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 gap-2 pt-4 border-t border-border/50 mt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={bulkImport.isPending}
            data-ocid="csv_upload.cancel_button"
            className="text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={validRows.length === 0 || bulkImport.isPending}
            data-ocid="csv_upload.submit_button"
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold min-w-[120px]"
          >
            {bulkImport.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                Import{" "}
                {validRows.length > 0
                  ? `${validRows.length} Product${validRows.length !== 1 ? "s" : ""}`
                  : "Products"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
