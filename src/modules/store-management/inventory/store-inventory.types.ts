import { Types, Document } from 'mongoose';

/**
 * Store Inventory — tracks stock per product per store.
 */
export interface IStoreInventory extends Document {
  _id: Types.ObjectId;
  store_id: Types.ObjectId;
  product_id: Types.ObjectId;
  quantity: number;
  reserved: number;
  min_stock: number;
  max_stock: number;
  last_restock_at: Date | null;
  last_sold_at: Date | null;
  location_in_store: string;
  is_display_unit: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Stock adjustment operations.
 */
export const STOCK_OPERATIONS = {
  RESTOCK: 'RESTOCK',
  SALE: 'SALE',
  RESERVE: 'RESERVE',
  COLLECT: 'COLLECT',
  CANCEL_RESERVE: 'CANCEL_RESERVE',
  ADJUSTMENT: 'ADJUSTMENT',
  TRANSFER_OUT: 'TRANSFER_OUT',
  TRANSFER_IN: 'TRANSFER_IN',
} as const;

export type StockOperation = (typeof STOCK_OPERATIONS)[keyof typeof STOCK_OPERATIONS];

/**
 * Bulk update item shape.
 */
export interface IBulkUpdateItem {
  product_id: string;
  quantity: number;
  location_in_store?: string;
}
