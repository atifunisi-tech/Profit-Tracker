import { useState, useEffect } from 'react';
import { Order, Stats } from '../types';
import { calculateOrderMetrics } from '../utils';

const STORAGE_KEY = 'marketprofit_orders';

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Load orders from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setOrders(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved orders');
      }
    }
    setLoading(false);
  }, []);

  // Save orders to localStorage whenever they change
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    }
  }, [orders, loading]);

  const stats: Stats = orders.reduce((acc, order) => {
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

  const addOrder = async (order: Order) => {
    const newOrder = { ...order, id: Date.now() };
    setOrders(prev => [newOrder, ...prev]);
    return true;
  };

  const updateOrder = async (id: number, order: Order) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...order, id } : o));
    return true;
  };

  const deleteOrder = async (id: number) => {
    setOrders(prev => prev.filter(o => o.id !== id));
    return true;
  };

  const refresh = async () => {
    // No-op for localStorage
  };

  return { orders, stats, loading, refresh, addOrder, updateOrder, deleteOrder };
}
