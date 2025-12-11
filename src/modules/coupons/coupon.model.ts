import mongoose, { Schema, Document, Types } from 'mongoose';
import { translationSchema, ITranslation } from '../shared/translation.schema';

export interface ICoupon extends Document {
  _id: Types.ObjectId;
  code: string;
  description: ITranslation;
  discount_type: string;
  discount_value: number;
  minimum_order: number;
  max_uses: number;
  used_count: number;
  valid_from: Date;
  valid_until: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: translationSchema, required: true },
    discount_type: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    discount_value: { type: Number, required: true, min: 0 },
    minimum_order: { type: Number, default: 0 },
    max_uses: { type: Number, default: 0 },
    used_count: { type: Number, default: 0 },
    valid_from: { type: Date, required: true },
    valid_until: { type: Date, required: true },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

// Indexes
couponSchema.index({ code: 1 });
couponSchema.index({ is_active: 1, valid_from: 1, valid_until: 1 });

const Coupon = mongoose.model<ICoupon>('Coupon', couponSchema, 'coupons');

export default Coupon;
