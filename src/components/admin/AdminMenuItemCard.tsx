import { motion } from 'framer-motion';
import { Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { MenuItem } from '@/types/kiosk';
import { Button } from '@/components/ui/button';

interface AdminMenuItemCardProps {
  item: MenuItem;
  onEdit: () => void;
  onDelete: () => void;
  onToggleAvailability: () => void;
}

export const AdminMenuItemCard = ({
  item,
  onEdit,
  onDelete,
  onToggleAvailability,
}: AdminMenuItemCardProps) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`bg-card border border-border rounded-2xl overflow-hidden transition-all ${
        !item.available ? 'opacity-60' : ''
      }`}
    >
      <div className="relative">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-32 object-cover"
        />
        {!item.available && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <span className="text-destructive font-semibold text-sm bg-background/90 px-3 py-1 rounded-full">
              Unavailable
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-foreground line-clamp-1">{item.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
          </div>
          <span className="text-primary font-bold">${item.price.toFixed(2)}</span>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleAvailability}
            className="flex-1 rounded-xl gap-2"
          >
            {item.available ? (
              <>
                <ToggleRight className="w-4 h-4 text-green-500" />
                <span className="text-xs">Available</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4 text-red-500" />
                <span className="text-xs">Unavailable</span>
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onEdit}
            className="rounded-xl"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onDelete}
            className="rounded-xl text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
