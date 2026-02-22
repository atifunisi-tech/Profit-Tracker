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

export type ThemeType = 'light' | 'dark' | 'midnight' | 'forest' | 'sunset';

export interface ThemeConfig {
  id: ThemeType;
  name: string;
  bg: string;
  card: string;
  text: string;
  muted: string;
  border: string;
  accent: string;
}

export const THEMES: ThemeConfig[] = [
  {
    id: 'light',
    name: 'Light',
    bg: 'bg-[#F8F9FA]',
    card: 'bg-white',
    text: 'text-[#1A1A1A]',
    muted: 'text-black/50',
    border: 'border-black/5',
    accent: 'emerald'
  },
  {
    id: 'dark',
    name: 'Dark',
    bg: 'bg-[#0A0A0A]',
    card: 'bg-[#111111]',
    text: 'text-white',
    muted: 'text-white/50',
    border: 'border-white/10',
    accent: 'emerald'
  },
  {
    id: 'midnight',
    name: 'Midnight',
    bg: 'bg-[#020617]',
    card: 'bg-[#0f172a]',
    text: 'text-slate-50',
    muted: 'text-slate-400',
    border: 'border-slate-800',
    accent: 'indigo'
  },
  {
    id: 'forest',
    name: 'Forest',
    bg: 'bg-[#052e16]',
    card: 'bg-[#064e3b]',
    text: 'text-emerald-50',
    muted: 'text-emerald-400/70',
    border: 'border-emerald-800',
    accent: 'emerald'
  },
  {
    id: 'sunset',
    name: 'Sunset',
    bg: 'bg-[#450a0a]',
    card: 'bg-[#7f1d1d]',
    text: 'text-orange-50',
    muted: 'text-orange-300/70',
    border: 'border-orange-900',
    accent: 'orange'
  }
];
