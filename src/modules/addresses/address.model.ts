import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAddress extends Document {
  _id: Types.ObjectId;
  user_id: Types.ObjectId;
  label: string;
  first_name: string;
  last_name: string;
  street: string;
  street_number: string;
  postal_code: string;
  city: string;
  canton_code: string;
  country: string;
  phone: string;
  is_default: boolean;
  is_billing: boolean;
  created_at: Date;
  updated_at: Date;
}

const addressSchema = new Schema<IAddress>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    label: { type: String, required: true, trim: true },
    first_name: { type: String, required: true, trim: true },
    last_name: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    street_number: { type: String, required: true, trim: true },
    postal_code: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    canton_code: { type: String, required: true, trim: true, uppercase: true },
    country: { type: String, default: 'CH', trim: true },
    phone: { type: String, default: '', trim: true },
    is_default: { type: Boolean, default: false },
    is_billing: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

// Indexes
addressSchema.index({ user_id: 1 });
addressSchema.index({ user_id: 1, is_default: 1 });

const Address = mongoose.model<IAddress>('Address', addressSchema, 'addresses');

export default Address;
