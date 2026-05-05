import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Camera, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import '@google/model-viewer';

/* ------------------------------------------------------------------ */
/*  Extended model-viewer type declarations                           */
/* ------------------------------------------------------------------ */
type ModelViewerElement = HTMLElement & {
  activateAR?: () => Promise<void> | void;
  canActivateAR?: boolean;
};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<
        React.HTMLAttributes<ModelViewerElement> & {
          src?: string;
          'ios-src'?: string;
          alt?: string;
          ar?: boolean;
          'ar-modes'?: string;
          'ar-scale'?: string;
          'auto-rotate'?: boolean;
          'camera-controls'?: boolean;
          'touch-action'?: string;
          'shadow-intensity'?: string;
          'environment-image'?: string;
          exposure?: string;
          loading?: string;
          reveal?: string;
          'camera-orbit'?: string;
          'field-of-view'?: string;
          'interaction-prompt'?: string;
          'min-camera-orbit'?: string;
          'max-camera-orbit'?: string;
        },
        ModelViewerElement
      >;
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Status type                                                       */
/* ------------------------------------------------------------------ */
type ModelStatus = 'loading' | 'ready' | 'error' | 'ar-started' | 'ar-tracking' | 'ar-failed';

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
interface ARFoodViewerProps {
  name: string;
  modelUrl: string;
  onClose: () => void;
}

export function ARFoodViewer({ name, modelUrl, onClose }: ARFoodViewerProps) {
  const modelViewerRef = useRef<ModelViewerElement | null>(null);
  const [status, setStatus] = useState<ModelStatus>('loading');
  const [arSupported, setArSupported] = useState<boolean | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('3D model yuklanmoqda...');

  /* ---- attach event listeners on mount ---- */
  useEffect(() => {
    const mv = modelViewerRef.current;
    if (!mv) return;

    const onLoad = () => {
      console.log('[AR] ✅ Model loaded:', modelUrl);
      setStatus('ready');
      setStatusMessage('3D model tayyor / 3D model ready');

      // Check AR support after model loads
      // model-viewer exposes canActivateAR after the model is loaded
      setTimeout(() => {
        if (mv.canActivateAR) {
          setArSupported(true);
          console.log('[AR] ✅ AR is supported on this device');
        } else {
          setArSupported(false);
          console.log('[AR] ⚠️ AR is NOT supported on this device/browser');
        }
      }, 500);
    };

    const onError = (event: Event) => {
      console.error('[AR] ❌ Model error:', event);
      setStatus('error');
      setStatusMessage('3D model fayli topilmadi yoki qo\'llab-quvvatlanmaydi / 3D model file not found or unsupported');
    };

    const onArStatus = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      console.log('[AR] 📱 AR status:', detail);

      if (detail.status === 'session-started') {
        setStatus('ar-started');
        setStatusMessage('AR sessiyasi boshlandi / AR session started');
      } else if (detail.status === 'object-placed') {
        setStatus('ar-tracking');
        setStatusMessage('Model joylashtirildi / Model placed');
      } else if (detail.status === 'failed') {
        setStatus('ar-failed');
        setStatusMessage('AR ishlamadi / AR failed — 3D ko\'rish davom etadi');
      } else if (detail.status === 'not-presenting') {
        console.log('[AR] AR session ended (not-presenting)');
        setStatus('ready');
        setStatusMessage('3D model tayyor / 3D model ready');
      }
    };

    const onArTracking = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      console.log('[AR] 🎯 AR tracking:', detail);
    };

    mv.addEventListener('load', onLoad);
    mv.addEventListener('error', onError);
    mv.addEventListener('ar-status', onArStatus);
    mv.addEventListener('ar-tracking', onArTracking);

    return () => {
      mv.removeEventListener('load', onLoad);
      mv.removeEventListener('error', onError);
      mv.removeEventListener('ar-status', onArStatus);
      mv.removeEventListener('ar-tracking', onArTracking);
    };
  }, [modelUrl]);

  /* ---- status indicator helpers ---- */
  const statusIcon = () => {
    switch (status) {
      case 'loading':
        return <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />;
      case 'ready':
      case 'ar-started':
      case 'ar-tracking':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'error':
      case 'ar-failed':
        return <AlertTriangle className="h-4 w-4 text-red-400" />;
    }
  };

  const statusColor = () => {
    switch (status) {
      case 'loading': return 'border-blue-500/30 bg-blue-500/10 text-blue-200';
      case 'ready': return 'border-green-500/30 bg-green-500/10 text-green-200';
      case 'error': return 'border-red-500/30 bg-red-500/10 text-red-200';
      case 'ar-started':
      case 'ar-tracking': return 'border-green-500/30 bg-green-500/10 text-green-200';
      case 'ar-failed': return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-background flex flex-col"
      onClick={(event) => event.stopPropagation()}
    >
      {/* ---- Header ---- */}
      <header className="flex items-center justify-between gap-4 border-b border-border bg-card/70 px-4 py-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-11 w-11 shrink-0 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold text-foreground md:text-2xl">{name}</h2>
            <p className="text-sm text-muted-foreground">3D / AR food preview</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-11 w-11 shrink-0 rounded-full"
        >
          <X className="h-5 w-5" />
        </Button>
      </header>

      {/* ---- Main content ---- */}
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto flex min-h-full max-w-4xl flex-col gap-4">

          {/* ---- model-viewer with native AR ---- */}
          <section className="relative min-h-[420px] flex-1 overflow-hidden rounded-3xl border border-border bg-card shadow-card">
            {/* @ts-ignore - model-viewer custom element */}
            <model-viewer
              ref={modelViewerRef}
              src={modelUrl}
              alt={`${name} 3D model`}
              ar
              ar-modes="webxr scene-viewer quick-look"
              ar-scale="fixed"
              camera-controls
              auto-rotate
              touch-action="pan-y"
              shadow-intensity="1"
              environment-image="neutral"
              exposure="1"
              interaction-prompt="auto"
              loading="eager"
              reveal="auto"
              style={{ width: '100%', height: 'min(68vh, 620px)', minHeight: 420 }}
            >
              {/* ---- AR button INSIDE model-viewer (slot="ar-button") ---- */}
              <button
                slot="ar-button"
                style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '100px',
                  backgroundColor: '#f97316',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '15px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(249, 115, 22, 0.4)',
                  zIndex: 10,
                }}
              >
                📱 AR'da stol ustida ko'rish
              </button>
            </model-viewer>

            {/* 3D Badge */}
            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-primary/90 px-3 py-1.5 text-primary-foreground backdrop-blur-sm">
              <Camera className="h-4 w-4" />
              <span className="text-xs font-semibold">3D / AR</span>
            </div>
          </section>

          {/* ---- Status message ---- */}
          <div className={`flex items-center gap-3 rounded-2xl border p-4 text-sm ${statusColor()}`}>
            {statusIcon()}
            <span>{statusMessage}</span>
          </div>

          {/* ---- AR support info ---- */}
          {arSupported === false && (
            <div className="flex items-start gap-3 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">AR bu qurilma/brauzerda qo'llab-quvvatlanmaydi</p>
                <p className="mt-1 opacity-80">
                  AR is not supported on this device/browser, but 3D preview is available above.
                  AR works best on a real Android device with ARCore or iPhone/iPad with ARKit.
                </p>
              </div>
            </div>
          )}

          {arSupported === true && (
            <div className="flex items-start gap-3 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-200">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">AR tayyor! Yuqoridagi "AR'da stol ustida ko'rish" tugmasini bosing</p>
                <p className="mt-1 opacity-80">
                  Kamerani stolga qarating, bir necha soniya kuting, so'ng aniqlangan yuzaga bosing.
                </p>
              </div>
            </div>
          )}

          {/* ---- Developer / testing notes ---- */}
          <details className="rounded-2xl border border-border bg-card/50 p-4 text-sm text-muted-foreground">
            <summary className="cursor-pointer font-semibold text-foreground">
              ℹ️ AR testing notes (developer info)
            </summary>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-xs leading-relaxed">
              <li>AR works best on a real Android device with ARCore or iPhone/iPad with ARKit.</li>
              <li>AR may not work on desktop browsers (no camera AR support).</li>
              <li>For mobile camera AR, the app must be served from <strong>HTTPS</strong> or <code>localhost</code>.</li>
              <li>If testing on a tablet via local network IP (e.g. <code>http://192.168.x.x:5173</code>), WebXR will fail unless HTTPS is used.</li>
              <li>Deploy to <strong>Vercel</strong> or <strong>Firebase Hosting</strong> for full AR testing.</li>
              <li>On Android, Scene Viewer opens AR with <code>.glb</code> files automatically.</li>
              <li>On iOS/iPadOS, Quick Look prefers <code>.usdz</code> files. Without a <code>.usdz</code>, AR may fall back to 3D-only on iOS.</li>
            </ul>
          </details>

        </div>
      </main>
    </motion.div>
  );
}
