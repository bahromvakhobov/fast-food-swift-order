import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Search, UtensilsCrossed, ClipboardList, ChefHat, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MenuItem } from '@/types/kiosk';
import { menuItems as fallbackMenuItems, categories } from '@/data/menuData';
import { subscribeToFoods, createFood, updateFood, deleteFood } from '@/services/foodService';
import { seedAllDefaultData } from '@/services/seedService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdminMenuItemCard } from '@/components/admin/AdminMenuItemCard';
import { MenuItemForm } from '@/components/admin/MenuItemForm';
import { OrderHistoryTable } from '@/components/admin/OrderHistoryTable';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatPrice } from '@/lib/currency';

const Admin = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(fallbackMenuItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = subscribeToFoods(
      nextFoods => {
        if (nextFoods.length > 0) {
          setMenuItems(nextFoods);
        } else {
          setMenuItems(fallbackMenuItems);
        }
        setLoading(false);
        setError(null);
      },
      subscriptionError => {
        console.error('Admin menu subscription failed:', subscriptionError);
        setMenuItems(fallbackMenuItems);
        setError("Menyu yuklanmadi. Keshdan foydalanilmoqda.");
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddItem = async (item: Omit<MenuItem, 'id'>) => {
    try {
      await createFood(item);
      setIsFormOpen(false);
      toast({
        title: "Mahsulot qo'shildi",
        description: `${item.name} menyuga qo'shildi.`,
      });
    } catch (error) {
      console.error('Failed to add food:', error);
      toast({
        title: "Mahsulot qo'shilmadi",
        description: "Firebase sozlamalarini tekshiring.",
        variant: 'destructive',
      });
    }
  };

  const handleEditItem = async (item: Omit<MenuItem, 'id'>) => {
    if (!editingItem) return;
    try {
      await updateFood(editingItem.id, item);
      setEditingItem(null);
      toast({
        title: 'Mahsulot yangilandi',
        description: `${item.name} yangilandi.`,
      });
    } catch (error) {
      console.error('Failed to update food:', error);
      toast({
        title: 'Mahsulot yangilanmadi',
        description: "Firebase sozlamalarini tekshiring.",
        variant: 'destructive',
      });
    }
  };

  const handleDeleteItem = async (id: string) => {
    const item = menuItems.find(i => i.id === id);
    try {
      await deleteFood(id);
      toast({
        title: "Mahsulot o'chirildi",
        description: `${item?.name} menyudan olib tashlandi.`,
      });
    } catch (error) {
      console.error('Failed to delete food:', error);
      toast({
        title: "Mahsulot o'chirilmadi",
        description: "Firebase sozlamalarini tekshiring.",
        variant: 'destructive',
      });
    }
  };

  const handleToggleAvailability = async (id: string) => {
    const item = menuItems.find(i => i.id === id);
    if (!item) return;
    try {
      await updateFood(id, { available: !item.available });
      toast({
        title: item.available ? 'Mavjud emas' : 'Mavjud',
        description: `${item.name} endi ${item.available ? 'mavjud emas' : 'mavjud'}.`,
      });
    } catch (error) {
      console.error('Failed to toggle availability:', error);
      toast({
        title: 'Holat o\'zgartirilmadi',
        description: "Firebase sozlamalarini tekshiring.",
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div className="flex items-center gap-3 md:gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Admin Panel</h1>
              <p className="text-muted-foreground text-sm md:text-base">Menyu va buyurtmalarni boshqaring</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={async () => {
              try {
                await seedAllDefaultData();
                toast({
                  title: 'Demo maʼlumotlar qoʻshildi',
                  description: 'Oldingi menyu, kategoriya va stollar Firestore-ga qoʻshildi.',
                });
              } catch (error) {
                console.error('Failed to seed demo data:', error);
                toast({
                  title: 'Demo maʼlumotlar qoʻshilmadi',
                  description: 'Firebase sozlamalarini tekshiring.',
                  variant: 'destructive',
                });
              }
            }} className="hidden sm:flex gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-5 h-5" />
              Seed demo data
            </Button>
            <Button asChild className="hidden sm:flex gap-2 rounded-xl">
              <Link to="/kitchen">
                <ChefHat className="w-5 h-5" />
                Oshxona
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden rounded-xl"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden mb-4 p-4 bg-card border border-border rounded-xl">
            <Button asChild className="w-full gap-2 rounded-xl">
              <Link to="/kitchen">
                <ChefHat className="w-5 h-5" />
                Oshxona ko'rinishi
              </Link>
            </Button>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="menu" className="space-y-4 md:space-y-6">
          <TabsList className="bg-card border border-border rounded-xl p-1 w-full sm:w-auto">
            <TabsTrigger value="menu" className="flex-1 sm:flex-none rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <UtensilsCrossed className="w-4 h-4" />
              <span className="hidden sm:inline">Menyu</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex-1 sm:flex-none rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">Buyurtmalar</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="menu" className="space-y-4 md:space-y-6">
            {/* Add Item Button */}
            <div className="flex justify-end">
              <Button
                onClick={() => setIsFormOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-2"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Mahsulot qo'shish</span>
                <span className="sm:hidden">Qo'shish</span>
              </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Qidirish..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-card border-border rounded-xl"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory('all')}
                  className="rounded-xl whitespace-nowrap"
                  size="sm"
                >
                  Hammasi
                </Button>
                {categories.map(cat => (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.id ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory(cat.id)}
                    className="rounded-xl whitespace-nowrap gap-2"
                    size="sm"
                  >
                    <span>{cat.icon}</span>
                    {cat.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="bg-card border border-border rounded-2xl p-3 md:p-4">
                <p className="text-muted-foreground text-xs md:text-sm">Jami mahsulotlar</p>
                <p className="text-xl md:text-2xl font-bold text-foreground">{menuItems.length}</p>
              </div>
              <div className="bg-card border border-border rounded-2xl p-3 md:p-4">
                <p className="text-muted-foreground text-xs md:text-sm">Mavjud</p>
                <p className="text-xl md:text-2xl font-bold text-green-500">
                  {menuItems.filter(i => i.available).length}
                </p>
              </div>
              <div className="bg-card border border-border rounded-2xl p-3 md:p-4">
                <p className="text-muted-foreground text-xs md:text-sm">Mavjud emas</p>
                <p className="text-xl md:text-2xl font-bold text-red-500">
                  {menuItems.filter(i => !i.available).length}
                </p>
              </div>
              <div className="bg-card border border-border rounded-2xl p-3 md:p-4">
                <p className="text-muted-foreground text-xs md:text-sm">Kategoriyalar</p>
                <p className="text-xl md:text-2xl font-bold text-foreground">{categories.length}</p>
              </div>
            </div>

            {/* Items Grid */}
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4"
            >
              <AnimatePresence mode="popLayout">
                {filteredItems.map(item => (
                  <AdminMenuItemCard
                    key={item.id}
                    item={item}
                    onEdit={() => setEditingItem(item)}
                    onDelete={() => handleDeleteItem(item.id)}
                    onToggleAvailability={() => handleToggleAvailability(item.id)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>

            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Mahsulotlar topilmadi</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders">
            <OrderHistoryTable />
          </TabsContent>
        </Tabs>

        {/* Add/Edit Form Modal */}
        <AnimatePresence>
          {(isFormOpen || editingItem) && (
            <MenuItemForm
              item={editingItem}
              onSubmit={editingItem ? handleEditItem : handleAddItem}
              onClose={() => {
                setIsFormOpen(false);
                setEditingItem(null);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Admin;
