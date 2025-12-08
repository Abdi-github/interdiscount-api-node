/**
 * Store Dashboard types.
 */
export interface IStoreDashboardStats {
  today_orders: number;
  today_revenue: number;
  pending_pickups: number;
  ready_pickups: number;
  low_stock_count: number;
  out_of_stock_count: number;
  total_products: number;
  currency: string;
}

export interface IRevenueData {
  period: string;
  total: number;
  order_count: number;
  currency: string;
}

export interface ITopProduct {
  product_id: string;
  product_name: string;
  product_code: string;
  quantity_sold: number;
  revenue: number;
  currency: string;
}

export interface IPickupSummary {
  pending: number;
  confirmed: number;
  ready: number;
  overdue: number;
  completed_today: number;
}
