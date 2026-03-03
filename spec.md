# Product Cost Lookup

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Product data model with fields: SKU, product name, cost
- Backend API to search products by SKU (exact match) or partial product name (case-insensitive)
- Ability to add, update, and delete products (admin management)
- Search results display showing SKU, product name, and cost
- Sample/seed product data for demonstration

### Modify
N/A

### Remove
N/A

## Implementation Plan
1. Backend (Motoko):
   - Define `Product` type with fields: id, sku, name, cost (in cents or decimal), description (optional)
   - Store products in a stable `HashMap` keyed by SKU
   - `searchProducts(query: Text): [Product]` -- returns products where SKU matches exactly OR name contains the query substring (case-insensitive)
   - `addProduct(sku, name, cost, description): Result` -- add a new product
   - `updateProduct(sku, name, cost, description): Result` -- update existing product
   - `deleteProduct(sku): Result` -- remove a product
   - `getAllProducts(): [Product]` -- list all products
   - Seed with sample product data on first load

2. Frontend:
   - Search bar prominently displayed, placeholder: "Search by SKU or product name"
   - Live search results table/cards showing SKU, product name, and cost
   - Empty state when no results found
   - Product management section (add/edit/delete products)
   - Cost displayed in currency format (USD)
