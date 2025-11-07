import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBrand extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  product_count: number;
  is_active: boolean;
}

const brandSchema = new Schema<IBrand>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    product_count: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

brandSchema.index({ slug: 1 });
brandSchema.index({ name: 1 });

const Brand = mongoose.model<IBrand>('Brand', brandSchema, 'brands');

export default Brand;
