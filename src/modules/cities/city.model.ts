import mongoose, { Schema, Document, Types } from 'mongoose';
import { ITranslation, translationSchema } from '../shared/translation.schema';

export interface ICity extends Document {
  _id: Types.ObjectId;
  name: ITranslation;
  slug: string;
  canton_id: Types.ObjectId;
  postal_codes: string[];
  is_active: boolean;
}

const citySchema = new Schema<ICity>(
  {
    name: { type: translationSchema, required: true },
    slug: { type: String, required: true, unique: true },
    canton_id: { type: Schema.Types.ObjectId, ref: 'Canton', required: true },
    postal_codes: [{ type: String }],
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

citySchema.index({ canton_id: 1 });
citySchema.index({ slug: 1 });
citySchema.index({ postal_codes: 1 });

const City = mongoose.model<ICity>('City', citySchema, 'cities');

export default City;
