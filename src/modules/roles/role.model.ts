import mongoose, { Schema, Document } from 'mongoose';
import { ITranslation, translationSchema } from '../shared/translation.schema';

export interface IRole extends Document {
  name: string;
  display_name: ITranslation;
  description: ITranslation;
  is_system: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const roleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    display_name: { type: translationSchema, required: true },
    description: { type: translationSchema, required: true },
    is_system: { type: Boolean, default: false },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

const Role = mongoose.model<IRole>('Role', roleSchema, 'roles');

export default Role;
