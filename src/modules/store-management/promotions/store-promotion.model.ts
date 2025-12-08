import mongoose, { Schema } from 'mongoose';
import { IStorePromotion, DISCOUNT_TYPES } from './store-promotion.types';

const storePromotionSchema = new Schema<IStorePromotion>(
  {
    store_id: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    product_id: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    category_id: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', trim: true, maxlength: 1000 },
    discount_type: {
      type: String,
      enum: Object.values(DISCOUNT_TYPES),
      required: true,
    },
    discount_value: { type: Number, required: true, min: 0 },
    buy_quantity: { type: Number, default: null, min: 1 },
    get_quantity: { type: Number, default: null, min: 1 },
    valid_from: { type: Date, required: true },
    valid_until: { type: Date, required: true },
    is_active: { type: Boolean, default: true, index: true },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    collection: 'store_promotions',
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Index for active promotions at a store
storePromotionSchema.index({ store_id: 1, is_active: 1, valid_from: 1, valid_until: 1 });

const StorePromotion = mongoose.model<IStorePromotion>('StorePromotion', storePromotionSchema, 'store_promotions');

export default StorePromotion;
