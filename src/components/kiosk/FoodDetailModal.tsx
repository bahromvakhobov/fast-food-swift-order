import { useEffect, useRef, useState } from 'react';
import { MenuItem } from '@/types/kiosk';
import { formatPrice } from '@/lib/currency';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, X, RotateCcw, View } from 'lucide-react';
import { Button } from '@/components/ui/button';
import '@google/model-viewer';

// Type declaration for model-viewer web component
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          alt?: string;
          'auto-rotate'?: boolean;
          'camera-controls'?: boolean;
          'touch-action'?: string;
          ar?: boolean;
          'ar-modes'?: string;
          'shadow-intensity'?: string;
          'environment-image'?: string;
          exposure?: string;
          poster?: string;
          loading?: string;
          reveal?: string;
        },
        HTMLElement
      >;
    }
  }
}

interface FoodDetailModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: MenuItem) => void;
}

export function FoodDetailModal({ item, isOpen, onClose, onAddToCart }: FoodDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [showAR, setShowAR] = useState(false);

  useEffect(() => {
    if (isOpen) setQuantity(1);
  }, [isOpen, item]);

  if (!item) return null;

  const has3DModel = !!item.modelUrl;
  const hasARSupport = item.hasAR && has3DModel;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      onAddToCart(item);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-card border border-border rounded-t-3xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-secondary/80 backdrop-blur-sm flex items-center justify-center"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>

            {/* 3D Preview or Image */}
            <div className="relative aspect-square w-full bg-secondary/30 overflow-hidden rounded-t-3xl sm:rounded-t-3xl">
              {has3DModel ? (
                <model-viewer
                  src={item.modelUrl}
                  alt={item.name}
                  auto-rotate
                  camera-controls
                  touch-action="pan-y"
                  shadow-intensity="1"
                  exposure="1"
                  loading="lazy"
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              )}

              {/* 3D badge */}
              {has3DModel && (
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-primary/90 backdrop-blur-sm flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-primary-foreground" />
                  <span className="text-xs font-semibold text-primary-foreground">3D</span>
                </div>
              )}

              {/* AR button */}
              {hasARSupport && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute bottom-4 left-4 rounded-full gap-1.5"
                  onClick={() => setShowAR(true)}
                >
                  <View className="w-4 h-4" />
                  View on Table (AR)
                </Button>
              )}
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              {/* Name & Price */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-foreground">{item.name}</h2>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  )}
                </div>
                <p className="text-xl font-bold text-primary whitespace-nowrap">
                  {formatPrice(item.price)}
                </p>
              </div>

              {/* Ingredients */}
              {item.ingredients && item.ingredients.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Ingredients</h3>
                  <div className="flex flex-wrap gap-2">
                    {item.ingredients.map((ingredient, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 rounded-full bg-secondary text-xs font-medium text-secondary-foreground"
                      >
                        {ingredient}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity + Add to Cart */}
              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-3 bg-secondary rounded-2xl p-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-background/50 transition-colors"
                  >
                    <Minus className="w-4 h-4 text-foreground" />
                  </button>
                  <span className="w-8 text-center font-bold text-foreground">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-background/50 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-foreground" />
                  </button>
                </div>

                <Button
                  onClick={handleAddToCart}
                  disabled={!item.available}
                  className="flex-1 h-12 rounded-2xl text-base font-semibold gradient-orange shadow-button"
                >
                  Add to Cart · {formatPrice(item.price * quantity)}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
