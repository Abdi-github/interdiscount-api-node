import mongoose, { Schema, Document, Types } from 'mongoose';

export interface INotification extends Document {
  _id: Types.ObjectId;
  user_id: Types.ObjectId;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  read_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

const NOTIFICATION_TYPES = [
  'order_status',
  'order_confirmed',
  'order_shipped',
  'order_delivered',
  'order_cancelled',
  'pickup_ready',
  'pickup_reminder',
  'pickup_expired',
  'review_approved',
  'review_rejected',
  'price_drop',
  'promotion',
  'system',
] as const;

const notificationSchema = new Schema<INotification>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    data: { type: Schema.Types.Mixed, default: null },
    is_read: { type: Boolean, default: false },
    read_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

// Indexes
notificationSchema.index({ user_id: 1, created_at: -1 });
notificationSchema.index({ user_id: 1, is_read: 1 });

const Notification = mongoose.model<INotification>('Notification', notificationSchema, 'notifications');

export default Notification;
