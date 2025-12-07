import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  _id: mongoose.Types.ObjectId;
  order_id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  payment_method: string;
  status: string;
  stripe_payment_intent_id: string | null;
  stripe_client_secret: string | null;
  failure_reason: string | null;
  paid_at: Date | null;
  refunded_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    order_id: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'CHF' },
    payment_method: {
      type: String,
      enum: ['card', 'twint', 'postfinance', 'invoice'],
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'CANCELLED'],
      default: 'PENDING',
    },
    stripe_payment_intent_id: { type: String, default: null },
    stripe_client_secret: { type: String, default: null },
    failure_reason: { type: String, default: null },
    paid_at: { type: Date, default: null },
    refunded_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

// Indexes
paymentSchema.index({ order_id: 1 });
paymentSchema.index({ user_id: 1, created_at: -1 });
paymentSchema.index({ stripe_payment_intent_id: 1 });
paymentSchema.index({ status: 1 });

const Payment = mongoose.model<IPayment>('Payment', paymentSchema);

export default Payment;
