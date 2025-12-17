/**
 * Analytics Types & DTOs
 *
 * Type definitions for the analytics module including
 * enums, constants, request/query DTOs, and response DTOs.
 *
 * Analytics is a read-only module — no create/update DTOs needed.
 * Adapted for interdiscount.ch domain (stores, products, CHF, Swiss context).
 */

// ============================================================================
// Enums & Constants
// ============================================================================

export const DATE_PRESETS = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  THIS_WEEK: 'this_week',
  THIS_MONTH: 'this_month',
  LAST_7_DAYS: 'last_7_days',
  LAST_30_DAYS: 'last_30_days',
  LAST_90_DAYS: 'last_90_days',
  THIS_YEAR: 'this_year',
} as const;

export type DatePreset = (typeof DATE_PRESETS)[keyof typeof DATE_PRESETS];
export const DATE_PRESET_VALUES = Object.values(DATE_PRESETS);

export const ANALYTICS_PERIODS = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
} as const;

export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[keyof typeof ANALYTICS_PERIODS];
export const ANALYTICS_PERIOD_VALUES = Object.values(ANALYTICS_PERIODS);

export const ANALYTICS_CONSTANTS = {
  DEFAULT_TOP_ITEMS_LIMIT: 10,
  MAX_TOP_ITEMS_LIMIT: 50,
  DEFAULT_TOP_STORES_LIMIT: 10,
  MAX_TOP_STORES_LIMIT: 50,
  DEFAULT_RECENT_ORDERS_LIMIT: 10,
  MAX_RECENT_ORDERS_LIMIT: 50,
} as const;

// ============================================================================
// Query DTOs
// ============================================================================

/** Date range query parameters — used by all analytics endpoints */
export interface IAnalyticsDateQuery {
  preset?: string;
  from?: string; // ISO date (YYYY-MM-DD)
  to?: string; // ISO date (YYYY-MM-DD)
}

/** Revenue time series query */
export interface IRevenueTimeSeriesQuery extends IAnalyticsDateQuery {
  period?: string; // AnalyticsPeriod value
}

/** Top items / top stores query */
export interface ITopItemsQuery extends IAnalyticsDateQuery {
  limit?: string;
}

/** Recent orders query */
export interface IRecentOrdersQuery {
  limit?: string;
}

// ============================================================================
// Helper Types
// ============================================================================

export interface IDateRange {
  from: Date;
  to: Date;
}

// ============================================================================
// Response DTOs — Breakdowns
// ============================================================================

export interface IOrderStatusBreakdown {
  PLACED: number;
  CONFIRMED: number;
  PROCESSING: number;
  SHIPPED: number;
  DELIVERED: number;
  READY_FOR_PICKUP: number;
  PICKED_UP: number;
  CANCELLED: number;
  RETURNED: number;
  PICKUP_EXPIRED: number;
}

export interface IOrderTypeBreakdown {
  delivery: number;
  store_pickup: number;
}

export interface IPaymentMethodBreakdown {
  card: number;
  twint: number;
  postfinance: number;
  invoice: number;
}

export interface IPaymentStatusBreakdown {
  PENDING: number;
  PROCESSING: number;
  PAID: number;
  FAILED: number;
  REFUNDED: number;
}

// ============================================================================
// Response DTOs — Platform Dashboard (Admin)
// ============================================================================

export interface IPlatformDashboardOverview {
  total_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  total_revenue: number;
  avg_order_value: number;
  total_users: number;
  total_customers: number;
  new_users_period: number;
  total_products: number;
  active_products: number;
  total_stores: number;
  active_stores: number;
  total_reviews: number;
  pending_reviews: number;
}

export interface IPlatformDashboardResponse {
  date_range: { from: string; to: string };
  overview: IPlatformDashboardOverview;
  order_status_breakdown: IOrderStatusBreakdown;
  order_type_breakdown: IOrderTypeBreakdown;
  payment_method_breakdown: IPaymentMethodBreakdown;
  payment_status_breakdown: IPaymentStatusBreakdown;
}

export interface IRevenueTimeSeriesPoint {
  date: string; // YYYY-MM-DD, YYYY-Www, YYYY-MM
  revenue: number;
  orders: number;
  currency: string;
}

export interface ITopProductResponse {
  product_id: string;
  product_name: string;
  product_code: string;
  quantity_sold: number;
  revenue: number;
  currency: string;
}

export interface ITopStoreResponse {
  store_id: string;
  name: string;
  slug: string;
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  currency: string;
}

export interface IUserGrowthPoint {
  date: string;
  new_users: number;
  cumulative: number;
}

export interface IRecentOrderResponse {
  _id: string;
  order_number: string;
  customer: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  status: string;
  payment_status: string;
  total: number;
  currency: string;
  is_store_pickup: boolean;
  created_at: Date;
}

// ============================================================================
// Response DTOs — Store Dashboard (Store Manager)
// ============================================================================

export interface IStoreDashboardOverview {
  today_orders: number;
  today_revenue: number;
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  pending_pickups: number;
  ready_pickups: number;
  low_stock_count: number;
  out_of_stock_count: number;
  total_tracked_products: number;
  currency: string;
}

export interface IStoreDashboardResponse {
  store_id: string;
  date_range: { from: string; to: string };
  overview: IStoreDashboardOverview;
  order_status_breakdown: IOrderStatusBreakdown;
  payment_method_breakdown: IPaymentMethodBreakdown;
  pickup_summary: IPickupSummary;
}

export interface IPickupSummary {
  pending: number;
  confirmed: number;
  processing: number;
  ready: number;
  overdue: number;
  completed_today: number;
  expired: number;
}
