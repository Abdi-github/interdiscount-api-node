import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone: string;
  preferred_language: string;
  user_type: string;
  store_id: Types.ObjectId | null;
  avatar_url: string | null;
  is_active: boolean;
  is_verified: boolean;
  verified_at: Date | null;
  last_login_at: Date | null;
  verification_token: string | null;
  verification_token_expires: Date | null;
  reset_password_token: string | null;
  reset_password_expires: Date | null;
  created_at: Date;
  updated_at: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password_hash: { type: String, required: true },
    first_name: { type: String, required: true, trim: true },
    last_name: { type: String, required: true, trim: true },
    phone: { type: String, default: '' },
    preferred_language: {
      type: String,
      enum: ['de', 'en', 'fr', 'it'],
      default: 'de',
    },
    user_type: {
      type: String,
      enum: ['customer', 'staff', 'admin', 'super_admin', 'store_manager', 'store_staff', 'platform_admin', 'support_agent', 'warehouse_staff', 'customer_support'],
      default: 'customer',
    },
    store_id: { type: Schema.Types.ObjectId, ref: 'Store', default: null },
    avatar_url: { type: String, default: null },
    is_active: { type: Boolean, default: true },
    is_verified: { type: Boolean, default: false },
    verified_at: { type: Date, default: null },
    last_login_at: { type: Date, default: null },
    verification_token: { type: String, default: null },
    verification_token_expires: { type: Date, default: null },
    reset_password_token: { type: String, default: null },
    reset_password_expires: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

// Indexes (email index created automatically by unique: true)
userSchema.index({ user_type: 1 });
userSchema.index({ store_id: 1 });
userSchema.index({ verification_token: 1 });
userSchema.index({ reset_password_token: 1 });

const User = mongoose.model<IUser>('User', userSchema, 'users');

export default User;
