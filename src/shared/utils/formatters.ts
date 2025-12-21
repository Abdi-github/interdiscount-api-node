/**
 * Format a number as Swiss Franc currency.
 * Example: 1299 → "CHF 1'299.00"
 */
const formatCHF = (amount: number): string => {
  const formatted = amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  return `CHF ${formatted}`;
};

/**
 * Calculate discount percentage between original and current price.
 * Returns 0 if no discount.
 */
const calculateDiscountPercent = (originalPrice: number, currentPrice: number): number => {
  if (originalPrice <= 0 || originalPrice <= currentPrice) return 0;
  return Math.round((1 - currentPrice / originalPrice) * 100);
};

/**
 * Generate a unique order number.
 * Format: ORD-YYYYMMDD-XXXXX
 */
const generateOrderNumber = (): string => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `ORD-${date}-${random}`;
};

/**
 * Generate a unique transfer number.
 * Format: TRF-YYYYMMDD-XXXXX
 */
const generateTransferNumber = (): string => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `TRF-${date}-${random}`;
};

/**
 * Parse pagination parameters from query string.
 */
const parsePagination = (
  query: { page?: string; limit?: string },
  defaultLimit = 24,
  maxLimit = 100,
): { page: number; limit: number; skip: number } => {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit || String(defaultLimit), 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export {
  formatCHF,
  calculateDiscountPercent,
  generateOrderNumber,
  generateTransferNumber,
  parsePagination,
};
