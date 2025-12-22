import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// ─── Types ──────────────────────────────────────────────────────────────────
interface SeedCollection {
  name: string;
  file: string;
  order: number;
}

// ─── Seed config in dependency order ────────────────────────────────────────
const SEED_COLLECTIONS: SeedCollection[] = [
  { name: 'cantons', file: 'cantons.json', order: 1 },
  { name: 'cities', file: 'cities.json', order: 2 },
  { name: 'roles', file: 'roles.json', order: 3 },
  { name: 'permissions', file: 'permissions.json', order: 4 },
  { name: 'role_permissions', file: 'role_permissions.json', order: 5 },
  { name: 'brands', file: 'brands.json', order: 6 },
  { name: 'categories', file: 'categories.json', order: 7 },
  { name: 'stores', file: 'stores.json', order: 8 },
  { name: 'users', file: 'users.json', order: 9 },
  { name: 'user_roles', file: 'user_roles.json', order: 10 },
  { name: 'products', file: 'products.json', order: 11 },
  { name: 'addresses', file: 'addresses.json', order: 12 },
  { name: 'orders', file: 'orders.json', order: 13 },
  { name: 'order_items', file: 'order_items.json', order: 14 },
  { name: 'reviews', file: 'reviews.json', order: 15 },
  { name: 'wishlists', file: 'wishlists.json', order: 16 },
  { name: 'coupons', file: 'coupons.json', order: 17 },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
const DATA_DIR = path.resolve(__dirname, '../../data');

const log = (msg: string): void => {
  const ts = new Date().toISOString().slice(11, 19);
  process.stdout.write(`[${ts}] ${msg}\n`);
};

/**
 * Convert string _id fields to ObjectId recursively.
 * Handles top-level _id and known FK fields.
 */
const ID_FIELDS = new Set([
  '_id',
  'canton_id',
  'city_id',
  'parent_id',
  'brand_id',
  'category_id',
  'store_id',
  'user_id',
  'role_id',
  'permission_id',
  'product_id',
  'order_id',
  'shipping_address_id',
  'billing_address_id',
  'store_pickup_id',
  'initiated_by',
  'approved_by',
  'created_by',
  'from_store_id',
  'to_store_id',
]);

/**
 * Known date fields that should be stored as Date objects in MongoDB.
 */
const DATE_FIELDS = new Set([
  'created_at',
  'updated_at',
  'verified_at',
  'last_login_at',
  'valid_from',
  'valid_until',
  'estimated_delivery',
  'delivered_at',
  'cancelled_at',
  'shipped_at',
  'received_at',
  'last_restock_at',
  'last_sold_at',
  'release_date',
]);

/** ISO 8601 date pattern for auto-detection */
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

const convertIds = (doc: Record<string, unknown>): Record<string, unknown> => {
  const converted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(doc)) {
    if (ID_FIELDS.has(key) && typeof value === 'string' && value.length === 24) {
      converted[key] = new mongoose.Types.ObjectId(value);
    } else if (value === null) {
      converted[key] = null;
    } else if (
      DATE_FIELDS.has(key) &&
      typeof value === 'string' &&
      ISO_DATE_REGEX.test(value)
    ) {
      converted[key] = new Date(value);
    } else {
      converted[key] = value;
    }
  }

  return converted;
};

// ─── Seed Functions ─────────────────────────────────────────────────────────
const seedCollection = async (
  db: mongoose.Connection,
  collectionName: string,
  fileName: string,
): Promise<number> => {
  const filePath = path.join(DATA_DIR, fileName);

  if (!fs.existsSync(filePath)) {
    log(`  ⚠ File not found: ${fileName} — skipping`);
    return 0;
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const documents: Record<string, unknown>[] = JSON.parse(raw);

  if (!Array.isArray(documents) || documents.length === 0) {
    log(`  ⚠ Empty or invalid data in ${fileName} — skipping`);
    return 0;
  }

  // Convert string IDs to ObjectId
  const converted = documents.map(convertIds);

  // Drop existing collection
  try {
    await db.db!.collection(collectionName).drop();
  } catch {
    // Collection doesn't exist yet — that's fine
  }

  // Insert all documents
  const result = await db.db!.collection(collectionName).insertMany(converted);
  return result.insertedCount;
};

const seedAll = async (fresh: boolean): Promise<void> => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/interdiscount';
  log(`Connecting to MongoDB: ${uri}`);

  await mongoose.connect(uri);
  const db = mongoose.connection;
  log('Connected to MongoDB');

  if (fresh) {
    log('🗑  Dropping database (--fresh)...');
    await db.db!.dropDatabase();
    log('Database dropped');
  }

  log('');
  log('🌱 Starting seed...');
  log('─'.repeat(50));

  let totalInserted = 0;

  // Sort by order to respect FK dependencies
  const sorted = [...SEED_COLLECTIONS].sort((a, b) => a.order - b.order);

  for (const { name, file } of sorted) {
    const count = await seedCollection(db, name, file);
    const icon = count > 0 ? '✅' : '⏭';
    log(`  ${icon} ${name.padEnd(20)} → ${count} documents`);
    totalInserted += count;
  }

  log('─'.repeat(50));

  // ─── Generated data (store_inventory, stock_transfers, store_promotions) ──
  log('');
  log('🏭 Generating runtime seed data...');
  log('─'.repeat(50));

  const generatedCount = await generateRuntimeSeedData(db);
  totalInserted += generatedCount;

  log('─'.repeat(50));
  log(`🎉 Seed complete! ${totalInserted} total documents inserted.`);
  log('');
};

// ─── Runtime seed data generators ──────────────────────────────────────────

/**
 * Helper: pick N random items from an array.
 */
const pickRandom = <T>(arr: T[], n: number): T[] => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
};

/**
 * Helper: random integer between min and max (inclusive).
 */
const randInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Helper: random date between start and end.
 */
const randDate = (start: Date, end: Date): Date =>
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

/**
 * Store location labels for generated inventory.
 */
const STORE_LOCATIONS = [
  'Aisle 1, Shelf A',
  'Aisle 1, Shelf B',
  'Aisle 2, Shelf A',
  'Aisle 2, Shelf C',
  'Aisle 3, Shelf B',
  'Aisle 4, Shelf A',
  'Aisle 5, Shelf D',
  'Entrance Display',
  'Window Display',
  'Back Storage',
  'Checkout Area',
  'Demo Table',
];

/**
 * Generate store_inventory, stock_transfers, and store_promotions.
 */
const generateRuntimeSeedData = async (db: mongoose.Connection): Promise<number> => {
  let total = 0;

  // ── 1. Store Inventory ────────────────────────────────────────────────
  try {
    await db.db!.collection('store_inventories').drop();
  } catch {
    // OK
  }

  const stores = await db.db!.collection('stores').find({ is_active: true }).toArray();
  const products = await db.db!.collection('products').find({ is_active: true }).toArray();
  const productIds = products.map((p) => p._id);

  const inventoryDocs: Record<string, unknown>[] = [];
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  for (const store of stores) {
    // Each store carries 20-60 random products
    const storeProductCount = randInt(20, 60);
    const storeProducts = pickRandom(productIds, storeProductCount);

    for (const productId of storeProducts) {
      const quantity = randInt(0, 80);
      const minStock = randInt(2, 8);
      const maxStock = randInt(50, 150);

      inventoryDocs.push({
        _id: new mongoose.Types.ObjectId(),
        store_id: store._id,
        product_id: productId,
        quantity,
        reserved: quantity > 0 ? randInt(0, Math.min(3, quantity)) : 0,
        min_stock: minStock,
        max_stock: maxStock,
        last_restock_at: quantity > 0 ? randDate(thirtyDaysAgo, now) : null,
        last_sold_at: quantity > 0 ? randDate(thirtyDaysAgo, now) : null,
        location_in_store: STORE_LOCATIONS[randInt(0, STORE_LOCATIONS.length - 1)],
        is_display_unit: Math.random() < 0.1, // 10% are display units
        is_active: true,
        created_at: now,
        updated_at: now,
      });
    }
  }

  if (inventoryDocs.length > 0) {
    // Insert in batches of 1000 to avoid hitting limits
    const batchSize = 1000;
    for (let i = 0; i < inventoryDocs.length; i += batchSize) {
      const batch = inventoryDocs.slice(i, i + batchSize);
      await db.db!.collection('store_inventories').insertMany(batch);
    }
    total += inventoryDocs.length;
    log(`  ✅ store_inventories     → ${inventoryDocs.length} documents (${stores.length} stores × ~40 products)`);
  }

  // ── 2. Stock Transfers ────────────────────────────────────────────────
  try {
    await db.db!.collection('stock_transfers').drop();
  } catch {
    // OK
  }

  const storeManagers = await db.db!
    .collection('users')
    .find({ user_type: 'store_manager', is_active: true })
    .toArray();

  const transferStatuses = ['REQUESTED', 'APPROVED', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED'];
  const transferDocs: Record<string, unknown>[] = [];
  const transferCount = Math.min(15, stores.length);

  for (let i = 0; i < transferCount; i++) {
    const fromStore = stores[randInt(0, stores.length - 1)];
    let toStore = stores[randInt(0, stores.length - 1)];
    while (toStore._id.toString() === fromStore._id.toString()) {
      toStore = stores[randInt(0, stores.length - 1)];
    }

    const status = transferStatuses[randInt(0, transferStatuses.length - 1)];
    const initiator = storeManagers.length > 0
      ? storeManagers[randInt(0, storeManagers.length - 1)]._id
      : new mongoose.Types.ObjectId();

    const itemCount = randInt(1, 4);
    const transferProducts = pickRandom(productIds, itemCount);
    const items = transferProducts.map((pid) => {
      const qty = randInt(1, 10);
      return {
        product_id: pid,
        product_name: products.find((p) => p._id.toString() === pid.toString())?.name || 'Unknown',
        quantity: qty,
        received_quantity: status === 'RECEIVED' ? Math.max(0, qty - randInt(0, 2)) : 0,
      };
    });

    const createdAt = randDate(thirtyDaysAgo, now);
    const suffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const dateStr = createdAt.toISOString().slice(0, 10).replace(/-/g, '');

    transferDocs.push({
      _id: new mongoose.Types.ObjectId(),
      transfer_number: `TRF-${dateStr}-${suffix}`,
      from_store_id: fromStore._id,
      to_store_id: toStore._id,
      initiated_by: initiator,
      status,
      items,
      notes: `Seed transfer #${i + 1}`,
      approved_by: ['APPROVED', 'IN_TRANSIT', 'RECEIVED'].includes(status) ? initiator : null,
      shipped_at: ['IN_TRANSIT', 'RECEIVED'].includes(status) ? randDate(createdAt, now) : null,
      received_at: status === 'RECEIVED' ? randDate(createdAt, now) : null,
      created_at: createdAt,
      updated_at: now,
    });
  }

  if (transferDocs.length > 0) {
    await db.db!.collection('stock_transfers').insertMany(transferDocs);
    total += transferDocs.length;
    log(`  ✅ stock_transfers       → ${transferDocs.length} documents`);
  }

  // ── 3. Store Promotions ───────────────────────────────────────────────
  try {
    await db.db!.collection('store_promotions').drop();
  } catch {
    // OK
  }

  const promoTitles = [
    'Weekend Deal',
    'Clearance Sale',
    'New Arrivals Discount',
    'Loyalty Special',
    'Flash Sale',
    'Holiday Offer',
    'Student Discount',
    'Bundle Deal',
    'Season Clearance',
    'Grand Opening Special',
  ];

  const discountTypes = ['percentage', 'fixed', 'buy_x_get_y'];
  const promoDocs: Record<string, unknown>[] = [];
  const promoStores = pickRandom(stores, Math.min(20, stores.length));

  for (const store of promoStores) {
    const promoCount = randInt(1, 3);
    for (let j = 0; j < promoCount; j++) {
      const discountType = discountTypes[randInt(0, discountTypes.length - 1)];
      const validFrom = randDate(thirtyDaysAgo, now);
      const validUntil = new Date(validFrom.getTime() + randInt(7, 30) * 24 * 60 * 60 * 1000);
      const creator = storeManagers.length > 0
        ? storeManagers[randInt(0, storeManagers.length - 1)]._id
        : new mongoose.Types.ObjectId();

      // ~50% product-specific, ~30% category-specific, ~20% store-wide
      const roll = Math.random();
      const categories = await db.db!.collection('categories').find({ is_active: true }).limit(20).toArray();

      const doc: Record<string, unknown> = {
        _id: new mongoose.Types.ObjectId(),
        store_id: store._id,
        product_id: roll < 0.5 ? productIds[randInt(0, productIds.length - 1)] : null,
        category_id: roll >= 0.5 && roll < 0.8 && categories.length > 0
          ? categories[randInt(0, categories.length - 1)]._id
          : null,
        title: promoTitles[randInt(0, promoTitles.length - 1)],
        description: `Special promotion at ${store.name}`,
        discount_type: discountType,
        discount_value: discountType === 'percentage'
          ? randInt(5, 40)
          : discountType === 'fixed'
            ? randInt(5, 50)
            : randInt(5, 20),
        buy_quantity: discountType === 'buy_x_get_y' ? randInt(2, 3) : null,
        get_quantity: discountType === 'buy_x_get_y' ? 1 : null,
        valid_from: validFrom,
        valid_until: validUntil,
        is_active: Math.random() < 0.8,
        created_by: creator,
        created_at: validFrom,
        updated_at: now,
      };

      promoDocs.push(doc);
    }
  }

  if (promoDocs.length > 0) {
    await db.db!.collection('store_promotions').insertMany(promoDocs);
    total += promoDocs.length;
    log(`  ✅ store_promotions      → ${promoDocs.length} documents`);
  }

  return total;
};

// ─── CLI ────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const isFresh = args.includes('--fresh');
const singleCollection = args.find((a) => a.startsWith('--collection='));

if (singleCollection) {
  const name = singleCollection.split('=')[1];
  const entry = SEED_COLLECTIONS.find((c) => c.name === name);

  if (!entry) {
    log(`❌ Unknown collection: ${name}`);
    log(`   Available: ${SEED_COLLECTIONS.map((c) => c.name).join(', ')}`);
    process.exit(1);
  }

  (async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/interdiscount';
    await mongoose.connect(uri);
    log(`Seeding single collection: ${name}`);
    const count = await seedCollection(mongoose.connection, entry.name, entry.file);
    log(`✅ ${name} → ${count} documents`);
    await mongoose.disconnect();
    process.exit(0);
  })();
} else {
  seedAll(isFresh)
    .then(async () => {
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch(async (err) => {
      log(`❌ Seed failed: ${err.message}`);
      await mongoose.disconnect();
      process.exit(1);
    });
}
