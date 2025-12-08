import mongoose, { Schema } from 'mongoose';
import { IStockTransfer, TRANSFER_STATUSES } from './store-transfer.types';

const transferItemSchema = new Schema(
  {
    product_id: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    product_name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    received_quantity: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const stockTransferSchema = new Schema<IStockTransfer>(
  {
    transfer_number: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    from_store_id: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    to_store_id: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    initiated_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(TRANSFER_STATUSES),
      default: TRANSFER_STATUSES.REQUESTED,
      index: true,
    },
    items: [transferItemSchema],
    notes: { type: String, default: '' },
    approved_by: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    shipped_at: { type: Date, default: null },
    received_at: { type: Date, default: null },
  },
  {
    collection: 'stock_transfers',
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Index for store-scoped queries
stockTransferSchema.index({ from_store_id: 1, status: 1 });
stockTransferSchema.index({ to_store_id: 1, status: 1 });

const StockTransfer = mongoose.model<IStockTransfer>('StockTransfer', stockTransferSchema, 'stock_transfers');

export default StockTransfer;
