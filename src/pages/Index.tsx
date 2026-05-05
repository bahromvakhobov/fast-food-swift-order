import { useState, useCallback } from 'react';
import { Category, CartItem, MenuItem, Language, Screen, Order, PaymentMethod, OrderType, ServiceType } from '@/types/kiosk';
import { saveOrder, updateOrderPaymentStatus } from '@/stores/orderStore';
import { menuItems } from '@/data/menuData';
import { CategorySidebar } from '@/components/kiosk/CategorySidebar';
import { KioskHeader } from '@/components/kiosk/KioskHeader';
import { FoodItemCard } from '@/components/kiosk/FoodItemCard';
import { CartPanel } from '@/components/kiosk/CartPanel';
import { MobileCartDrawer } from '@/components/kiosk/MobileCartDrawer';
import { PaymentScreen } from '@/components/kiosk/PaymentScreen';
import { OrderConfirmation } from '@/components/kiosk/OrderConfirmation';
import { ReceiptScreen } from '@/components/kiosk/ReceiptScreen';
import { OrderTrackingScreen } from '@/components/kiosk/OrderTrackingScreen';
import { IntroScreen } from '@/components/kiosk/IntroScreen';
import { FoodDetailModal } from '@/components/kiosk/FoodDetailModal';
import { TableNumberScreen } from '@/components/kiosk/TableNumberScreen';
import { AnimatePresence, motion } from 'framer-motion';
import { getOrderById } from '@/stores/orderStore';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [activeCategory, setActiveCategory] = useState<Category>('tacos');
  const [language, setLanguage] = useState<Language>('en');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [screen, setScreen] = useState<Screen>('intro');
  const [orderType, setOrderType] = useState<OrderType>('dine-in');
  const [serviceType, setServiceType] = useState<ServiceType>('self-service');
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [pendingOrderNumber, setPendingOrderNumber] = useState<number | null>(null);
  const { toast } = useToast();
  const [tableNumber, setTableNumber] = useState<number | null>(() => {
    const saved = localStorage.getItem('aresto-table-number');
    return saved ? parseInt(saved, 10) : null;
  });

  const filteredItems = menuItems.filter(item => item.category === activeCategory);

  const addToCart = useCallback((item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => 
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    // Removed toast notification - silent add with animation only
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setCart(prev => prev.map(item => 
      item.id === id ? { ...item, quantity } : item
    ));
  }, []);

  const removeItem = useCallback((id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  }, []);

  const handleCheckout = useCallback(() => {
    if (cart.length === 0) return;
    setPendingOrderNumber(prev => prev ?? Math.floor(100 + Math.random() * 900));
    setScreen('payment');
  }, [cart.length]);

  const handlePaymentComplete = useCallback(async (method: PaymentMethod) => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const serviceFee = serviceType === 'waiter-service' ? subtotal * 0.10 : 0;
    const total = subtotal + serviceFee;
    const orderNumber = pendingOrderNumber ?? Math.floor(100 + Math.random() * 900);
    const paymentStatus = method === 'cash' ? 'unpaid' : 'paid';
    
    const order: Order = {
      id: '',
      orderNumber,
      items: [...cart],
      subtotal,
      serviceFee,
      total,
      serviceType,
      createdAt: new Date(),
      status: 'new',
      orderType,
      paymentMethod: method,
      paymentStatus,
      ...(orderType === 'dine-in' && tableNumber ? { tableNumber } : {}),
    };
    try {
      const savedOrder = await saveOrder(order);
      await updateOrderPaymentStatus(savedOrder.id, paymentStatus);
      setCurrentOrder({ ...savedOrder, paymentStatus });
      setCart([]);
      setPendingOrderNumber(null);
      setScreen('confirmation');
    } catch (error) {
      console.error('Failed to create order:', error);
      toast({
        title: 'Buyurtma saqlanmadi',
        description: "Firebase sozlamalarini tekshiring va qayta urinib ko'ring.",
        variant: 'destructive',
      });
      throw error;
    }
  }, [cart, orderType, pendingOrderNumber, serviceType, tableNumber, toast]);

  const handleNewOrder = useCallback(() => {
    setCart([]);
    setCurrentOrder(null);
    setScreen('intro');
    setActiveCategory('tacos');
    setServiceType('self-service');
    setPendingOrderNumber(null);
    setTableNumber(null);
    localStorage.removeItem('aresto-table-number');
  }, []);

  const handleSelectOrderType = useCallback((type: OrderType) => {
    setOrderType(type);
    if (type === 'dine-in') {
      setScreen('table-select');
    } else {
      setTableNumber(null);
      localStorage.removeItem('aresto-table-number');
      setScreen('menu');
    }
  }, []);

  const handleTableNumberConfirm = useCallback((num: number) => {
    setTableNumber(num);
    setScreen('menu');
  }, []);

  const handleViewReceipt = useCallback(() => {
    setScreen('receipt');
  }, []);

  const handleTrackOrder = useCallback(async () => {
    if (currentOrder) {
      setCurrentOrder(await getOrderById(currentOrder.id) ?? currentOrder);
    }
    setScreen('tracking');
  }, [currentOrder]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const serviceFee = serviceType === 'waiter-service' ? subtotal * 0.10 : 0;
  const total = subtotal + serviceFee;

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <AnimatePresence mode="wait">
        {screen === 'intro' && (
          <IntroScreen
            language={language}
            onLanguageChange={setLanguage}
            onSelectOrderType={handleSelectOrderType}
          />
        )}

        {screen === 'table-select' && (
          <TableNumberScreen
            language={language}
            onConfirm={handleTableNumberConfirm}
            onBack={() => setScreen('intro')}
          />
        )}

        {screen === 'payment' && (
          <PaymentScreen
            items={cart}
            subtotal={subtotal}
            serviceFee={serviceFee}
            total={total}
            orderType={orderType}
            serviceType={serviceType}
            tableNumber={tableNumber}
            orderNumber={pendingOrderNumber ?? 0}
            onBack={() => setScreen('menu')}
            onPaymentComplete={handlePaymentComplete}
          />
        )}

        {screen === 'confirmation' && currentOrder && (
          <OrderConfirmation
            order={currentOrder}
            onNewOrder={handleNewOrder}
            onViewReceipt={handleViewReceipt}
            onTrackOrder={handleTrackOrder}
          />
        )}

        {screen === 'tracking' && currentOrder && (
          <OrderTrackingScreen
            order={currentOrder}
            onBack={() => {
              getOrderById(currentOrder.id).then(order => setCurrentOrder(order ?? currentOrder));
              setScreen('confirmation');
            }}
            onNewOrder={handleNewOrder}
          />
        )}

        {screen === 'receipt' && currentOrder && (
          <ReceiptScreen
            order={currentOrder}
            onBack={() => setScreen('confirmation')}
            onNewOrder={handleNewOrder}
          />
        )}
      </AnimatePresence>

      {screen === 'menu' && (
        <>
          {/* Category Sidebar */}
          <CategorySidebar
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />

          {/* Main Content */}
          <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
            <KioskHeader
              language={language}
              onLanguageChange={setLanguage}
            />

            {/* Food Grid */}
            <div className="flex-1 overflow-y-auto scrollbar-hide p-4 md:p-6 pb-24 md:pb-6">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4"
              >
                {filteredItems.map((item, index) => (
                  <FoodItemCard
                    key={item.id}
                    item={item}
                    onAddToCart={addToCart}
                    onViewDetails={setSelectedItem}
                    index={index}
                  />
                ))}
              </motion.div>
            </div>
          </main>

          {/* Desktop Cart Panel */}
          <CartPanel
            items={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            onCheckout={handleCheckout}
            serviceType={serviceType}
            onServiceTypeChange={setServiceType}
          />

          {/* Mobile Cart Drawer */}
          <MobileCartDrawer
            items={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            onCheckout={handleCheckout}
            serviceType={serviceType}
            onServiceTypeChange={setServiceType}
          />
        </>
      )}

      {/* Food Detail Modal */}
      <FoodDetailModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onAddToCart={addToCart}
      />
    </div>
  );
};

export default Index;
