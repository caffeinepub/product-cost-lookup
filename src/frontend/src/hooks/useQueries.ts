import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Product } from "../backend.d";
import { useActor } from "./useActor";

// Re-export Product for convenience
export type { Product };

export function useListAllProducts() {
  const { actor, isFetching } = useActor();
  return useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAllProducts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSearchProducts(searchTerm: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Product[]>({
    queryKey: ["products", "search", searchTerm],
    queryFn: async () => {
      if (!actor) return [];
      if (!searchTerm.trim()) return actor.listAllProducts();

      const trimmed = searchTerm.trim();

      // Try SKU exact match only when the term looks like a SKU (non-empty, no spaces)
      const skuLookupPromise =
        trimmed.length > 0 && !trimmed.includes(" ")
          ? actor.getProductBySKU(trimmed).catch(() => null)
          : Promise.resolve(null);

      const [skuResult, nameResults] = await Promise.all([
        skuLookupPromise,
        actor.searchProductsByName(trimmed),
      ]);

      // Deduplicate by composite key: sku (if non-empty) or name
      const combined: Product[] = [];
      const seen = new Set<string>();

      function dedupeKey(p: Product) {
        return p.sku.trim() !== "" ? `sku:${p.sku}` : `name:${p.name}`;
      }

      if (skuResult) {
        const k = dedupeKey(skuResult);
        combined.push(skuResult);
        seen.add(k);
      }
      for (const p of nameResults) {
        const k = dedupeKey(p);
        if (!seen.has(k)) {
          combined.push(p);
          seen.add(k);
        }
      }
      return combined;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useProductCount() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["productCount"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getProductCount();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSeedSampleData() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.seedSampleData();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["productCount"] });
    },
  });
}

export function useAddProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sku,
      name,
      cost,
      description,
    }: {
      sku: string;
      name: string;
      cost: number;
      description: string | null;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.addProduct(sku, name, cost, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["productCount"] });
    },
  });
}

export function useUpdateProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sku,
      name,
      cost,
      description,
    }: {
      sku: string;
      name: string;
      cost: number;
      description: string | null;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateProduct(sku, name, cost, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeleteProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sku: string) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteProduct(sku);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["productCount"] });
    },
  });
}

export function useBulkImportProducts() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productsArray: Product[]) => {
      if (!actor) throw new Error("No actor");
      return actor.bulkImportProducts(productsArray);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["productCount"] });
    },
  });
}

export function useClearAllProducts() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.clearAllProducts();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["productCount"] });
    },
  });
}
