import mongoose, { Schema, Document } from 'mongoose';
import { ITranslation, translationSchema } from '../shared/translation.schema';

export interface IPermission extends Document {
  name: string;
  display_name: ITranslation;
  description: ITranslation;
  resource: string;
  action: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const permissionSchema = new Schema<IPermission>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    display_name: { type: translationSchema, required: true },
    description: { type: translationSchema, required: true },
    resource: { type: String, required: true, trim: true },
    action: { type: String, required: true, trim: true },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

const Permission = mongoose.model<IPermission>('Permission', permissionSchema, 'permissions');

export default Permission;
