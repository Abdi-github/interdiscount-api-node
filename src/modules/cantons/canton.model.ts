import mongoose, { Schema, Document, Types } from 'mongoose';
import { ITranslation, translationSchema } from '../shared/translation.schema';

export interface ICanton extends Document {
  _id: Types.ObjectId;
  name: ITranslation;
  slug: string;
  code: string;
  is_active: boolean;
}

const cantonSchema = new Schema<ICanton>(
  {
    name: { type: translationSchema, required: true },
    slug: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

cantonSchema.index({ code: 1 });
cantonSchema.index({ slug: 1 });

const Canton = mongoose.model<ICanton>('Canton', cantonSchema, 'cantons');

export default Canton;
