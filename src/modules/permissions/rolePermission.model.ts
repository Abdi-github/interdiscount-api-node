import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRolePermission extends Document {
  role_id: Types.ObjectId;
  permission_id: Types.ObjectId;
  created_at: Date;
}

const rolePermissionSchema = new Schema<IRolePermission>(
  {
    role_id: { type: Schema.Types.ObjectId, ref: 'Role', required: true },
    permission_id: { type: Schema.Types.ObjectId, ref: 'Permission', required: true },
    created_at: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
  },
);

rolePermissionSchema.index({ role_id: 1, permission_id: 1 }, { unique: true });

const RolePermission = mongoose.model<IRolePermission>(
  'RolePermission',
  rolePermissionSchema,
  'role_permissions',
);

export default RolePermission;
