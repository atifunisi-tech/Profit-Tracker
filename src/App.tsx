/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Plus, 
  List, 
  Search, 
  Filter, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  ArrowUpRight, 
  ArrowDownRight,
  MoreVertical,
  Trash2,
  Edit2,
  ExternalLink,
  Download,
  Copy,
  X,
  ChevronRight,
  Sun,
  Moon,
  Palette,
  Package,
  Maximize2
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { format } from 'date-fns';
import { useOrders } from './hooks/useOrders';
import { useProducts } from './hooks/useProducts';
import { Order, Product, MARKETPLACES, CURRENCIES, MARKETPLACE_FEES, THEMES, ThemeType } from './types';
import { cn, formatCurrency, calculateOrderMetrics } from './utils';
import { setupGlobalClickSound } from './utils/sound';

export default function App() {
  const { orders, stats, loading: ordersLoading, addOrder, updateOrder, deleteOrder } = useOrders();
  const { products, loading: productsLoading, addProduct, updateProduct, deleteProduct } = useProducts();
  
  useEffect(() => {
    const cleanup = setupGlobalClickSound();
    return cleanup;
  }, []);
  const [view, setView] = useState<'dashboard' | 'orders' | 'products'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMarketplace, setFilterMarketplace] = useState('All');
  const [sortBy, setSortBy] = useState<'date' | 'profit' | 'price'>('date');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedStat, setSelectedStat] = useState<'revenue' | 'profit' | 'orders' | 'monthly' | 'fees' | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('light');
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductDeleteConfirmOpen, setIsProductDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [mobileCardScale, setMobileCardScale] = useState(1);
  const [isResizerOpen, setIsResizerOpen] = useState(false);

  const theme = useMemo(() => THEMES.find(t => t.id === currentTheme) || THEMES[0], [currentTheme]);

  // Filtered and sorted orders
  const filteredOrders = useMemo(() => {
    return orders
      .filter(order => {
        const matchesSearch = order.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            order.order_id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesMarketplace = filterMarketplace === 'All' || order.marketplace === filterMarketplace;
        return matchesSearch && matchesMarketplace;
      })
      .sort((a, b) => {
        if (sortBy === 'date') return new Date(b.date).getTime() - new Date(a.date).getTime();
        if (sortBy === 'profit') {
          const profitA = calculateOrderMetrics(a).netProfit;
          const profitB = calculateOrderMetrics(b).netProfit;
          return profitB - profitA;
        }
        if (sortBy === 'price') return b.sale_price - a.sale_price;
        return 0;
      });
  }, [orders, searchQuery, filterMarketplace, sortBy]);

  const handleExport = () => {
    const headers = [
      'ID', 'Product Name', 'Order ID', 'Customer', 'Marketplace', 'Date', 
      'Source Price', 'Shipping', 'Tax', 'Other Costs', 
      'Sale Price', 'Marketplace Fees', 'Transaction Fees', 'Ads', 'Other Fees',
      'Total Cost', 'Total Fees', 'Net Profit', 'Margin %'
    ];

    const rows = orders.map(order => {
      const metrics = calculateOrderMetrics(order);
      return [
        order.id, order.product_name, order.order_id, order.customer_name || '', order.marketplace, order.date,
        order.source_price, order.shipping_cost, order.tax_cost, order.other_costs,
        order.sale_price, order.marketplace_fees, order.transaction_fees, order.advertising_cost, order.other_fees,
        metrics.totalCost, metrics.totalFees, metrics.netProfit, metrics.profitMargin.toFixed(2)
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDuplicate = (order: Order) => {
    const { id, ...rest } = order;
    const duplicated = {
      ...rest,
      order_id: `${rest.order_id}-COPY`,
      date: new Date().toISOString()
    };
    addOrder(duplicated);
  };

  const handleBackup = () => {
    const data = JSON.stringify(orders, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `marketprofit_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedOrders = JSON.parse(event.target?.result as string);
        if (Array.isArray(importedOrders)) {
          // Simple validation: check if first item has product_name
          if (importedOrders.length === 0 || importedOrders[0].product_name) {
            // We need a way to replace all orders. 
            // For now, we'll just add them one by one or update the hook.
            // Let's assume the user wants to append or replace? Usually restore means replace.
            if (confirm('This will replace all current orders. Are you sure?')) {
              localStorage.setItem('marketplace_orders', JSON.stringify(importedOrders));
              window.location.reload(); // Simplest way to refresh state from localStorage
            }
          }
        }
      } catch (err) {
        alert('Invalid backup file');
      }
    };
    reader.readAsText(file);
  };

  // Calculate stats based on filtered orders
  const filteredStats = useMemo(() => {
    return filteredOrders.reduce((acc, order) => {
      const metrics = calculateOrderMetrics(order);
      
      acc.totalOrders += 1;
      acc.totalRevenue += order.sale_price;
      acc.totalCosts += metrics.totalCost;
      acc.totalFees += metrics.totalFees;
      acc.totalProfit += metrics.netProfit;

      // Monthly profit
      const orderDate = new Date(order.date);
      const now = new Date();
      if (orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear()) {
        acc.profitThisMonth += metrics.netProfit;
      }

      return acc;
    }, {
      totalOrders: 0,
      totalRevenue: 0,
      totalCosts: 0,
      totalFees: 0,
      totalProfit: 0,
      profitThisMonth: 0
    });
  }, [filteredOrders]);

  return (
    <div className={cn("min-h-screen transition-colors duration-300", theme.bg, theme.text)}>
      {/* Sidebar / Navigation */}
      <nav className={cn(
        "fixed left-0 top-0 bottom-0 w-20 md:w-64 border-r flex flex-col transition-all duration-500 z-40",
        theme.card, theme.border, theme.id === 'light' ? "shadow-[4px_0_24px_rgba(0,0,0,0.02)]" : "shadow-[4px_0_24px_rgba(0,0,0,0.2)]"
      )}>
        <div className="p-4 md:p-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-500 hover:rotate-12" 
               style={{ 
                 backgroundColor: theme.accentColor,
                 boxShadow: `0 10px 15px -3px ${theme.accentColor}33`
               }}>
            <TrendingUp className="text-white" size={24} />
          </div>
          <h1 className="hidden md:block text-xl font-bold tracking-tighter">MarketProfit</h1>
        </div>

        <div className="flex-1 px-3 md:px-4 space-y-2 py-4">
          <NavButton 
            active={view === 'dashboard'} 
            onClick={() => setView('dashboard')}
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            theme={theme}
          />
          <NavButton 
            active={view === 'orders'} 
            onClick={() => setView('orders')}
            icon={<ShoppingCart size={20} />}
            label="Orders"
            theme={theme}
          />
          <NavButton 
            active={view === 'products'} 
            onClick={() => setView('products')}
            icon={<Package size={20} />}
            label="Catalog"
            theme={theme}
          />
        </div>

        <div className="p-4 md:p-6 border-t space-y-4" style={{ borderColor: theme.id === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }}>
          <div className="relative">
            <button 
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              className={cn(
                "w-full p-3 rounded-xl flex items-center justify-center md:justify-start gap-3 transition-all duration-300 group",
                theme.id === 'light' ? "hover:bg-black/5" : "hover:bg-white/5",
                isThemeMenuOpen && (theme.id === 'light' ? "bg-black/5" : "bg-white/10")
              )}
            >
              <div className="transition-transform duration-500 group-hover:rotate-180">
                <Palette size={20} style={{ color: theme.accentColor }} />
              </div>
              <span className="hidden md:block font-semibold">Themes</span>
            </button>
            
            <AnimatePresence>
              {isThemeMenuOpen && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsThemeMenuOpen(false)}
                    className="fixed inset-0 z-40"
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: 20 }}
                    className={cn(
                      "absolute bottom-full left-0 mb-2 w-56 rounded-2xl shadow-2xl border p-2 z-50 overflow-hidden",
                      theme.card, theme.border
                    )}
                  >
                    <div className="grid grid-cols-1 gap-1">
                      {THEMES.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            setCurrentTheme(t.id);
                            setIsThemeMenuOpen(false);
                          }}
                          className={cn(
                            "flex items-center justify-between p-2.5 rounded-xl transition-all text-sm font-medium",
                            currentTheme === t.id 
                              ? (theme.id === 'light' ? "bg-black/5" : "bg-white/10") 
                              : (theme.id === 'light' ? "hover:bg-black/5" : "hover:bg-white/5")
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: t.accentColor }} />
                            {t.name}
                          </div>
                          {currentTheme === t.id && (
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.accentColor }} />
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <button 
            onClick={() => {
              setEditingOrder(null);
              setIsFormOpen(true);
            }}
            className={cn(
              "w-full text-white p-3 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all duration-300 active:scale-95 hover:brightness-110",
            )}
            style={{ 
              backgroundColor: theme.accentColor,
              boxShadow: `0 10px 15px -3px ${theme.accentColor}33`
            }}
          >
            <Plus size={20} />
            <span className="hidden md:block font-semibold">New Order</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pl-20 md:pl-64 min-h-screen">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <AnimatePresence mode="wait">
            {view === 'dashboard' ? (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Overview</h2>
                    <p className={cn("text-xs md:text-sm", theme.muted)}>Track your marketplace performance</p>
                  </div>
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="relative">
                      <select 
                        value={filterMarketplace}
                        onChange={(e) => setFilterMarketplace(e.target.value)}
                        className={cn(
                          "appearance-none pl-8 md:pl-10 pr-6 md:pr-8 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium outline-none focus:ring-2 transition-all cursor-pointer",
                          theme.id === 'light' ? "bg-white border-black/5 text-[#1A1A1A] shadow-sm" : cn(theme.card, theme.border, theme.text)
                        )}
                        style={{ '--tw-ring-color': `${theme.accentColor}33` } as any}
                      >
                        <option value="All">All Marketplaces</option>
                        {MARKETPLACES.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <Filter className={cn("absolute left-2.5 top-1/2 -translate-y-1/2 opacity-50", "md:w-4 md:h-4")} size={14} />
                    </div>
                    <button 
                      onClick={handleExport}
                      className={cn(
                        "flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all border",
                        theme.id === 'light' ? "bg-white hover:bg-gray-50 border-black/5" : cn(theme.card, theme.border, "hover:bg-white/5")
                      )}
                    >
                      <Download size={16} className="md:w-[18px] md:h-[18px]" />
                      Export CSV
                    </button>
                  </div>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard 
                    label="Total Revenue" 
                    value={formatCurrency(filteredStats.totalRevenue)} 
                    icon={<DollarSign style={{ color: theme.accentColor }} />}
                    onClick={() => setSelectedStat('revenue')}
                    theme={theme}
                    scale={mobileCardScale}
                  />
                  <StatCard 
                    label="Net Profit" 
                    value={formatCurrency(filteredStats.totalProfit)} 
                    icon={<TrendingUp className="text-blue-500" />}
                    trend={filteredStats.totalRevenue ? ((filteredStats.totalProfit / filteredStats.totalRevenue) * 100).toFixed(1) + '%' : '0%'}
                    onClick={() => setSelectedStat('profit')}
                    theme={theme}
                    scale={mobileCardScale}
                  />
                  <StatCard 
                    label="Total Orders" 
                    value={filteredStats.totalOrders} 
                    icon={<ShoppingCart style={{ color: theme.accentColor }} />}
                    onClick={() => setSelectedStat('orders')}
                    theme={theme}
                    scale={mobileCardScale}
                  />
                  <StatCard 
                    label="Profit (Month)" 
                    value={formatCurrency(filteredStats.profitThisMonth)} 
                    icon={<ArrowUpRight style={{ color: theme.accentColor }} />}
                    onClick={() => setSelectedStat('monthly')}
                    theme={theme}
                    scale={mobileCardScale}
                  />
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className={cn(
                    "lg:col-span-2 p-6 rounded-2xl border",
                    theme.card, theme.border, theme.id === 'light' && "shadow-sm"
                  )}>
                    <h3 className="font-semibold mb-6">Profit Trend</h3>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={filteredOrders.slice().reverse()}>
                          <defs>
                            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={theme.accentColor} stopOpacity={0.3}/>
                              <stop offset="95%" stopColor={theme.accentColor} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.id === 'light' ? "#00000010" : "#ffffff10"} />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(str) => format(new Date(str), 'MMM d')}
                            stroke={theme.id === 'light' ? "#00000050" : "#ffffff50"}
                            fontSize={12}
                          />
                          <YAxis 
                            stroke={theme.id === 'light' ? "#00000050" : "#ffffff50"}
                            fontSize={12}
                            tickFormatter={(val) => `$${val}`}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: theme.id === 'light' ? '#FFFFFF' : theme.card.replace('bg-', ''),
                              borderColor: theme.id === 'light' ? '#00000010' : '#ffffff20',
                              borderRadius: '12px',
                              color: theme.id === 'light' ? '#1A1A1A' : '#FFFFFF'
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey={(o) => calculateOrderMetrics(o).netProfit} 
                            name="Profit"
                            stroke={theme.accentColor}
                            fillOpacity={1} 
                            fill="url(#colorProfit)" 
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className={cn(
                    "p-6 rounded-2xl border",
                    theme.card, theme.border, theme.id === 'light' && "shadow-sm"
                  )}>
                    <h3 className="font-semibold mb-6">Marketplace Split</h3>
                    <div className="space-y-6">
                      {MARKETPLACES.slice(0, 5).map(m => {
                        const mOrders = orders.filter(o => o.marketplace === m);
                        const mProfit = mOrders.reduce((sum, o) => sum + calculateOrderMetrics(o).netProfit, 0);
                        const percentage = stats.totalProfit ? (mProfit / stats.totalProfit) * 100 : 0;
                        
                        return (
                          <div key={m} className="space-y-2">
                            <div className="flex justify-between text-sm font-medium">
                              <span>{m}</span>
                              <span>{percentage.toFixed(1)}%</span>
                            </div>
                            <div className={cn("h-2 rounded-full overflow-hidden", theme.id === 'light' ? "bg-gray-100" : "bg-white/5")}>
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.max(0, percentage)}%` }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: theme.accentColor }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : view === 'orders' ? (
              <motion.div 
                key="orders"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Orders</h2>
                    <p className={cn("text-xs md:text-sm", theme.muted)}>{filteredOrders.length} orders found</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    <div className="relative flex-1 md:w-64">
                      <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 opacity-50", "md:w-[18px] md:h-[18px]")} size={16} />
                      <input 
                        type="text" 
                        placeholder="Search orders..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={cn(
                          "w-full pl-9 md:pl-10 pr-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm outline-none focus:ring-2 transition-all",
                          theme.id === 'light' ? "bg-white border border-black/5 shadow-sm" : cn(theme.card, theme.border)
                        )}
                        style={{ '--tw-ring-color': `${theme.accentColor}33` } as any}
                      />
                    </div>
                    <select 
                      value={filterMarketplace}
                      onChange={(e) => setFilterMarketplace(e.target.value)}
                      className={cn(
                        "px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium outline-none focus:ring-2 transition-all cursor-pointer border",
                        theme.id === 'light' ? "bg-white border-black/5 shadow-sm" : cn(theme.card, theme.border)
                      )}
                      style={{ '--tw-ring-color': `${theme.accentColor}33` } as any}
                    >
                      <option value="All">All Marketplaces</option>
                      {MARKETPLACES.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className={cn(
                        "px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium outline-none focus:ring-2 transition-all cursor-pointer border",
                        theme.id === 'light' ? "bg-white border-black/5 shadow-sm" : cn(theme.card, theme.border)
                      )}
                      style={{ '--tw-ring-color': `${theme.accentColor}33` } as any}
                    >
                      <option value="date">Newest First</option>
                      <option value="profit">Highest Profit</option>
                      <option value="price">Highest Price</option>
                    </select>
                  </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredOrders.map((order, idx) => (
                    <OrderCard 
                      key={order.id || idx} 
                      order={order} 
                      onClick={() => setSelectedOrder(order)}
                      theme={theme}
                      scale={mobileCardScale}
                    />
                  ))}
                  {filteredOrders.length === 0 && (
                    <div className="col-span-full py-20 text-center">
                      <div className={cn("inline-flex items-center justify-center w-16 h-16 rounded-full mb-4", theme.id === 'light' ? "bg-gray-100" : "bg-white/5")}>
                        <ShoppingCart className="text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold">No orders found</h3>
                      <p className={theme.muted}>Try adjusting your search or filters</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="products"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Product Catalog</h2>
                    <p className={cn("text-xs md:text-sm", theme.muted)}>{products.length} products in your catalog</p>
                  </div>
                  <button 
                    onClick={() => {
                      setEditingProduct(null);
                      setIsProductFormOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 md:px-6 md:py-2.5 text-xs md:text-sm text-white rounded-xl font-bold shadow-lg transition-all active:scale-95"
                    style={{ 
                      backgroundColor: theme.accentColor,
                      boxShadow: `0 10px 15px -3px ${theme.accentColor}33`
                    }}
                  >
                    <Plus size={16} className="md:w-5 md:h-5" />
                    Add Product
                  </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onEdit={() => {
                        setEditingProduct(product);
                        setIsProductFormOpen(true);
                      }}
                      onDelete={() => {
                        setProductToDelete(product);
                        setIsProductDeleteConfirmOpen(true);
                      }}
                      theme={theme}
                      scale={mobileCardScale}
                    />
                  ))}
                  {products.length === 0 && (
                    <div className="col-span-full py-20 text-center">
                      <div className={cn("inline-flex items-center justify-center w-16 h-16 rounded-full mb-4", theme.id === 'light' ? "bg-gray-100" : "bg-white/5")}>
                        <Package className="text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold">Catalog is empty</h3>
                      <p className={theme.muted}>Start adding products to your catalog</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Order Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <OrderFormModal 
            order={editingOrder}
            onClose={() => {
              setIsFormOpen(false);
              setEditingOrder(null);
            }}
            onSubmit={async (data) => {
              if (editingOrder?.id) {
                await updateOrder(editingOrder.id, data);
              } else {
                await addOrder(data);
              }
              setIsFormOpen(false);
              setEditingOrder(null);
            }}
            theme={theme}
            products={products}
            onSaveProduct={addProduct}
          />
        )}
      </AnimatePresence>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailsModal 
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onEdit={() => {
              setEditingOrder(selectedOrder);
              setSelectedOrder(null);
              setIsFormOpen(true);
            }}
            onDelete={() => setIsDeleteConfirmOpen(true)}
            onDuplicate={() => {
              handleDuplicate(selectedOrder);
              setSelectedOrder(null);
            }}
            theme={theme}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteConfirmOpen && selectedOrder && (
          <ConfirmationModal 
            title="Delete Order"
            message={`Are you sure you want to delete the order for "${selectedOrder.product_name}"? This action cannot be undone.`}
            onConfirm={async () => {
              await deleteOrder(selectedOrder.id!);
              setIsDeleteConfirmOpen(false);
              setSelectedOrder(null);
            }}
            onCancel={() => setIsDeleteConfirmOpen(false)}
            theme={theme}
          />
        )}
      </AnimatePresence>

      {/* Stats Detail Modal */}
      <AnimatePresence>
        {selectedStat && (
          <StatsDetailModal 
            type={selectedStat}
            orders={orders}
            onClose={() => setSelectedStat(null)}
            theme={theme}
          />
        )}
      </AnimatePresence>

      {/* Product Form Modal */}
      <AnimatePresence>
        {isProductFormOpen && (
          <ProductFormModal 
            product={editingProduct}
            onClose={() => {
              setIsProductFormOpen(false);
              setEditingProduct(null);
            }}
            onSubmit={async (data) => {
              if (editingProduct?.id) {
                await updateProduct(editingProduct.id, data);
              } else {
                await addProduct(data);
              }
              setIsProductFormOpen(false);
              setEditingProduct(null);
            }}
            theme={theme}
          />
        )}
      </AnimatePresence>

      {/* Product Delete Confirmation Modal */}
      <AnimatePresence>
        {isProductDeleteConfirmOpen && productToDelete && (
          <ConfirmationModal 
            title="Delete Product"
            message={`Are you sure you want to delete "${productToDelete.name}" from your catalog? This will not affect existing orders.`}
            onConfirm={async () => {
              await deleteProduct(productToDelete.id);
              setIsProductDeleteConfirmOpen(false);
              setProductToDelete(null);
            }}
            onCancel={() => {
              setIsProductDeleteConfirmOpen(false);
              setProductToDelete(null);
            }}
            theme={theme}
          />
        )}
      </AnimatePresence>

      {/* Mobile Resizer FAB */}
      <div className="md:hidden fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        <AnimatePresence>
          {isResizerOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className={cn(
                "p-4 rounded-2xl shadow-2xl border mb-2 w-48",
                theme.card, theme.border
              )}
            >
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase opacity-50">Card Size</span>
                  <span className="text-xs font-bold">{Math.round(mobileCardScale * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.7" 
                  max="1.3" 
                  step="0.05"
                  value={mobileCardScale}
                  onChange={(e) => setMobileCardScale(parseFloat(e.target.value))}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-emerald-500 bg-black/10 dark:bg-white/10"
                  style={{ accentColor: theme.accentColor }}
                />
                <div className="flex justify-between text-[10px] opacity-50 font-bold">
                  <span>Small</span>
                  <span>Large</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <button 
          onClick={() => setIsResizerOpen(!isResizerOpen)}
          className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-all active:scale-95"
          style={{ 
            backgroundColor: theme.accentColor,
            boxShadow: `0 10px 25px -5px ${theme.accentColor}66`
          }}
        >
          {isResizerOpen ? <X size={24} /> : <Maximize2 size={24} />}
        </button>
      </div>
    </div>
  );
}

function StatsDetailModal({ type, orders, onClose, theme }: { type: 'revenue' | 'profit' | 'orders' | 'monthly' | 'fees', orders: Order[], onClose: () => void, theme: any }) {
  const data = useMemo(() => {
    if (type === 'monthly') {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const dailyData: Record<number, number> = {};
      orders.forEach(order => {
        const d = new Date(order.date);
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
          const day = d.getDate();
          const profit = calculateOrderMetrics(order).netProfit;
          dailyData[day] = (dailyData[day] || 0) + profit;
        }
      });

      return Object.entries(dailyData).map(([day, profit]) => ({
        name: `Day ${day}`,
        value: profit
      })).sort((a, b) => parseInt(a.name.split(' ')[1]) - parseInt(b.name.split(' ')[1]));
    }

    const marketplaceData: Record<string, number> = {};
    orders.forEach(order => {
      const m = order.marketplace;
      let val = 0;
      if (type === 'revenue') val = order.sale_price;
      if (type === 'profit') val = calculateOrderMetrics(order).netProfit;
      if (type === 'fees') val = calculateOrderMetrics(order).totalFees;
      if (type === 'orders') val = 1;
      
      marketplaceData[m] = (marketplaceData[m] || 0) + val;
    });

    return Object.entries(marketplaceData).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [type, orders]);

  const title = {
    revenue: 'Revenue Breakdown',
    profit: 'Profit Breakdown',
    fees: 'Marketplace Fees Breakdown',
    orders: 'Order Distribution',
    monthly: 'Monthly Profit Performance'
  }[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className={cn(
          "relative w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col overflow-hidden",
          theme.card, theme.text
        )}
      >
        <div className={cn("p-6 border-b flex justify-between items-center", theme.border)}>
          <h3 className="text-xl font-bold">{title}</h3>
          <button onClick={onClose} className={cn("p-2 rounded-full transition-colors", theme.id === 'light' ? "hover:bg-black/5" : "hover:bg-white/5")}>
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.id === 'light' ? "#00000010" : "#ffffff10"} />
                <XAxis 
                  dataKey="name" 
                  stroke={theme.id === 'light' ? "#00000050" : "#ffffff50"}
                  fontSize={10}
                />
                <YAxis 
                  stroke={theme.id === 'light' ? "#00000050" : "#ffffff50"}
                  fontSize={10}
                  tickFormatter={(val) => type === 'orders' ? val : `$${val}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme.id === 'light' ? '#FFFFFF' : theme.card.replace('bg-', ''),
                    borderColor: theme.id === 'light' ? '#00000010' : '#ffffff20',
                    borderRadius: '12px',
                    color: theme.id === 'light' ? '#1A1A1A' : '#FFFFFF'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={theme.accentColor}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
            <h4 className={cn("text-xs font-bold uppercase tracking-widest", theme.muted)}>Detailed List</h4>
            <div className="space-y-2">
              {data.map((item, idx) => (
                <div key={idx} className={cn(
                  "flex justify-between items-center p-4 rounded-xl",
                  theme.id === 'light' ? "bg-gray-50" : "bg-white/5"
                )}>
                  <span className="font-medium">{item.name}</span>
                  <span className="font-bold">
                    {type === 'orders' ? item.value : formatCurrency(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ConfirmationModal({ title, message, onConfirm, onCancel, theme }: { title: string, message: string, onConfirm: () => void, onCancel: () => void, theme: any }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className={cn(
          "relative w-full max-w-md rounded-3xl shadow-2xl p-8 flex flex-col items-center text-center",
          theme.card, theme.text
        )}
      >
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <Trash2 className="text-red-500" size={32} />
        </div>
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <p className={cn("text-sm mb-8", theme.muted)}>
          {message}
        </p>
        <div className="flex gap-3 w-full">
          <button 
            onClick={onCancel}
            className={cn(
              "flex-1 py-3 rounded-xl font-semibold transition-all",
              theme.id === 'light' ? "bg-gray-100 hover:bg-gray-200" : "bg-white/5 hover:bg-white/10"
            )}
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 transition-all active:scale-95"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function NavButton({ active, onClick, icon, label, theme }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, theme: any }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl transition-all duration-300 w-full group relative overflow-hidden",
        active 
          ? (theme.id === 'light' ? "bg-black/5" : "bg-white/10") 
          : (theme.id === 'light' ? "text-black/50 hover:bg-black/5" : "text-white/50 hover:bg-white/5")
      )}
    >
      {active && (
        <motion.div 
          layoutId="nav-active"
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ backgroundColor: theme.accentColor }}
        />
      )}
      <div className="transition-transform duration-300 group-hover:scale-110" style={{ color: active ? theme.accentColor : 'inherit' }}>
        {icon}
      </div>
      <span className="hidden md:block font-semibold">{label}</span>
    </button>
  );
}

function StatCard({ label, value, icon, trend, theme, onClick, scale = 1 }: { label: string, value: string | number, icon: React.ReactNode, trend?: string, theme: any, onClick?: () => void, scale?: number }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "rounded-2xl border transition-all duration-500 hover:shadow-xl hover:shadow-black/5 group",
        onClick && "cursor-pointer",
        theme.card, theme.border, theme.id === 'light' && "shadow-sm"
      )}
      style={{ 
        padding: `${1 * scale}rem`,
      }}
    >
      <div className="flex justify-between items-start" style={{ marginBottom: `${0.75 * scale}rem` }}>
        <div className={cn(
          "rounded-xl flex items-center justify-center transition-transform duration-500 group-hover:rotate-12",
          theme.id === 'light' ? "bg-gray-50" : "bg-white/5"
        )}
        style={{ 
          width: `${2 * scale}rem`, 
          height: `${2 * scale}rem` 
        }}
        >
          {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement, { size: 18 * scale, className: "md:w-5 md:h-5" } as any) : icon}
        </div>
        {trend && (
          <span className="font-bold text-emerald-500 bg-emerald-500/10 rounded-full transition-all duration-300 group-hover:px-3" style={{ fontSize: `${0.625 * scale}rem`, padding: `${0.25 * scale}rem ${0.5 * scale}rem` }}>
            {trend}
          </span>
        )}
      </div>
      <p className={cn("font-medium transition-opacity duration-300 group-hover:opacity-100", theme.muted)} style={{ fontSize: `${0.75 * scale}rem`, marginBottom: `${0.25 * scale}rem`, opacity: 0.7 }}>{label}</p>
      <h4 className="font-bold tracking-tight transition-transform duration-500 group-hover:translate-x-1" style={{ fontSize: `${1.25 * scale}rem` }}>{value}</h4>
    </div>
  );
}

function OrderCard({ order, onClick, theme, scale = 1 }: { order: Order, onClick: () => void, theme: any, key?: any, scale?: number }) {
  const { netProfit, profitMargin } = calculateOrderMetrics(order);
  const isProfitable = netProfit > 0;

  return (
    <motion.div 
      layout
      onClick={onClick}
      whileHover={{ y: -4 }}
      className={cn(
        "rounded-2xl border cursor-pointer transition-all duration-300 hover:shadow-2xl group",
        theme.card, theme.border, theme.id === 'light' ? "shadow-sm hover:shadow-black/5" : "hover:bg-white/5"
      )}
      style={{ padding: `${1 * scale}rem` }}
    >
      <div className="flex justify-between items-start" style={{ marginBottom: `${0.75 * scale}rem` }}>
        <div>
          <div className="flex items-center mb-1.5 md:mb-2" style={{ gap: `${0.5 * scale}rem` }}>
            <span className={cn(
              "uppercase tracking-widest font-bold rounded-md inline-block transition-colors duration-300 group-hover:bg-opacity-80",
              theme.id === 'light' ? "bg-gray-100 text-gray-600" : "bg-white/5 text-white/60"
            )}
            style={{ fontSize: `${0.5625 * scale}rem`, padding: `${0.125 * scale}rem ${0.375 * scale}rem` }}
            >
              {order.marketplace}
            </span>
            {order.is_returned && (
              <span className="uppercase tracking-widest font-bold rounded-md bg-red-500/10 text-red-500 inline-block animate-pulse"
              style={{ fontSize: `${0.5625 * scale}rem`, padding: `${0.125 * scale}rem ${0.375 * scale}rem` }}
              >
                Returned
              </span>
            )}
          </div>
          <h4 className="font-bold line-clamp-1 transition-all duration-300 group-hover:translate-x-1"
          style={{ color: theme.accentColor, fontSize: `${1 * scale}rem` }}
          >{order.product_name}</h4>
        </div>
        <div className="text-right">
          <p className={cn("mb-1 transition-opacity duration-300 group-hover:opacity-100", theme.muted)} style={{ fontSize: `${0.625 * scale}rem`, opacity: 0.6 }}>{format(new Date(order.date), 'MMM d')}</p>
          <div className={cn(
            "font-bold transition-transform duration-300 group-hover:scale-110 origin-right",
            isProfitable ? "text-emerald-500" : "text-red-500"
          )}
          style={{ fontSize: `${1 * scale}rem` }}
          >
            {profitMargin.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className={cn("grid grid-cols-3 border-t border-dashed transition-colors duration-300 group-hover:border-solid", theme.border)} style={{ gap: `${0.5 * scale}rem`, paddingTop: `${0.75 * scale}rem` }}>
        <div>
          <p className={cn("uppercase font-bold opacity-50", theme.muted)} style={{ fontSize: `${0.5625 * scale}rem`, marginBottom: `${0.125 * scale}rem` }}>Sale</p>
          <p className="font-bold transition-all duration-300 group-hover:text-emerald-500" style={{ fontSize: `${0.875 * scale}rem` }}>{formatCurrency(order.sale_price)}</p>
        </div>
        <div>
          <p className={cn("uppercase font-bold opacity-50", theme.muted)} style={{ fontSize: `${0.5625 * scale}rem`, marginBottom: `${0.125 * scale}rem` }}>Cost</p>
          <p className="font-bold" style={{ fontSize: `${0.875 * scale}rem` }}>{formatCurrency(calculateOrderMetrics(order).totalCost)}</p>
        </div>
        <div className="text-right">
          <p className={cn("uppercase font-bold opacity-50", theme.muted)} style={{ fontSize: `${0.5625 * scale}rem`, marginBottom: `${0.125 * scale}rem` }}>Profit</p>
          <p className={cn("font-bold transition-all duration-300 group-hover:scale-110 origin-right", isProfitable ? "text-emerald-500" : "text-red-500")} style={{ fontSize: `${0.875 * scale}rem` }}>
            {formatCurrency(netProfit)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function OrderFormModal({ order, onClose, onSubmit, theme, products, onSaveProduct }: { order: Order | null, onClose: () => void, onSubmit: (data: Order) => void, theme: any, products: Product[], onSaveProduct?: (product: Omit<Product, 'id'>) => void }) {
  const [saveToCatalog, setSaveToCatalog] = useState(false);
  const [formData, setFormData] = useState<Order>(order || {
    product_name: '',
    order_id: '',
    customer_name: '',
    marketplace: 'Amazon',
    date: new Date().toISOString(),
    notes: '',
    source_link: '',
    source_price: 0,
    shipping_cost: 0,
    tax_cost: 0,
    other_costs: 0,
    sale_price: 0,
    marketplace_fees: 0,
    transaction_fees: 0,
    advertising_cost: 0,
    other_fees: 0,
    currency: 'USD',
    is_returned: false,
    return_cost: 0
  });

  const metrics = calculateOrderMetrics(formData);

  // Auto-calculate marketplace fees
  useEffect(() => {
    const feeConfig = MARKETPLACE_FEES[formData.marketplace];
    if (feeConfig) {
      const calculatedFee = (formData.sale_price * feeConfig.percentage) + feeConfig.fixed;
      // Only update if it's a new order or if the user hasn't manually changed it significantly?
      // Actually, the prompt says "once a user selects a marketplace. app should calculate the platform fee automatically"
      // We'll update it whenever marketplace or sale price changes.
      setFormData(prev => ({
        ...prev,
        marketplace_fees: Number(calculatedFee.toFixed(2))
      }));
    }
  }, [formData.marketplace, formData.sale_price]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className={cn(
          "relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl flex flex-col",
          theme.card, theme.text
        )}
      >
        <div className={cn("p-4 md:p-6 border-b flex justify-between items-center", theme.border)}>
          <h3 className="text-lg md:text-xl font-bold">{order ? 'Edit Order' : 'New Order'}</h3>
          <button onClick={onClose} className={cn("p-2 rounded-full transition-colors", theme.id === 'light' ? "hover:bg-black/5" : "hover:bg-white/5")}>
            <X size={18} className="md:w-5 md:h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-8">
          {/* Section: Product Selection */}
          {!order && products.length > 0 && (
            <section className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-widest" style={{ color: theme.accentColor }}>Select from Catalog</h4>
              <div className="space-y-1">
                <select 
                  onChange={(e) => {
                    const product = products.find(p => p.id === e.target.value);
                    if (product) {
                      setFormData(prev => ({
                        ...prev,
                        product_name: product.name,
                        source_price: product.source_price,
                        sale_price: product.sale_price,
                        source_link: product.source_link || '',
                        marketplace_fees: product.marketplace_fees || prev.marketplace_fees
                      }));
                    }
                  }}
                  className={cn("w-full p-3 rounded-xl border outline-none focus:ring-2 transition-all", theme.id === 'light' ? "bg-gray-50 border-black/5" : "bg-white/5 border-white/10")}
                  style={{ '--tw-ring-color': `${theme.accentColor}33` } as any}
                >
                  <option value="">-- Select a product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({formatCurrency(p.sale_price)})</option>
                  ))}
                </select>
              </div>
            </section>
          )}

          {/* Section: Basic Info */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold uppercase tracking-widest" style={{ color: theme.accentColor }}>Basic Information</h4>
              {!order && (
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="saveToCatalog"
                    checked={saveToCatalog}
                    onChange={e => setSaveToCatalog(e.target.checked)}
                    className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="saveToCatalog" className="text-xs font-semibold cursor-pointer opacity-70">Save to Catalog</label>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold opacity-50">Product Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.product_name}
                  onChange={e => setFormData({...formData, product_name: e.target.value})}
                  className={cn("w-full p-3 rounded-xl border outline-none focus:ring-2 transition-all", theme.id === 'light' ? "bg-gray-50 border-black/5" : "bg-white/5 border-white/10")}
                  style={{ '--tw-ring-color': `${theme.accentColor}33` } as any}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold opacity-50">Order ID</label>
                <input 
                  type="text" 
                  required
                  value={formData.order_id}
                  onChange={e => setFormData({...formData, order_id: e.target.value})}
                  className={cn("w-full p-3 rounded-xl border outline-none focus:ring-2 transition-all", theme.id === 'light' ? "bg-gray-50 border-black/5" : "bg-white/5 border-white/10")}
                  style={{ '--tw-ring-color': `${theme.accentColor}33` } as any}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold opacity-50">Marketplace</label>
                <select 
                  value={formData.marketplace}
                  onChange={e => setFormData({...formData, marketplace: e.target.value})}
                  className={cn("w-full p-3 rounded-xl border outline-none focus:ring-2 transition-all", theme.id === 'light' ? "bg-gray-50 border-black/5" : "bg-white/5 border-white/10")}
                  style={{ '--tw-ring-color': `${theme.accentColor}33` } as any}
                >
                  {MARKETPLACES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold opacity-50">Customer Name (Optional)</label>
                <input 
                  type="text" 
                  value={formData.customer_name}
                  onChange={e => setFormData({...formData, customer_name: e.target.value})}
                  className={cn("w-full p-3 rounded-xl border outline-none focus:ring-2 transition-all", theme.id === 'light' ? "bg-gray-50 border-black/5" : "bg-white/5 border-white/10")}
                  style={{ '--tw-ring-color': `${theme.accentColor}33` } as any}
                />
              </div>
            </div>
          </section>

          {/* Section: Sourcing */}
          <section className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest" style={{ color: theme.accentColor }}>Sourcing Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold opacity-50">Source Product Link</label>
                <input 
                  type="url" 
                  value={formData.source_link}
                  onChange={e => setFormData({...formData, source_link: e.target.value})}
                  className={cn("w-full p-3 rounded-xl border outline-none focus:ring-2 transition-all", theme.id === 'light' ? "bg-gray-50 border-black/5" : "bg-white/5 border-white/10")}
                  style={{ '--tw-ring-color': `${theme.accentColor}33` } as any}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold opacity-50">Source Price</label>
                <input 
                  type="number" 
                  value={formData.source_price}
                  onChange={e => setFormData({...formData, source_price: parseFloat(e.target.value) || 0})}
                  className={cn("w-full p-3 rounded-xl border outline-none focus:ring-2 transition-all", theme.id === 'light' ? "bg-gray-50 border-black/5" : "bg-white/5 border-white/10")}
                  style={{ '--tw-ring-color': `${theme.accentColor}33` } as any}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold opacity-50">Shipping Cost</label>
                <input 
                  type="number" 
                  value={formData.shipping_cost}
                  onChange={e => setFormData({...formData, shipping_cost: parseFloat(e.target.value) || 0})}
                  className={cn("w-full p-3 rounded-xl border outline-none focus:ring-2 transition-all", theme.id === 'light' ? "bg-gray-50 border-black/5" : "bg-white/5 border-white/10")}
                  style={{ '--tw-ring-color': `${theme.accentColor}33` } as any}
                />
              </div>
            </div>
          </section>

          {/* Section: Selling */}
          <section className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest" style={{ color: theme.accentColor }}>Selling Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold opacity-50">Sale Price</label>
                <input 
                  type="number" 
                  value={formData.sale_price}
                  onChange={e => setFormData({...formData, sale_price: parseFloat(e.target.value) || 0})}
                  className={cn("w-full p-3 rounded-xl border outline-none focus:ring-2 transition-all", theme.id === 'light' ? "bg-gray-50 border-black/5" : "bg-white/5 border-white/10")}
                  style={{ '--tw-ring-color': `${theme.accentColor}33` } as any}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold opacity-50">Marketplace Fees</label>
                <input 
                  type="number" 
                  value={formData.marketplace_fees}
                  onChange={e => setFormData({...formData, marketplace_fees: parseFloat(e.target.value) || 0})}
                  className={cn("w-full p-3 rounded-xl border outline-none focus:ring-2 transition-all", theme.id === 'light' ? "bg-gray-50 border-black/5" : "bg-white/5 border-white/10")}
                  style={{ '--tw-ring-color': `${theme.accentColor}33` } as any}
                />
              </div>
            </div>
          </section>

          {/* Section: Returns */}
          <section className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest text-red-500">Returns</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-red-500/30">
                <input 
                  type="checkbox" 
                  id="is_returned"
                  checked={formData.is_returned}
                  onChange={e => setFormData({...formData, is_returned: e.target.checked})}
                  className="w-5 h-5 rounded accent-red-500 cursor-pointer"
                />
                <label htmlFor="is_returned" className="text-sm font-semibold cursor-pointer">Mark as Returned</label>
              </div>
              {formData.is_returned && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold opacity-50">Return Cost (Shipping/Restocking/etc)</label>
                  <input 
                    type="number" 
                    value={formData.return_cost}
                    onChange={e => setFormData({...formData, return_cost: parseFloat(e.target.value) || 0})}
                    className={cn("w-full p-3 rounded-xl border outline-none focus:ring-2 transition-all ring-red-500/20", theme.id === 'light' ? "bg-red-50 border-red-100" : "bg-red-500/5 border-red-500/20")}
                  />
                </div>
              )}
            </div>
          </section>

          {/* Live Calculations Preview */}
          <div className={cn(
            "p-6 rounded-2xl border flex flex-wrap gap-8 justify-between items-center",
            theme.id === 'light' ? "bg-emerald-50 border-emerald-100" : "bg-white/5 border-white/10"
          )}>
            <div>
              <p className="text-xs font-bold uppercase opacity-50 mb-1">Total Cost</p>
              <p className="text-xl font-bold">{formatCurrency(metrics.totalCost)}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase opacity-50 mb-1">Total Fees</p>
              <p className="text-xl font-bold">{formatCurrency(metrics.totalFees)}</p>
            </div>
            {formData.is_returned && (
              <div>
                <p className="text-xs font-bold uppercase text-red-500 mb-1">Return Cost</p>
                <p className="text-xl font-bold text-red-500">{formatCurrency(metrics.returnCost)}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-bold uppercase opacity-50 mb-1">Net Profit</p>
              <p className={cn("text-2xl font-bold", metrics.netProfit > 0 ? "text-emerald-500" : "text-red-500")}>
                {formatCurrency(metrics.netProfit)}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase opacity-50 mb-1">Margin</p>
              <p className="text-xl font-bold">{metrics.profitMargin.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className={cn("p-6 border-t flex justify-end gap-3", theme.border)}>
          <button 
            onClick={onClose}
            className={cn("px-6 py-2 rounded-xl font-semibold transition-all", theme.id === 'light' ? "hover:bg-black/5" : "hover:bg-white/5")}
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              if (saveToCatalog && onSaveProduct) {
                onSaveProduct({
                  name: formData.product_name,
                  source_price: formData.source_price,
                  sale_price: formData.sale_price,
                  source_link: formData.source_link,
                  marketplace_fees: formData.marketplace_fees,
                  sku: '',
                  category: ''
                });
              }
              onSubmit(formData);
            }}
            className={cn(
              "px-8 py-2 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95",
            )}
            style={{ 
              backgroundColor: theme.accentColor,
              boxShadow: `0 10px 15px -3px ${theme.accentColor}33`
            }}
          >
            {order ? 'Save Changes' : 'Create Order'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function OrderDetailsModal({ order, onClose, onEdit, onDelete, onDuplicate, theme }: { order: Order, onClose: () => void, onEdit: () => void, onDelete: () => void, onDuplicate: () => void, theme: any }) {
  const metrics = calculateOrderMetrics(order);
  const isProfitable = metrics.netProfit > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className={cn(
          "relative w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col",
          theme.card, theme.text
        )}
      >
        <div className={cn("p-4 md:p-6 border-b flex justify-between items-center", theme.border)}>
          <div className="flex items-center gap-2 md:gap-3">
            <div className={cn(
              "w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center",
              theme.id === 'light' ? "bg-emerald-500/10" : "bg-white/5"
            )}>
              <ShoppingCart style={{ color: theme.accentColor }} size={16} className="md:w-5 md:h-5" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold">Order Details</h3>
              <p className={cn("text-[10px] md:text-xs", theme.muted)}>ID: {order.order_id}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <button onClick={onDuplicate} title="Duplicate" className={cn("p-1.5 md:p-2 rounded-lg transition-colors text-blue-500", theme.id === 'light' ? "hover:bg-black/5" : "hover:bg-white/5")}>
              <Copy size={16} className="md:w-[18px] md:h-[18px]" />
            </button>
            <button onClick={onEdit} title="Edit" className={cn("p-1.5 md:p-2 rounded-lg transition-colors text-orange-500", theme.id === 'light' ? "hover:bg-black/5" : "hover:bg-white/5")}>
              <Edit2 size={16} className="md:w-[18px] md:h-[18px]" />
            </button>
            <button onClick={onDelete} title="Delete" className={cn("p-1.5 md:p-2 rounded-lg transition-colors text-red-500", theme.id === 'light' ? "hover:bg-black/5" : "hover:bg-white/5")}>
              <Trash2 size={16} className="md:w-[18px] md:h-[18px]" />
            </button>
            <button onClick={onClose} className={cn("p-1.5 md:p-2 rounded-full transition-colors ml-1 md:ml-2", theme.id === 'light' ? "hover:bg-black/5" : "hover:bg-white/5")}>
              <X size={18} className="md:w-5 md:h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 md:p-8 space-y-6 md:space-y-8 overflow-y-auto max-h-[75vh] md:max-h-[70vh]">
          <div className="grid grid-cols-2 gap-4 md:gap-8">
            <div className="space-y-1">
              <p className="text-[10px] md:text-xs font-bold uppercase opacity-50">Product</p>
              <p className="text-base md:text-lg font-bold">{order.product_name}</p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-[10px] md:text-xs font-bold uppercase opacity-50">Marketplace</p>
              <p className="text-base md:text-lg font-bold">{order.marketplace}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] md:text-xs font-bold uppercase opacity-50">Customer</p>
              <p className="text-sm md:text-base font-semibold">{order.customer_name || 'N/A'}</p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-[10px] md:text-xs font-bold uppercase opacity-50">Date</p>
              <p className="text-sm md:text-base font-semibold">{format(new Date(order.date), 'MMM d, yyyy')}</p>
            </div>
          </div>

          {order.is_returned && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center text-white">
                  <ArrowDownRight size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-red-500">Order Returned</p>
                  <p className="text-xs opacity-70">Return costs deducted from profit</p>
                </div>
              </div>
              <p className="text-lg font-bold text-red-500">{formatCurrency(order.return_cost || 0)}</p>
            </div>
          )}

          <div className={cn(
            "p-6 rounded-2xl grid grid-cols-2 gap-6",
            theme.id === 'light' ? "bg-gray-50" : "bg-white/5"
          )}>
            <div className="space-y-4">
              <h4 className={cn("text-xs font-bold uppercase tracking-widest", theme.muted)}>Source Breakdown</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Price</span>
                  <span className="font-semibold">{formatCurrency(order.source_price)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span className="font-semibold">{formatCurrency(order.shipping_cost)}</span>
                </div>
                <div className={cn("flex justify-between text-sm border-t pt-2", theme.border)}>
                  <span className="font-bold">Total Cost</span>
                  <span className="font-bold">{formatCurrency(metrics.totalCost)}</span>
                </div>
              </div>
              {order.source_link && (
                <a 
                  href={order.source_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs text-blue-500 hover:underline font-bold"
                >
                  <ExternalLink size={14} />
                  View Source Link
                </a>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest opacity-50">Sale Breakdown</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sale Price</span>
                  <span className="font-semibold">{formatCurrency(order.sale_price)}</span>
                </div>
                <div className="space-y-1 pl-2 border-l-2 border-white/5">
                  <div className="flex justify-between text-[11px] opacity-70">
                    <span>Platform Fees</span>
                    <span>{formatCurrency(order.marketplace_fees)}</span>
                  </div>
                  {order.transaction_fees > 0 && (
                    <div className="flex justify-between text-[11px] opacity-70">
                      <span>Transaction Fees</span>
                      <span>{formatCurrency(order.transaction_fees)}</span>
                    </div>
                  )}
                  {order.advertising_cost > 0 && (
                    <div className="flex justify-between text-[11px] opacity-70">
                      <span>Ads Cost</span>
                      <span>{formatCurrency(order.advertising_cost)}</span>
                    </div>
                  )}
                  {order.other_fees > 0 && (
                    <div className="flex justify-between text-[11px] opacity-70">
                      <span>Other Fees</span>
                      <span>{formatCurrency(order.other_fees)}</span>
                    </div>
                  )}
                  {order.is_returned && (
                    <div className="flex justify-between text-[11px] text-red-500 font-bold">
                      <span>Return Cost</span>
                      <span>{formatCurrency(order.return_cost || 0)}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between text-sm border-t border-white/10 pt-2">
                  <span className="font-bold">Net Profit</span>
                  <span className={cn("font-bold", isProfitable ? "text-emerald-500" : "text-red-500")}>
                    {formatCurrency(metrics.netProfit)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {order.notes && (
            <div className="space-y-2">
              <p className={cn("text-xs font-bold uppercase", theme.muted)}>Notes</p>
              <p className={cn("p-4 rounded-xl text-sm italic", theme.id === 'light' ? "bg-gray-50" : "bg-white/5")}>
                "{order.notes}"
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function ProductCard({ product, onEdit, onDelete, theme, scale = 1 }: { product: Product, onEdit: () => void, onDelete: () => void, theme: any, key?: any, scale?: number }) {
  return (
    <motion.div 
      layout
      whileHover={{ y: -4 }}
      className={cn(
        "rounded-2xl border transition-all duration-300 hover:shadow-2xl group",
        theme.card, theme.border, theme.id === 'light' ? "shadow-sm hover:shadow-black/5" : "hover:bg-white/5"
      )}
      style={{ padding: `${1 * scale}rem` }}
    >
      <div className="flex justify-between items-start" style={{ marginBottom: `${0.75 * scale}rem` }}>
        <div className={cn(
          "rounded-xl flex items-center justify-center transition-transform duration-500 group-hover:rotate-12",
          theme.id === 'light' ? "bg-gray-50" : "bg-white/5"
        )}
        style={{ width: `${2 * scale}rem`, height: `${2 * scale}rem` }}
        >
          <Package style={{ color: theme.accentColor }} size={18 * scale} className="md:w-5 md:h-5" />
        </div>
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ gap: `${0.25 * scale}rem` }}>
          <button onClick={onEdit} className={cn("rounded-lg transition-colors text-blue-500", theme.id === 'light' ? "hover:bg-black/5" : "hover:bg-white/5")} style={{ padding: `${0.375 * scale}rem` }}>
            <Edit2 size={14 * scale} className="md:w-4 md:h-4" />
          </button>
          <button onClick={onDelete} className={cn("rounded-lg transition-colors text-red-500", theme.id === 'light' ? "hover:bg-black/5" : "hover:bg-white/5")} style={{ padding: `${0.375 * scale}rem` }}>
            <Trash2 size={14 * scale} className="md:w-4 md:h-4" />
          </button>
        </div>
      </div>
      <h4 className="font-bold mb-1 transition-all duration-300 group-hover:translate-x-1" style={{ fontSize: `${1 * scale}rem`, color: theme.accentColor }}>{product.name}</h4>
      <p className={cn("mb-3 transition-opacity duration-300 group-hover:opacity-100", theme.muted)} style={{ fontSize: `${0.625 * scale}rem`, marginBottom: `${1 * scale}rem`, opacity: 0.6 }}>SKU: {product.sku || 'N/A'}</p>
      
      <div className="grid grid-cols-2 pt-3 border-t border-black/[0.03] dark:border-white/[0.03] transition-colors duration-300 group-hover:border-solid" style={{ gap: `${0.75 * scale}rem`, paddingTop: `${1 * scale}rem` }}>
        <div>
          <p className={cn("uppercase font-bold opacity-50", theme.muted)} style={{ fontSize: `${0.5625 * scale}rem`, marginBottom: `${0.125 * scale}rem` }}>Source Price</p>
          <p className="font-bold transition-colors duration-300 group-hover:text-emerald-500" style={{ fontSize: `${0.875 * scale}rem` }}>{formatCurrency(product.source_price)}</p>
        </div>
        <div className="text-right">
          <p className={cn("uppercase font-bold opacity-50", theme.muted)} style={{ fontSize: `${0.5625 * scale}rem`, marginBottom: `${0.125 * scale}rem` }}>Retail Price</p>
          <p className="font-bold transition-transform duration-300 group-hover:scale-110 origin-right" style={{ fontSize: `${0.875 * scale}rem` }}>{formatCurrency(product.sale_price)}</p>
        </div>
      </div>
    </motion.div>
  );
}

function ProductFormModal({ product, onClose, onSubmit, theme }: { product: Product | null, onClose: () => void, onSubmit: (data: Omit<Product, 'id'>) => void, theme: any }) {
  const [formData, setFormData] = useState<Omit<Product, 'id'>>(product ? {
    name: product.name,
    sku: product.sku || '',
    source_price: product.source_price,
    sale_price: product.sale_price,
    source_link: product.source_link || '',
    marketplace_fees: product.marketplace_fees || 0,
    category: product.category || ''
  } : {
    name: '',
    sku: '',
    source_price: 0,
    sale_price: 0,
    source_link: '',
    marketplace_fees: 0,
    category: ''
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className={cn(
          "relative w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col",
          theme.card, theme.text
        )}
      >
        <div className={cn("p-4 md:p-6 border-b flex justify-between items-center", theme.border)}>
          <h3 className="text-lg md:text-xl font-bold">{product ? 'Edit Product' : 'New Product'}</h3>
          <button onClick={onClose} className={cn("p-2 rounded-full transition-colors", theme.id === 'light' ? "hover:bg-black/5" : "hover:bg-white/5")}>
            <X size={18} className="md:w-5 md:h-5" />
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-semibold opacity-50">Product Name</label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className={cn("w-full p-3 rounded-xl border outline-none focus:ring-2 transition-all", theme.id === 'light' ? "bg-gray-50 border-black/5" : "bg-white/5 border-white/10")}
              style={{ '--tw-ring-color': `${theme.accentColor}33` } as any}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold opacity-50">SKU (Optional)</label>
              <input 
                type="text" 
                value={formData.sku}
                onChange={e => setFormData({...formData, sku: e.target.value})}
                className={cn("w-full p-3 rounded-xl border outline-none focus:ring-2 transition-all", theme.id === 'light' ? "bg-gray-50 border-black/5" : "bg-white/5 border-white/10")}
                style={{ '--tw-ring-color': `${theme.accentColor}33` } as any}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold opacity-50">Category</label>
              <input 
                type="text" 
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className={cn("w-full p-3 rounded-xl border outline-none focus:ring-2 transition-all", theme.id === 'light' ? "bg-gray-50 border-black/5" : "bg-white/5 border-white/10")}
                style={{ '--tw-ring-color': `${theme.accentColor}33` } as any}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold opacity-50">Source Price</label>
              <input 
                type="number" 
                value={formData.source_price}
                onChange={e => setFormData({...formData, source_price: parseFloat(e.target.value) || 0})}
                className={cn("w-full p-3 rounded-xl border outline-none focus:ring-2 transition-all", theme.id === 'light' ? "bg-gray-50 border-black/5" : "bg-white/5 border-white/10")}
                style={{ '--tw-ring-color': `${theme.accentColor}33` } as any}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold opacity-50">Retail Price</label>
              <input 
                type="number" 
                value={formData.sale_price}
                onChange={e => setFormData({...formData, sale_price: parseFloat(e.target.value) || 0})}
                className={cn("w-full p-3 rounded-xl border outline-none focus:ring-2 transition-all", theme.id === 'light' ? "bg-gray-50 border-black/5" : "bg-white/5 border-white/10")}
                style={{ '--tw-ring-color': `${theme.accentColor}33` } as any}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold opacity-50">Source Link (Optional)</label>
            <input 
              type="url" 
              value={formData.source_link}
              onChange={e => setFormData({...formData, source_link: e.target.value})}
              className={cn("w-full p-3 rounded-xl border outline-none focus:ring-2 transition-all", theme.id === 'light' ? "bg-gray-50 border-black/5" : "bg-white/5 border-white/10")}
              style={{ '--tw-ring-color': `${theme.accentColor}33` } as any}
            />
          </div>
        </div>

        <div className={cn("p-6 border-t flex justify-end gap-3", theme.border)}>
          <button 
            onClick={onClose}
            className={cn("px-6 py-2 rounded-xl font-semibold transition-all", theme.id === 'light' ? "hover:bg-black/5" : "hover:bg-white/5")}
          >
            Cancel
          </button>
          <button 
            onClick={() => onSubmit(formData)}
            className={cn(
              "px-8 py-2 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95",
            )}
            style={{ 
              backgroundColor: theme.accentColor,
              boxShadow: `0 10px 15px -3px ${theme.accentColor}33`
            }}
          >
            {product ? 'Save Changes' : 'Add Product'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
