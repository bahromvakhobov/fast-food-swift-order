import { Order } from '@/types/kiosk';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  ClipboardList,
  ConciergeBell,
  CreditCard,
  Home,
  MapPin,
  Printer,
  ShoppingBag,
  User,
  UtensilsCrossed,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/currency';

interface OrderConfirmationProps {
  order: Order;
  onNewOrder: () => void;
  onViewReceipt: () => void;
  onTrackOrder: () => void;
}

export function OrderConfirmation({
  order,
  onNewOrder,
  onViewReceipt,
  onTrackOrder,
}: OrderConfirmationProps) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const isPaid = order.paymentStatus === 'paid';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center p-4 md:p-8 overflow-auto"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
        className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-kiosk-success/20 flex items-center justify-center mb-6 md:mb-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5, delay: 0.4 }}
          className="w-18 h-18 md:w-24 md:h-24 rounded-full bg-kiosk-success flex items-center justify-center"
        >
          <CheckCircle2 className="w-10 h-10 md:w-12 md:h-12 text-white" />
        </motion.div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-3xl md:text-4xl font-bold text-foreground text-center mb-2 md:mb-4"
      >
        Buyurtma tasdiqlandi!
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-muted-foreground text-base md:text-lg text-center mb-6 md:mb-8"
      >
        Buyurtmangiz muvaffaqiyatli qabul qilindi
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7 }}
        className="bg-card border border-border rounded-3xl p-6 md:p-8 mb-6 md:mb-8"
      >
        <p className="text-muted-foreground text-center mb-2">Buyurtma raqami</p>
        <p className="text-5xl md:text-6xl font-bold text-primary text-center animate-pulse-glow">
          #{order.orderNumber.toString().padStart(3, '0')}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-secondary/30 rounded-2xl p-4 md:p-6 mb-6 md:mb-8 w-full max-w-sm"
      >
        <div className="flex flex-col items-center justify-center mb-4 pb-4 border-b border-border">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10">
              {order.orderType === 'dine-in' ? (
                <>
                  <UtensilsCrossed className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground text-sm">Bu yerda</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground text-sm">Olib ketish</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary">
              {order.serviceType === 'self-service' ? (
                <>
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-foreground text-sm">O'z-o'ziga xizmat</span>
                </>
              ) : (
                <>
                  <ConciergeBell className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-foreground text-sm">Ofitsiant</span>
                </>
              )}
            </div>
          </div>
          {order.orderType === 'dine-in' && order.tableNumber && (
            <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-border w-full">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-foreground">Stol #{order.tableNumber}</span>
            </div>
          )}
        </div>

        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Mahsulotlar</span>
          <span>{itemCount} ta</span>
        </div>
        {order.serviceFee > 0 && (
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Xizmat haqi (10%)</span>
            <span>{formatPrice(order.serviceFee)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>To'lov holati</span>
          <span className={`flex items-center gap-1 font-semibold ${isPaid ? 'text-kiosk-success' : 'text-yellow-400'}`}>
            <CreditCard className="w-3.5 h-3.5" />
            {isPaid ? "To'langan" : "To'lanmagan"}
          </span>
        </div>
        <div className="flex justify-between text-lg font-semibold">
          <span>To'langan summa</span>
          <span className="text-primary">{formatPrice(order.total)}</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 w-full max-w-2xl"
      >
        <Button
          onClick={onTrackOrder}
          className="h-12 md:h-14 text-base md:text-lg rounded-2xl bg-primary hover:bg-primary/90 shadow-button"
        >
          <ClipboardList className="w-5 h-5 mr-2" />
          Buyurtmani kuzatish
        </Button>
        <Button
          onClick={onViewReceipt}
          variant="outline"
          className="h-12 md:h-14 text-base md:text-lg rounded-2xl border-primary/30 hover:bg-primary/10"
        >
          <Printer className="w-5 h-5 mr-2" />
          Chek
        </Button>
        <Button
          onClick={onNewOrder}
          variant="secondary"
          className="h-12 md:h-14 text-base md:text-lg rounded-2xl"
        >
          <Home className="w-5 h-5 mr-2" />
          Yangi
        </Button>
      </motion.div>
    </motion.div>
  );
}
