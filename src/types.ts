export interface Order {
  id?: number;
  product_name: string;
  order_id: string;
  customer_name?: string;
  marketplace: string;
  date: string;
  notes?: string;
  source_link?: string;
  source_price: number;
  shipping_cost: number;
  tax_cost: number;
  other_costs: number;
  sale_price: number;
  marketplace_fees: number;
  transaction_fees: number;
  advertising_cost: number;
  other_fees: number;
  currency: string;
  is_returned?: boolean;
  return_cost?: number;
}

export interface Product {
  id: string;
  name: string;
  sku?: string;
  source_price: number;
  sale_price: number;
  source_link?: string;
  marketplace_fees?: number;
  category?: string;
}

export interface Stats {
  totalOrders: number;
  totalRevenue: number;
  totalCosts: number;
  totalFees: number;
  totalProfit: number;
  profitThisMonth: number;
}

export const MARKETPLACES = [
  'Amazon',
  'Walmart',
  'eBay',
  'TikTok Shop',
  'Temu',
  'Shopify',
  'Facebook Marketplace',
  'Etsy',
  'Other'
];

export const MARKETPLACE_FEES: Record<string, { percentage: number; fixed: number }> = {
  'Amazon': { percentage: 0.15, fixed: 0 },
  'Walmart': { percentage: 0.15, fixed: 0 },
  'eBay': { percentage: 0.1325, fixed: 0.30 },
  'TikTok Shop': { percentage: 0.06, fixed: 0 },
  'Temu': { percentage: 0, fixed: 0 },
  'Shopify': { percentage: 0.029, fixed: 0.30 },
  'Facebook Marketplace': { percentage: 0.05, fixed: 0 },
  'Etsy': { percentage: 0.065, fixed: 0.20 },
  'Other': { percentage: 0, fixed: 0 }
};

export const CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'CAD', symbol: 'C$' },
  { code: 'AUD', symbol: 'A$' },
];

export type ThemeType = 'light' | 'dark' | 'midnight' | 'forest' | 'sunset' | 'nord' | 'rose' | 'slate';

export interface ThemeConfig {
  id: ThemeType;
  name: string;
  bg: string;
  card: string;
  text: string;
  muted: string;
  border: string;
  accent: string;
  accentColor: string;
}

export const THEMES: ThemeConfig[] = [
  {
    id: 'light',
    name: 'Pristine',
    bg: 'bg-[#F8FAFC]',
    card: 'bg-white',
    text: 'text-[#0F172A]',
    muted: 'text-slate-500',
    border: 'border-slate-200/60',
    accent: 'emerald',
    accentColor: '#10b981'
  },
  {
    id: 'dark',
    name: 'Onyx',
    bg: 'bg-[#020617]',
    card: 'bg-[#0F172A]',
    text: 'text-slate-50',
    muted: 'text-slate-400',
    border: 'border-slate-800/50',
    accent: 'emerald',
    accentColor: '#10b981'
  },
  {
    id: 'midnight',
    name: 'Midnight',
    bg: 'bg-[#000000]',
    card: 'bg-[#0A0A0A]',
    text: 'text-zinc-100',
    muted: 'text-zinc-500',
    border: 'border-zinc-800/80',
    accent: 'indigo',
    accentColor: '#6366f1'
  },
  {
    id: 'nord',
    name: 'Nordic',
    bg: 'bg-[#2E3440]',
    card: 'bg-[#3B4252]',
    text: 'text-[#ECEFF4]',
    muted: 'text-[#D8DEE9]/60',
    border: 'border-[#4C566A]/50',
    accent: 'indigo',
    accentColor: '#88C0D0'
  },
  {
    id: 'rose',
    name: 'Rose Gold',
    bg: 'bg-[#FFF1F2]',
    card: 'bg-white',
    text: 'text-[#4C0519]',
    muted: 'text-[#9F1239]/50',
    border: 'border-[#FDA4AF]/30',
    accent: 'rose',
    accentColor: '#E11D48'
  },
  {
    id: 'slate',
    name: 'Slate',
    bg: 'bg-[#F1F5F9]',
    card: 'bg-white',
    text: 'text-[#0F172A]',
    muted: 'text-[#64748B]',
    border: 'border-[#E2E8F0]',
    accent: 'indigo',
    accentColor: '#6366f1'
  },
  {
    id: 'forest',
    name: 'Evergreen',
    bg: 'bg-[#022c22]',
    card: 'bg-[#064e3b]',
    text: 'text-emerald-50',
    muted: 'text-emerald-400/60',
    border: 'border-emerald-800/40',
    accent: 'emerald',
    accentColor: '#34d399'
  },
  {
    id: 'sunset',
    name: 'Crimson',
    bg: 'bg-[#450a0a]',
    card: 'bg-[#7f1d1d]',
    text: 'text-orange-50',
    muted: 'text-orange-300/60',
    border: 'border-orange-900/40',
    accent: 'orange',
    accentColor: '#fb923c'
  }
];
