import { Types, Document } from 'mongoose';

/**
 * Store Promotion discount types.
 */
export const DISCOUNT_TYPES = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed',
  BUY_X_GET_Y: 'buy_x_get_y',
} as const;

export type DiscountType = (typeof DISCOUNT_TYPES)[keyof typeof DISCOUNT_TYPES];

/**
 * Store Promotion document.
 */
export interface IStorePromotion extends Document {
  _id: Types.ObjectId;
  store_id: Types.ObjectId;
  product_id: Types.ObjectId | null;
  category_id: Types.ObjectId | null;
  title: string;
  description: string;
  discount_type: DiscountType;
  discount_value: number;
  buy_quantity: number | null;
  get_quantity: number | null;
  valid_from: Date;
  valid_until: Date;
  is_active: boolean;
  created_by: Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}
