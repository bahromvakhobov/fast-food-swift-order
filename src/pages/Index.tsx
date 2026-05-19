import { useState, useCallback, useEffect } from 'react';
import { Category, CartItem, MenuItem, Language, Screen, Order, PaymentMethod, OrderType, ServiceType } from '@/types/kiosk';
import { saveOrder, updateOrderPaymentStatus } from '@/stores/orderStore';
import { menuItems as fallbackMenuItems, categories as fallbackCategories } from '@/data/menuData';
import { subscribeToFoods } from '@/services/foodService';
import { subscribeToCategories } from '@/services/categoryService';
import { markTableOccupied } from '@/services/tableService';
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
  const [tableNumber, setTableNumber] = useState<number | null>(() => {
    const saved = localStorage.getItem('aresto-table-number');
    return saved ? Number(saved) : null;
  });
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(fallbackMenuItems);
  const [categories, setCategories] = useState(fallbackCategories);
  const [usingLocalMenu, setUsingLocalMenu] = useState(false);
  const [usingLocalCategories, setUsingLocalCategories] = useState(false);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState<string | null>(null);
  const { toast } = useToast();

  const filteredItems = menuItems.filter(item => item.category === activeCategory);

  useEffect(() => {
    const unsubscribeFoods = subscribeToFoods(
      nextFoods => {
        if (nextFoods.length > 0) {
          setMenuItems(nextFoods);
          setUsingLocalMenu(false);
        } else {
          setMenuItems(fallbackMenuItems);
          setUsingLocalMenu(true);
        }
        setMenuLoading(false);
        setMenuError(null);
      },
      subscriptionError => {
        console.error('Menu subscription failed:', subscriptionError);
        setMenuItems(fallbackMenuItems);
        setUsingLocalMenu(true);
        setMenuError("Menyu yuklanmadi. Keshdan foydalanilmoqda.");
        setMenuLoading(false);
      },
    );

    const unsubscribeCategories = subscribeToCategories(
      nextCategories => {
        if (nextCategories.length > 0) {
          setCategories(nextCategories.map(cat => ({ id: cat.id, name: cat.name, icon: cat.icon })));
          setUsingLocalCategories(false);
        } else {
          setCategories(fallbackCategories);
          setUsingLocalCategories(true);
        }
      },
      subscriptionError => {
        console.error('Categories subscription failed:', subscriptionError);
        setCategories(fallbackCategories);
        setUsingLocalCategories(true);
      },
    );

    return () => {
      unsubscribeFoods();
      unsubscribeCategories();
    };
  }, []);

  useEffect(() => {
    if (tableNumber !== null) {
      localStorage.setItem('aresto-table-number', String(tableNumber));
    } else {
      localStorage.removeItem('aresto-table-number');
    }
  }, [tableNumber]);

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
    if (orderType === 'dine-in' && !tableNumber) {
      toast({
        title: 'Stol raqami kerak',
        description: 'Dine-in buyurtma uchun stol raqamini kiriting.',
        variant: 'destructive',
      });
      return;
    }

    if (cart.length === 0) {
      toast({
        title: 'Savat bo‘sh',
        description: 'Iltimos, avval mahsulot tanlang.',
        variant: 'destructive',
      });
      return;
    }

    setCreatingOrder(true);
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const serviceFee = serviceType === 'waiter-service' ? subtotal * 0.10 : 0;
    const total = subtotal + serviceFee;
    const orderNumber = pendingOrderNumber ?? Math.floor(100 + Math.random() * 900);
    const paymentStatus = method === 'cash' ? 'unpaid' : 'paid';

    const order: Order = {
      id: currentOrder?.id ?? '',
      orderNumber,
      items: cart.map(item => ({
        ...item,
        quantity: Number(item.quantity ?? 1),
      })),
      subtotal,
      serviceFee,
      total,
      serviceType,
      createdAt: currentOrder?.createdAt ?? new Date(),
      status: 'new',
      orderType,
      paymentMethod: method,
      paymentStatus,
      ...(orderType === 'dine-in' && tableNumber ? { tableNumber } : {}),
    };

    try {
      let savedOrder: Order;
      if (currentOrder?.id && currentOrder.orderNumber === orderNumber) {
        await updateOrderPaymentStatus(currentOrder.id, paymentStatus);
        savedOrder = { ...currentOrder, paymentStatus };
      } else {
        savedOrder = await saveOrder(order);
      }

      setCurrentOrder(savedOrder);
      setCart([]);
      setPendingOrderNumber(null);
      setScreen('confirmation');

      // Mark table as occupied if dine-in
      if (orderType === 'dine-in' && tableNumber) {
        try {
          await markTableOccupied(tableNumber, savedOrder.id);
        } catch (tableError) {
          console.error('Failed to mark table occupied:', tableError);
          // Don't fail the order creation for table marking
        }
      }
    } catch (error) {
      console.error('Failed to create order:', error);
      toast({
        title: 'Buyurtma saqlanmadi',
        description: error instanceof Error ? error.message : "Firebase sozlamalarini tekshiring va qayta urinib ko'ring.",
        variant: 'destructive',
      });
      throw error;
    } finally {
      setCreatingOrder(false);
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
            loading={creatingOrder}
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
          {(usingLocalMenu || usingLocalCategories || menuError) && (
            <div className="w-full p-4 md:p-5 mx-auto mb-4 rounded-3xl bg-secondary/40 border border-border text-sm text-foreground max-w-7xl">
              {menuError ? (
                <p>{menuError}</p>
              ) : (
                <p>
                  {usingLocalMenu ? 'Firestore menyu bo‘sh. Lokal demo menyu ishlatilmoqda.' : ''}
                  {usingLocalMenu && usingLocalCategories ? ' ' : ''}
                  {usingLocalCategories ? 'Kategoriyalar Firestore-dan olinmadi. Lokal demo kategoriyalar ishlatilmoqda.' : ''}
                </p>
              )}
            </div>
          )}

          {/* Category Sidebar */}
          <CategorySidebar
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            categories={categories}
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
