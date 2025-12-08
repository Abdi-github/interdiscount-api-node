import { Types, Document } from 'mongoose';

/**
 * Stock Transfer statuses.
 */
export const TRANSFER_STATUSES = {
  REQUESTED: 'REQUESTED',
  APPROVED: 'APPROVED',
  IN_TRANSIT: 'IN_TRANSIT',
  RECEIVED: 'RECEIVED',
  CANCELLED: 'CANCELLED',
} as const;

export type TransferStatus = (typeof TRANSFER_STATUSES)[keyof typeof TRANSFER_STATUSES];

/**
 * Stock Transfer item.
 */
export interface ITransferItem {
  product_id: Types.ObjectId;
  product_name: string;
  quantity: number;
  received_quantity: number;
}

/**
 * Stock Transfer document.
 */
export interface IStockTransfer extends Document {
  _id: Types.ObjectId;
  transfer_number: string;
  from_store_id: Types.ObjectId;
  to_store_id: Types.ObjectId;
  initiated_by: Types.ObjectId;
  status: TransferStatus;
  items: ITransferItem[];
  notes: string;
  approved_by: Types.ObjectId | null;
  shipped_at: Date | null;
  received_at: Date | null;
  created_at: Date;
  updated_at: Date;
}
