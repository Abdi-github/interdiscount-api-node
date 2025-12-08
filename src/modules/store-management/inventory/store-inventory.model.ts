import mongoose, { Schema } from 'mongoose';
import { IStoreInventory } from './store-inventory.types';

const storeInventorySchema = new Schema<IStoreInventory>(
  {
    store_id: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    product_id: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    quantity: { type: Number, required: true, default: 0, min: 0 },
    reserved: { type: Number, required: true, default: 0, min: 0 },
    min_stock: { type: Number, required: true, default: 5, min: 0 },
    max_stock: { type: Number, required: true, default: 100, min: 0 },
    last_restock_at: { type: Date, default: null },
    last_sold_at: { type: Date, default: null },
    location_in_store: { type: String, default: '' },
    is_display_unit: { type: Boolean, default: false },
    is_active: { type: Boolean, default: true, index: true },
  },
  {
    collection: 'store_inventories',
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Compound unique index: one inventory record per product per store
storeInventorySchema.index({ store_id: 1, product_id: 1 }, { unique: true });

// Index for low-stock queries
storeInventorySchema.index({ store_id: 1, is_active: 1, quantity: 1 });

// Virtual: available stock
storeInventorySchema.virtual('available').get(function (this: IStoreInventory) {
  return Math.max(0, this.quantity - this.reserved);
});

const StoreInventory = mongoose.model<IStoreInventory>('StoreInventory', storeInventorySchema, 'store_inventories');

export default StoreInventory;
