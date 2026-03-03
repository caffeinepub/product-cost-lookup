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

      // Try SKU exact match first, then name search
      const trimmed = searchTerm.trim();
      const [skuResult, nameResults] = await Promise.all([
        actor.getProductBySKU(trimmed).catch(() => null),
        actor.searchProductsByName(trimmed),
      ]);

      // Merge results, deduplicate by SKU
      const combined: Product[] = [];
      const seen = new Set<string>();

      if (skuResult) {
        combined.push(skuResult);
        seen.add(skuResult.sku);
      }
      for (const p of nameResults) {
        if (!seen.has(p.sku)) {
          combined.push(p);
          seen.add(p.sku);
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
