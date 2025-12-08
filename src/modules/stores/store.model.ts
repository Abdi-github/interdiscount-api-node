import mongoose, { Schema, Document, Types } from 'mongoose';
import { ITranslation, translationSchema } from '../shared/translation.schema';

export interface IOpeningHour {
  day: ITranslation;
  open: string;
  close: string;
  is_closed: boolean;
}

export interface IStore extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  store_id: string;
  street: string;
  street_number: string;
  postal_code: string;
  city_id: Types.ObjectId;
  canton_id: Types.ObjectId;
  remarks: string;
  phone: string;
  email: string;
  latitude: number;
  longitude: number;
  format: string;
  is_xxl: boolean;
  opening_hours: IOpeningHour[];
  is_active: boolean;
}

const openingHourSchema = new Schema<IOpeningHour>(
  {
    day: { type: translationSchema, required: true },
    open: { type: String, default: '' },
    close: { type: String, default: '' },
    is_closed: { type: Boolean, default: false },
  },
  { _id: false },
);

const storeSchema = new Schema<IStore>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    store_id: { type: String, required: true, unique: true },
    street: { type: String, default: '' },
    street_number: { type: String, default: '' },
    postal_code: { type: String, default: '' },
    city_id: { type: Schema.Types.ObjectId, ref: 'City', required: true },
    canton_id: { type: Schema.Types.ObjectId, ref: 'Canton', required: true },
    remarks: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    format: { type: String, default: 'standard' },
    is_xxl: { type: Boolean, default: false },
    opening_hours: [openingHourSchema],
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

// Indexes
storeSchema.index({ city_id: 1 });
storeSchema.index({ canton_id: 1 });
storeSchema.index({ postal_code: 1 });
storeSchema.index({ format: 1 });
storeSchema.index({ slug: 1 });
storeSchema.index({ store_id: 1 });
// 2dsphere index for geo-proximity queries
storeSchema.index({ location: '2dsphere' });

const Store = mongoose.model<IStore>('Store', storeSchema, 'stores');

export default Store;
