import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Product {
    sku: string;
    cost: number;
    name: string;
    description?: string;
}
export interface backendInterface {
    addProduct(sku: string, name: string, cost: number, description: string | null): Promise<void>;
    containsProduct(sku: string): Promise<boolean>;
    deleteProduct(sku: string): Promise<void>;
    getProductBySKU(sku: string): Promise<Product>;
    getProductCount(): Promise<bigint>;
    listAllProducts(): Promise<Array<Product>>;
    searchProductsByName(searchTerm: string): Promise<Array<Product>>;
    seedSampleData(): Promise<void>;
    toText(product: Product): Promise<string>;
    updateProduct(sku: string, name: string, cost: number, description: string | null): Promise<void>;
}
