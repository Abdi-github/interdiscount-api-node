import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IWishlist extends Document {
  _id: Types.ObjectId;
  user_id: Types.ObjectId;
  product_id: Types.ObjectId;
  created_at: Date;
}

const wishlistSchema = new Schema<IWishlist>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    product_id: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  },
);

// Compound unique index — one entry per user+product
wishlistSchema.index({ user_id: 1, product_id: 1 }, { unique: true });
wishlistSchema.index({ user_id: 1, created_at: -1 });

const Wishlist = mongoose.model<IWishlist>('Wishlist', wishlistSchema, 'wishlists');

export default Wishlist;
