import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUserRole extends Document {
  user_id: Types.ObjectId;
  role_id: Types.ObjectId;
  assigned_by: Types.ObjectId | null;
  assigned_at: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const userRoleSchema = new Schema<IUserRole>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role_id: { type: Schema.Types.ObjectId, ref: 'Role', required: true },
    assigned_by: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    assigned_at: { type: Date, default: Date.now },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

userRoleSchema.index({ user_id: 1, role_id: 1 }, { unique: true });

const UserRole = mongoose.model<IUserRole>('UserRole', userRoleSchema, 'user_roles');

export default UserRole;
