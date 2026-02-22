import { useState, useEffect } from 'react';
import { Product } from '../types';

const STORAGE_KEY = 'marketprofit_products';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setProducts(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved products');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    }
  }, [products, loading]);

  const addProduct = async (product: Omit<Product, 'id'>) => {
    const newProduct = { ...product, id: Date.now().toString() };
    setProducts(prev => [newProduct, ...prev]);
    return true;
  };

  const updateProduct = async (id: string, product: Omit<Product, 'id'>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...product, id } : p));
    return true;
  };

  const deleteProduct = async (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    return true;
  };

  return { products, loading, addProduct, updateProduct, deleteProduct };
}
