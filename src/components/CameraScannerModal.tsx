import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, RefreshCw, AlertCircle } from 'lucide-react';
import { sounds } from '../utils/sound';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onScan
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera(facingMode);

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async (mode: 'environment' | 'user') => {
    stopCamera();
    setErrorMsg(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Câmera não suportada neste navegador.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }

      initBarcodeDetector(videoRef.current);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'Não foi possível acessar a câmera. Verifique as permissões.');
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const initBarcodeDetector = (videoElement: HTMLVideoElement | null) => {
    if (!videoElement) return;

    // Check if BarcodeDetector is available natively
    const WindowWithBarcodeDetector = window as unknown as {
      BarcodeDetector?: new (options?: { formats: string[] }) => {
        detect: (image: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
      };
    };

    if (WindowWithBarcodeDetector.BarcodeDetector) {
      const detector = new WindowWithBarcodeDetector.BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code', 'upc_a', 'upc_e']
      });

      const detectFrame = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          animationFrameRef.current = requestAnimationFrame(detectFrame);
          return;
        }

        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0) {
            const code = barcodes[0].rawValue;
            if (code) {
              sounds.scanItem();
              onScan(code);
              onClose();
              return;
            }
          }
        } catch {
          // ignore detection error per frame
        }

        animationFrameRef.current = requestAnimationFrame(detectFrame);
      };

      animationFrameRef.current = requestAnimationFrame(detectFrame);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      sounds.scanItem();
      onScan(manualCode.trim());
      onClose();
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
      <div className="bg-[#101010] border border-amber-400/40 rounded-xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <h3 className="font-display text-base text-amber-400 font-bold uppercase tracking-wider flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-400" /> Leitor de Código de Barras
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-md hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera View Area */}
        <div className="relative bg-black w-full aspect-4/3 flex items-center justify-center overflow-hidden">
          {errorMsg ? (
            <div className="p-6 text-center text-neutral-300 space-y-2">
              <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
              <p className="text-xs text-rose-300">{errorMsg}</p>
              <p className="text-[11px] text-neutral-400">Você pode digitar o código de barras abaixo ou usar um leitor USB.</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Target Aiming Box */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-3/4 h-1/2 border-2 border-amber-400/80 rounded-lg relative shadow-[0_0_20px_rgba(255,193,7,0.3)]">
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-rose-500/80 animate-pulse" />
                  <div className="absolute top-1 left-2 text-[9px] font-mono text-amber-300/80 uppercase">Aponte para o código</div>
                </div>
              </div>

              {/* Flip camera button */}
              <button
                onClick={toggleCamera}
                className="absolute bottom-3 right-3 p-2 rounded-full bg-neutral-900/80 text-white border border-neutral-700 hover:border-amber-400 transition-colors cursor-pointer"
                title="Alternar Câmera"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Manual Barcode Input Fallback */}
        <div className="p-4 bg-[#141414] border-t border-neutral-800 space-y-2">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Digite o código (ex: 1001, 789...)"
              autoFocus
              className="flex-1 bg-[#0a0a0a] border border-neutral-700 focus:border-amber-400 px-3 py-2 text-sm rounded-md text-white outline-none font-mono"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black font-display font-bold uppercase rounded-md text-xs transition-colors"
            >
              Bipar
            </button>
          </form>
          <p className="text-[10px] text-neutral-400 text-center">
            Dica: Leitores USB e Bluetooth funcionam diretamente na busca do PDV.
          </p>
        </div>

      </div>
    </div>
  );
};
