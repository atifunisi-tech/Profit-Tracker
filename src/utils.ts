import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function calculateOrderMetrics(order: any) {
  const totalCost = (order.source_price || 0) + (order.shipping_cost || 0) + (order.tax_cost || 0) + (order.other_costs || 0);
  const totalFees = (order.marketplace_fees || 0) + (order.transaction_fees || 0) + (order.advertising_cost || 0) + (order.other_fees || 0);
  const returnCost = order.is_returned ? (order.return_cost || 0) : 0;
  const netProfit = (order.sale_price || 0) - totalCost - totalFees - returnCost;
  const profitMargin = order.sale_price > 0 ? (netProfit / order.sale_price) * 100 : 0;

  return {
    totalCost,
    totalFees,
    returnCost,
    netProfit,
    profitMargin
  };
}
