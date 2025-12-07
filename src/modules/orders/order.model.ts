import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  order_number: string;
  user_id: mongoose.Types.ObjectId;
  shipping_address_id: mongoose.Types.ObjectId;
  billing_address_id: mongoose.Types.ObjectId;
  status: string;
  payment_method: string;
  payment_status: string;
  subtotal: number;
  shipping_fee: number;
  discount: number;
  total: number;
  currency: string;
  coupon_code: string | null;
  notes: string;
  store_pickup_id: mongoose.Types.ObjectId | null;
  is_store_pickup: boolean;
  estimated_delivery: Date | null;
  delivered_at: Date | null;
  cancelled_at: Date | null;
  cancellation_reason: string | null;
  created_at: Date;
  updated_at: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    order_number: { type: String, required: true, unique: true },
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    shipping_address_id: { type: Schema.Types.ObjectId, ref: 'Address', required: true },
    billing_address_id: { type: Schema.Types.ObjectId, ref: 'Address', required: true },
    status: {
      type: String,
      enum: [
        'PLACED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED',
        'READY_FOR_PICKUP', 'PICKED_UP', 'CANCELLED', 'RETURNED', 'PICKUP_EXPIRED',
        // Legacy seed data values
        'PENDING',
      ],
      default: 'PLACED',
    },
    payment_method: {
      type: String,
      enum: ['card', 'twint', 'postfinance', 'invoice'],
      required: true,
    },
    payment_status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
    },
    subtotal: { type: Number, required: true, min: 0 },
    shipping_fee: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'CHF' },
    coupon_code: { type: String, default: null },
    notes: { type: String, default: '' },
    store_pickup_id: { type: Schema.Types.ObjectId, ref: 'Store', default: null },
    is_store_pickup: { type: Boolean, default: false },
    estimated_delivery: { type: Date, default: null },
    delivered_at: { type: Date, default: null },
    cancelled_at: { type: Date, default: null },
    cancellation_reason: { type: String, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

// Indexes
orderSchema.index({ user_id: 1, created_at: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ order_number: 1 });
orderSchema.index({ store_pickup_id: 1, status: 1 });
orderSchema.index({ payment_status: 1 });

const Order = mongoose.model<IOrder>('Order', orderSchema);

export default Order;
