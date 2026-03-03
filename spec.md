# Product Cost Lookup

## Current State
The app has a search bar with a text input for SKU or product name. No barcode scanning capability exists.

## Requested Changes (Diff)

### Add
- A barcode/QR scanner button next to the search bar that opens a camera modal
- When a barcode is scanned, its decoded value is auto-populated into the search input and triggers a search
- Uses the `qr-code` Caffeine component (`useQRScanner` hook) with back-facing camera

### Modify
- Search bar area: add a scan icon button to the right of the input (before the clear ✕ button)
- The scanner modal shows a camera preview with real-time scanning, closes automatically on a successful scan

### Remove
- Nothing removed

## Implementation Plan
1. Create `BarcodeScanner.tsx` component using `useQRScanner` hook — shows camera preview in a Dialog, auto-closes on scan
2. In `App.tsx`, add a scan button inside the search bar row; on click open the scanner dialog
3. On QR/barcode result detected, set `searchTerm` to the scanned value and close the scanner
