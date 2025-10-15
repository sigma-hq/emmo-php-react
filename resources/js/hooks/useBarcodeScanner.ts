import { useState, useCallback } from 'react';
import { router } from '@inertiajs/react';

interface UseBarcodeScannerOptions {
  onScanSuccess?: (barcode: string) => void;
  onScanError?: (error: string) => void;
}

export function useBarcodeScanner(options: UseBarcodeScannerOptions = {}) {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const openScanner = useCallback(() => {
    setIsScannerOpen(true);
    setIsScanning(true);
  }, []);

  const closeScanner = useCallback(() => {
    setIsScannerOpen(false);
    setIsScanning(false);
  }, []);

  const handleScan = useCallback((barcode: string) => {
    console.log('Barcode scanned:', barcode);
    
    // Call the success callback if provided
    if (options.onScanSuccess) {
      options.onScanSuccess(barcode);
    }
    
    // Close the scanner
    closeScanner();
  }, [options.onScanSuccess, closeScanner]);

  const handleScanError = useCallback((error: string) => {
    console.error('Barcode scan error:', error);
    
    // Call the error callback if provided
    if (options.onScanError) {
      options.onScanError(error);
    }
  }, [options.onScanError]);

  return {
    isScannerOpen,
    isScanning,
    openScanner,
    closeScanner,
    handleScan,
    handleScanError
  };
}

// Hook specifically for searching drives by barcode
interface DriveBarcodeSearchOptions {
  targetRoute: string;
  queryParamName?: string;
  extraQuery?: Record<string, unknown>;
  inertiaOptions?: Parameters<typeof router.get>[2];
  onApplied?: (barcode: string) => void;
}

export function useDriveBarcodeSearch(options?: DriveBarcodeSearchOptions) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleBarcodeScan = useCallback((barcode: string) => {
    console.log('Searching by barcode:', barcode);
    const targetRoute = options?.targetRoute ?? 'drive';
    const queryKey = options?.queryParamName ?? 'search';
    const extraQuery = options?.extraQuery ?? {};

    // Allow page to sync its own search state
    options?.onApplied?.(barcode);
    setSearchTerm(barcode);

    // Navigate to the target route with the barcode as the search parameter
    router.get(
      route(targetRoute),
      { [queryKey]: barcode, ...extraQuery },
      options?.inertiaOptions ?? { preserveState: true, preserveScroll: true }
    );
  }, [options]);

  return {
    searchTerm,
    setSearchTerm,
    handleBarcodeScan
  };
}