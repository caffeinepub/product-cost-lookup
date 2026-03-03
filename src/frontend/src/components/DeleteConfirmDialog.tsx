import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productName: string;
  productSku: string;
  isLoading?: boolean;
}

export function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  productName,
  productSku,
  isLoading = false,
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent className="bg-card border-border sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-lg flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Delete Product?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground text-sm leading-relaxed">
            You're about to delete{" "}
            <span className="font-semibold text-foreground">{productName}</span>{" "}
            <span className="font-mono text-xs text-muted-foreground">
              ({productSku})
            </span>
            . This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            data-ocid="manage.cancel_button"
            className="text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            data-ocid="manage.confirm_button"
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Product"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
