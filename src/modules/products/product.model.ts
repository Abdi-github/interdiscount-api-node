import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IProductImage {
  alt: string;
  src: {
    xs: string;
    sm: string;
    md: string;
  };
}

export interface IProductService {
  code: string;
  name: string;
  price: number;
}

export interface IProduct extends Document {
  _id: Types.ObjectId;
  name: string;
  name_short: string;
  slug: string;
  code: string;
  displayed_code: string;
  brand_id: Types.ObjectId | null;
  category_id: Types.ObjectId;
  price: number;
  original_price: number | null;
  currency: string;
  images: IProductImage[];
  rating: number;
  review_count: number;
  specification: string;
  availability_state: string;
  delivery_days: number;
  in_store_possible: boolean;
  release_date: string | null;
  services: IProductService[];
  promo_labels: string[];
  is_speed_product: boolean;
  is_orderable: boolean;
  is_sustainable: boolean;
  is_active: boolean;
  status: string;
}

const productImageSchema = new Schema(
  {
    alt: { type: String, default: '' },
    src: {
      xs: { type: String, default: '' },
      sm: { type: String, default: '' },
      md: { type: String, default: '' },
    },
  },
  { _id: false },
);

const productServiceSchema = new Schema(
  {
    code: { type: String, default: '' },
    name: { type: String, default: '' },
    price: { type: Number, default: 0 },
  },
  { _id: false },
);

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    name_short: { type: String, default: '' },
    slug: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
    displayed_code: { type: String, default: '' },
    brand_id: { type: Schema.Types.ObjectId, ref: 'Brand', default: null },
    category_id: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    price: { type: Number, required: true },
    original_price: { type: Number, default: null },
    currency: { type: String, default: 'CHF' },
    images: [productImageSchema],
    rating: { type: Number, default: 0 },
    review_count: { type: Number, default: 0 },
    specification: { type: String, default: '' },
    availability_state: {
      type: String,
      enum: ['INSTOCK', 'OUTOFSTOCK', 'LOWSTOCK', 'PREORDER', 'DISCONTINUED'],
      default: 'INSTOCK',
    },
    delivery_days: { type: Number, default: 3 },
    in_store_possible: { type: Boolean, default: false },
    release_date: { type: String, default: null },
    services: [productServiceSchema],
    promo_labels: [{ type: String }],
    is_speed_product: { type: Boolean, default: false },
    is_orderable: { type: Boolean, default: true },
    is_sustainable: { type: Boolean, default: false },
    is_active: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['PUBLISHED', 'DRAFT', 'ARCHIVED'],
      default: 'PUBLISHED',
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

// Indexes for filtering & search
productSchema.index({ slug: 1 });
productSchema.index({ code: 1 });
productSchema.index({ brand_id: 1 });
productSchema.index({ category_id: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ availability_state: 1 });
productSchema.index({ is_speed_product: 1 });
productSchema.index({ is_sustainable: 1 });
productSchema.index({ status: 1, is_active: 1 });
// Text index for full-text search
productSchema.index({ name: 'text', name_short: 'text', specification: 'text' });

const Product = mongoose.model<IProduct>('Product', productSchema, 'products');

export default Product;
