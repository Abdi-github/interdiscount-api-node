import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem extends Document {
  _id: mongoose.Types.ObjectId;
  order_id: mongoose.Types.ObjectId;
  product_id: mongoose.Types.ObjectId;
  product_name: string;
  product_code: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  currency: string;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    order_id: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    product_id: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    product_name: { type: String, required: true },
    product_code: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unit_price: { type: Number, required: true, min: 0 },
    total_price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'CHF' },
  },
  {
    timestamps: false,
  },
);

// Indexes
orderItemSchema.index({ order_id: 1 });
orderItemSchema.index({ product_id: 1 });

const OrderItem = mongoose.model<IOrderItem>('OrderItem', orderItemSchema, 'order_items');

export default OrderItem;
