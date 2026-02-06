import { MenuItem } from '@/types/kiosk';
import { motion } from 'framer-motion';
import { Plus, RotateCcw } from 'lucide-react';
import { formatPrice } from '@/lib/currency';

interface FoodItemCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
  onViewDetails: (item: MenuItem) => void;
  index: number;
}

export function FoodItemCard({ item, onAddToCart, onViewDetails, index }: FoodItemCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => item.available && onViewDetails(item)}
      className={`
        relative overflow-hidden rounded-3xl bg-card border border-border
        cursor-pointer transition-all duration-300 touch-manipulation
        hover:border-primary/50 hover:shadow-card
        ${!item.available && 'opacity-50 cursor-not-allowed'}
      `}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        
        {/* Add Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            if (item.available) onAddToCart(item);
          }}
          className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary flex items-center justify-center shadow-button"
        >
          <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
        </motion.button>

        {/* 3D badge */}
        {item.modelUrl && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-primary/90 backdrop-blur-sm flex items-center gap-1">
            <RotateCcw className="w-3 h-3 text-primary-foreground" />
            <span className="text-[10px] font-semibold text-primary-foreground">3D</span>
          </div>
        )}

        {!item.available && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <span className="text-sm font-medium text-muted-foreground bg-secondary px-3 py-1 rounded-full">
              Mavjud emas
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 sm:p-4">
        <h3 className="font-semibold text-base sm:text-lg text-foreground mb-1 line-clamp-1">
          {item.name}
        </h3>
        {item.description && (
          <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-1">
            {item.description}
          </p>
        )}
        <p className="text-lg sm:text-xl font-bold text-primary">
          {formatPrice(item.price)}
        </p>
      </div>
    </motion.div>
  );
}
