import mongoose, { Schema, Document, Types } from 'mongoose';
import { ITranslation, translationSchema } from '../shared/translation.schema';

export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: ITranslation;
  slug: string;
  category_id: string;
  level: number;
  parent_id: Types.ObjectId | null;
  sort_order: number;
  is_active: boolean;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: translationSchema, required: true },
    slug: { type: String, required: true, unique: true },
    category_id: { type: String, required: true, unique: true },
    level: { type: Number, required: true, default: 0 },
    parent_id: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    sort_order: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

categorySchema.index({ parent_id: 1 });
categorySchema.index({ slug: 1 });
categorySchema.index({ category_id: 1 });
categorySchema.index({ level: 1 });

const Category = mongoose.model<ICategory>('Category', categorySchema, 'categories');

export default Category;
