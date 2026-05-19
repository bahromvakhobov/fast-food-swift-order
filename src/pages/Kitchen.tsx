import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { UtensilsCrossed } from 'lucide-react';
import KitchenHeader from '@/components/kitchen/KitchenHeader';
import KitchenOrderCard from '@/components/kitchen/KitchenOrderCard';
import { subscribeToOrders, updateOrderStatus } from '@/stores/orderStore';
import { markTableAvailable } from '@/services/tableService';
import { Order } from '@/types/kiosk';
import { CanonicalOrderStatus, normalizeOrderStatus, orderStatusLabelsUz } from '@/lib/orderStatus';
import { Button } from '@/components/ui/button';

const Kitchen = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | CanonicalOrderStatus>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToOrders(
      nextOrders => {
        setOrders(nextOrders);
        setLoading(false);
        setError(null);
      },
      subscriptionError => {
        console.error('Kitchen order subscription failed:', subscriptionError);
        setError("Buyurtmalarni yuklab bo'lmadi. Firebase sozlamalarini tekshiring.");
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const handleStatusChange = async (orderId: string, status: CanonicalOrderStatus) => {
    try {
      await updateOrderStatus(orderId, status);

      // Mark table as available when order is served
      if (status === 'served') {
        const order = orders.find(o => o.id === orderId);
        if (order?.orderType === 'dine-in' && order.tableNumber) {
          try {
            await markTableAvailable(order.tableNumber);
          } catch (tableError) {
            console.error('Failed to mark table available:', tableError);
          }
        }
      }
    } catch (updateError) {
      console.error('Failed to update order status:', updateError);
      setError("Buyurtma holatini yangilab bo'lmadi.");
    }
  };

  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter(order => normalizeOrderStatus(order.status) === statusFilter);

  const newCount = orders.filter(o => normalizeOrderStatus(o.status) === 'new').length;
  const preparingCount = orders.filter(o => normalizeOrderStatus(o.status) === 'preparing').length;
  const readyCount = orders.filter(o => normalizeOrderStatus(o.status) === 'ready').length;

  const filters: Array<'all' | CanonicalOrderStatus> = ['all', 'new', 'preparing', 'ready', 'served'];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <KitchenHeader 
        newCount={newCount}
        preparingCount={preparingCount} 
        readyCount={readyCount}
      />

      <main className="flex-1 p-4 md:p-6">
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {filters.map(filter => (
            <Button
              key={filter}
              variant={statusFilter === filter ? 'default' : 'outline'}
              onClick={() => setStatusFilter(filter)}
              className="rounded-xl whitespace-nowrap"
              size="sm"
            >
              {filter === 'all' ? `Hammasi (${orders.length})` : `${orderStatusLabelsUz[filter]} (${orders.filter(o => normalizeOrderStatus(o.status) === filter).length})`}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <UtensilsCrossed className="h-16 w-16 md:h-24 md:w-24 mb-4 opacity-50 animate-pulse" />
            <p className="text-xl md:text-2xl">Buyurtmalar yuklanmoqda...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <UtensilsCrossed className="h-16 w-16 md:h-24 md:w-24 mb-4 opacity-50" />
            <p className="text-xl md:text-2xl text-destructive">{error}</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <UtensilsCrossed className="h-16 w-16 md:h-24 md:w-24 mb-4 opacity-50" />
            <p className="text-xl md:text-2xl">Faol buyurtmalar yo'q</p>
            <p className="text-base md:text-lg">Yangi buyurtmalar kutilmoqda...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            <AnimatePresence mode="popLayout">
              {filteredOrders.map(order => (
                <KitchenOrderCard
                  key={order.id}
                  order={order}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
};

export default Kitchen;
