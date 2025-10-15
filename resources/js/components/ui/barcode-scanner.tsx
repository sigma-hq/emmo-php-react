import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, X, AlertCircle, CheckCircle } from 'lucide-react';
import { BrowserMultiFormatReader, NotFoundException, DecodeHintType, BarcodeFormat } from '@zxing/library';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
  description?: string;
}

export default function BarcodeScanner({ 
  isOpen, 
  onClose, 
  onScan, 
  title = "Scan Barcode",
  description = "Position the barcode within the camera view to scan"
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);
  const videoReadyHandler = useRef<(() => void) | null>(null);
  const hasScannedRef = useRef<boolean>(false);
  const [videoDevices, setVideoDevices] = useState<Array<{ deviceId: string; label: string }>>([]);
  const [selectedDeviceIdState, setSelectedDeviceIdState] = useState<string | undefined>(undefined);
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Refresh available cameras when opening
      loadDevices();
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const loadDevices = async () => {
    try {
      // Initialize a temporary reader if needed to enumerate devices
      const reader = codeReader.current || new BrowserMultiFormatReader();
      const devices = await reader.listVideoInputDevices();
      const mapped = devices.map((d, idx) => ({
        deviceId: d.deviceId,
        label: d.label || `Camera ${idx + 1}`,
      }));
      setVideoDevices(mapped);
      if (!selectedDeviceIdState && mapped.length > 0) {
        const preferred = mapped.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear'));
        setSelectedDeviceIdState((preferred || mapped[mapped.length - 1]).deviceId);
      }
    } catch (e) {
      // Ignore; UI will still allow manual entry
    }
  };

  const startScanner = async () => {
    if (!videoRef.current) return;

    setError(null);
    setIsScanning(true);
    setIsVideoReady(false);
    hasScannedRef.current = false;

    try {
      // Create a new code reader instance with performance-focused hints
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.CODE_128,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.CODE_39,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
      ]);
      codeReader.current = new BrowserMultiFormatReader(hints);
      
      // Set a timeout for camera initialization
      const initTimeout = setTimeout(() => {
        if (!isVideoReady) {
          setError('Camera initialization is taking too long. Please try again.');
          setIsScanning(false);
        }
      }, 8000); // 8 second timeout
      
      // Try to list devices, but fall back to default camera if unavailable
      let selectedDeviceId: string | undefined = selectedDeviceIdState;
      try {
        const videoInputDevices = await codeReader.current.listVideoInputDevices();
        if (videoInputDevices && videoInputDevices.length > 0) {
          // Prefer a back/rear camera when available
          if (!selectedDeviceId) {
            const preferred = videoInputDevices.find(d => (d.label || '').toLowerCase().includes('back') || (d.label || '').toLowerCase().includes('rear'));
            selectedDeviceId = (preferred || videoInputDevices[videoInputDevices.length - 1]).deviceId;
          }
        }
      } catch (e) {
        // Ignore; we'll let the browser pick the default camera
      }

      // Add event listener to detect when video is ready
      const videoElement = videoRef.current;
      const handleVideoReady = () => {
        console.log('Video stream is ready');
        setIsVideoReady(true);
        clearTimeout(initTimeout);
      };

      videoReadyHandler.current = handleVideoReady;
      videoElement.addEventListener('loadedmetadata', handleVideoReady);
      videoElement.addEventListener('canplay', handleVideoReady);

      // Start decoding from video element with optimized settings
      await codeReader.current.decodeFromVideoDevice(
        selectedDeviceId,
        videoElement,
        (result, error) => {
          if (result) {
            const code = result.getText();
            console.log('Barcode detected:', code);
            
            // Prevent duplicate scans of the same code
            if (!hasScannedRef.current && code !== lastScannedCode) {
              hasScannedRef.current = true;
              setLastScannedCode(code);
              
              // Stop the scanner immediately to avoid further decoding while navigating
              stopScanner();
              
              // Notify parent
              onScan(code);
              
              // Close quickly to avoid lingering loading state
              onClose();
            }
          }
          
          if (error && !(error instanceof NotFoundException)) {
            console.error('Decoding error:', error);
            // Don't show error for normal "not found" cases
          }
        },
        {
          // Optimize for faster scanning: reduce resolution and framerate
          constraints: {
            video: {
              width: { ideal: 480, max: 640 },
              height: { ideal: 360, max: 480 },
              frameRate: { ideal: 15, max: 24 },
              facingMode: 'environment',
            },
          },
        }
      );

      // Safety net: if the video still isn't ready after 4s, surface an error
      setTimeout(() => {
        if (!isVideoReady) {
          setError('Unable to start the camera. Please check permissions or try another browser.');
          setIsScanning(false);
        }
      }, 4000);
      
    } catch (err) {
      console.error('Scanner initialization error:', err);
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera permissions and try again.');
      } else if (err instanceof Error && err.name === 'NotFoundError') {
        setError('No camera found. Please connect a camera and try again.');
      } else {
        setError('Failed to access camera. Please check camera permissions.');
      }
      setIsScanning(false);
      setIsVideoReady(false);
    }
  };

  const stopScanner = () => {
    if (codeReader.current) {
      codeReader.current.reset();
      codeReader.current = null;
    }
    // Stop any active media tracks and clear the video element
    if (videoRef.current) {
      const media = videoRef.current.srcObject as MediaStream | null;
      if (media && typeof media.getTracks === 'function') {
        media.getTracks().forEach((t) => {
          try { t.stop(); } catch {}
        });
      }
      videoRef.current.srcObject = null;
    }
    
    // Clean up event listeners
    if (videoRef.current && videoReadyHandler.current) {
      videoRef.current.removeEventListener('loadedmetadata', videoReadyHandler.current);
      videoRef.current.removeEventListener('canplay', videoReadyHandler.current);
      videoReadyHandler.current = null;
    }
    
    setIsScanning(false);
    setIsVideoReady(false);
  };

  const handleClose = (open?: boolean) => {
    // If Dialog provides a boolean (open state), treat false as a close request
    if (open === false || open === undefined) {
      stopScanner();
      setError(null);
      setLastScannedCode(null);
      hasScannedRef.current = false;
      onClose();
    }
  };

  const handleCancelClick = () => {
    stopScanner();
    setError(null);
    setLastScannedCode(null);
    hasScannedRef.current = false;
    onClose();
  };

  const handleSwitchCamera = async (deviceId: string) => {
    setSelectedDeviceIdState(deviceId);
    // Restart scanner with new device
    stopScanner();
    setTimeout(() => {
      startScanner();
    }, 50);
  };

  const handleManualSubmit = () => {
    const trimmed = manualCode.trim();
    if (!trimmed) return;
    stopScanner();
    hasScannedRef.current = true;
    onScan(trimmed);
    onClose();
    setManualCode('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Scanner Container */}
          <div className="relative">
            <div className="w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
              <video 
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              
              {!isVideoReady && !error && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--emmo-green-primary)] mx-auto mb-2"></div>
                    <p>Initializing camera...</p>
                    <p className="text-xs mt-1">This may take a few seconds</p>
                  </div>
                </div>
              )}
              
              {error && (
                <div className="absolute inset-0 flex items-center justify-center text-red-500">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 mx-auto mb-2" />
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Scanning overlay */}
            {isVideoReady && !error && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-32 border-2 border-[var(--emmo-green-primary)] rounded-lg">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[var(--emmo-green-primary)] rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[var(--emmo-green-primary)] rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[var(--emmo-green-primary)] rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[var(--emmo-green-primary)] rounded-br-lg"></div>
                </div>
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-[var(--emmo-green-primary)] text-white px-3 py-1 rounded-full text-sm">
                  Scanning...
                </div>
              </div>
            )}
          </div>

          {/* Camera selection */}
          {videoDevices.length > 1 && (
            <div className="flex items-center gap-2">
              <select
                className="flex-1 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-950 px-2 py-1 text-sm"
                value={selectedDeviceIdState || ''}
                onChange={(e) => handleSwitchCamera(e.target.value)}
              >
                {videoDevices.map(d => (
                  <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Instructions */}
          <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
            <p>• Position the barcode within the frame</p>
            <p>• Ensure good lighting and steady hands</p>
            <p>• The scan will happen automatically</p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancelClick}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            {error && (
              <Button onClick={startScanner} variant="default">
                <Camera className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
          </div>

          {/* Manual entry fallback */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Enter code manually"
              className="flex-1 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-950 px-3 py-2 text-sm"
            />
            <Button onClick={handleManualSubmit} className="bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-dark)]">Use Code</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}