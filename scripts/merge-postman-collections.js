#!/usr/bin/env node

/**
 * Merge all per-module Postman collections into a single combined collection.
 *
 * Usage: node scripts/merge-postman-collections.js
 *
 * Reads all *.postman_collection.json files from postman/ directory,
 * organizes them into sections, and outputs a single combined collection.
 */

const fs = require('fs');
const path = require('path');

const POSTMAN_DIR = path.join(__dirname, '..', 'postman');
const OUTPUT_FILE = path.join(POSTMAN_DIR, 'interdiscount-api.postman_collection.json');

// Defines the order and grouping of modules in the combined collection
const SECTION_ORDER = [
  // Health
  { module: 'health', section: null }, // top-level, no wrapper

  // Public endpoints
  { module: 'auth', section: 'Public' },
  { module: 'cantons', section: 'Public' },
  { module: 'cities', section: 'Public' },
  { module: 'stores', section: 'Public' },
  { module: 'categories', section: 'Public' },
  { module: 'brands', section: 'Public' },
  { module: 'products', section: 'Public' },
  { module: 'search', section: 'Public' },

  // Customer endpoints
  { module: 'users', section: 'Customer' },
  { module: 'addresses', section: 'Customer' },
  { module: 'orders', section: 'Customer' },
  { module: 'payments', section: 'Customer' },
  { module: 'reviews', section: 'Customer' },
  { module: 'wishlists', section: 'Customer' },
  { module: 'coupons', section: 'Customer' },
  { module: 'notifications', section: 'Customer' },

  // Store Management
  { module: 'store-management', section: 'Store Management' },

  // Admin
  { module: 'admin', section: 'Admin' },

  // Analytics
  { module: 'analytics', section: 'Analytics' },
];

function loadCollection(moduleName) {
  const filePath = path.join(POSTMAN_DIR, `${moduleName}.postman_collection.json`);
  if (!fs.existsSync(filePath)) {
    console.warn(`Warning: ${filePath} not found, skipping.`);
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function buildCombinedCollection() {
  const sections = {};
  const topLevelItems = [];

  for (const entry of SECTION_ORDER) {
    const collection = loadCollection(entry.module);
    if (!collection) continue;

    const items = collection.item || [];
    const folderItem = {
      name: collection.info.name,
      description: collection.info.description,
      item: items,
    };

    if (!entry.section) {
      // Top-level module (health)
      topLevelItems.push(folderItem);
    } else {
      if (!sections[entry.section]) {
        sections[entry.section] = [];
      }
      sections[entry.section].push(folderItem);
    }
  }

  // Build final structure
  const combinedItems = [...topLevelItems];

  for (const [sectionName, modules] of Object.entries(sections)) {
    combinedItems.push({
      name: sectionName,
      item: modules,
    });
  }

  const combined = {
    info: {
      _postman_id: 'interdiscount-api-collection-001',
      name: 'Interdiscount API',
      description:
        'API collection for the interdiscount.ch clone — Swiss electronics e-commerce platform built with Node.js, Express, TypeScript, MongoDB, and Redis.\n\n' +
        'Base URL: http://localhost:4010/api/v1\n\n' +
        'Supported languages: DE (default), EN, FR, IT\n\n' +
        'Test accounts:\n' +
        '- Admin: admin.de@interdiscount-clone.ch / Password123!\n' +
        '- Customer: customer.de@example.ch / Password123!\n' +
        '- Store Manager: manager.de@interdiscount-clone.ch / Password123!\n\n' +
        'Modules: Health, Auth, Cantons, Cities, Stores, Categories, Brands, Products, Search, Users, Addresses, Orders, Payments, Reviews, Wishlists, Coupons, Notifications, Store Management, Admin, Analytics',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    variable: [{ key: 'base_url', value: 'http://localhost:4010/api/v1' }],
    item: combinedItems,
  };

  return combined;
}

// Run
const combined = buildCombinedCollection();
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(combined, null, 2), 'utf-8');

// Count total requests
function countRequests(items) {
  let count = 0;
  for (const item of items) {
    if (item.request) count++;
    if (item.item) count += countRequests(item.item);
  }
  return count;
}

const totalRequests = countRequests(combined.item);
console.log(`✅ Combined collection written to: ${OUTPUT_FILE}`);
console.log(`   Sections: ${combined.item.length}`);
console.log(`   Total requests: ${totalRequests}`);
