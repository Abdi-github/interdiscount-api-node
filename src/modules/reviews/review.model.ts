import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReview extends Document {
  _id: Types.ObjectId;
  product_id: Types.ObjectId;
  user_id: Types.ObjectId;
  rating: number;
  title: string;
  comment: string;
  language: string;
  is_verified_purchase: boolean;
  is_approved: boolean;
  helpful_count: number;
  created_at: Date;
  updated_at: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    product_id: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, trim: true },
    comment: { type: String, required: true, trim: true },
    language: {
      type: String,
      enum: ['de', 'en', 'fr', 'it'],
      default: 'de',
    },
    is_verified_purchase: { type: Boolean, default: false },
    is_approved: { type: Boolean, default: false },
    helpful_count: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

// Indexes
reviewSchema.index({ product_id: 1, created_at: -1 });
reviewSchema.index({ user_id: 1, created_at: -1 });
reviewSchema.index({ product_id: 1, is_approved: 1 });
// One review per user per product
reviewSchema.index({ product_id: 1, user_id: 1 }, { unique: true });

const Review = mongoose.model<IReview>('Review', reviewSchema, 'reviews');

export default Review;
