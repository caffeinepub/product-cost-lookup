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
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000),
  });
}

/**
 * Client-side word-based search:
 * Splits the search term into words and returns products where
 * ANY word appears anywhere in the product name or SKU.
 */
function matchesSearch(product: Product, searchTerm: string): boolean {
  const words = searchTerm.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = `${product.name} ${product.sku}`.toLowerCase();
  return words.some((word) => haystack.includes(word));
}

export function useSearchProducts(searchTerm: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Product[]>({
    queryKey: ["products", "search", searchTerm],
    queryFn: async () => {
      if (!actor) return [];
      if (!searchTerm.trim()) return actor.listAllProducts();
      const allProducts = await actor.listAllProducts();
      return allProducts.filter((p) => matchesSearch(p, searchTerm));
    },
    enabled: !!actor && !isFetching,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000),
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
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000),
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
